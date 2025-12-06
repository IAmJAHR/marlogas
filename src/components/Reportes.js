import React, { useState, useEffect, useMemo } from 'react';
import AuthService from '../services/AuthService';
import jsPDF from 'jspdf';
import '../styles/Reportes.css';

function Reportes() {
    const supabase = AuthService.getInstance().getSupabase();
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [despachos, setDespachos] = useState([]);
    const [tipoProducto, setTipoProducto] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'fecha_despacho', direction: 'desc' });

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setFechaInicio(today);
        setFechaFin(today);
    }, []);

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            fetchDespachos();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fechaInicio, fechaFin]);

    const fetchDespachos = async () => {
        try {
            const { data, error } = await supabase
                .from('despachos')
                .select('*')
                .gte('fecha_despacho', fechaInicio)
                .lte('fecha_despacho', fechaFin)
                .order('fecha_despacho', { ascending: false });

            if (error) throw error;

            if (data) {
                setDespachos(data);
            }
        } catch (error) {
            console.error('Error al obtener despachos:', error);
        }
    };

    // Filter and sort data
    const filteredDespachos = useMemo(() => {
        let filtered = [...despachos];

        // Filter by product type
        if (tipoProducto === 'agua') {
            filtered = filtered.filter(d => d.agua > 0 && d.gas === 0);
        } else if (tipoProducto === 'gas') {
            filtered = filtered.filter(d => d.gas > 0 && d.agua === 0);
        } else if (tipoProducto === 'ambos') {
            filtered = filtered.filter(d => d.agua > 0 && d.gas > 0);
        }
        // 'todos' shows all records

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(d =>
                (d.cliente || '').toLowerCase().includes(term) ||
                (d.direccion || '').toLowerCase().includes(term) ||
                (d.observaciones || '').toLowerCase().includes(term)
            );
        }

        // Sort
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle numeric values
                if (sortConfig.key === 'precio' || sortConfig.key === 'gas' || sortConfig.key === 'agua') {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [despachos, tipoProducto, searchTerm, sortConfig]);

    // Calculate totals from filtered data
    const totales = useMemo(() => {
        let totalEfectivo = 0;
        let totalYape = 0;

        filteredDespachos.forEach(despacho => {
            const precio = parseFloat(despacho.precio) || 0;
            const metodoPago = (despacho.metodo_pago || '').toLowerCase();

            if (metodoPago === 'efectivo') {
                totalEfectivo += precio;
            } else if (metodoPago === 'yape') {
                totalYape += precio;
            }
        });

        return {
            totalEfectivo,
            totalYape,
            totalVentas: totalEfectivo + totalYape
        };
    }, [filteredDespachos]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDespachos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDespachos.length / itemsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return ' ⇅';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const exportarPDF = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('REPORTE DE VENTAS MARLOGAS', 105, 20, { align: 'center' });

        // Fechas y filtros
        doc.setFontSize(12);
        doc.text(`Fecha Inicio: ${fechaInicio}`, 20, 35);
        doc.text(`Fecha Fin: ${fechaFin}`, 20, 42);

        const tipoTexto = tipoProducto === 'agua' ? 'Solo Agua' :
            tipoProducto === 'gas' ? 'Solo Gas' :
                tipoProducto === 'ambos' ? 'Ambos (Agua y Gas)' : 'Todos';
        doc.text(`Tipo: ${tipoTexto}`, 20, 49);

        // Línea separadora
        doc.line(20, 54, 190, 54);

        // Encabezados de tabla
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        let y = 62;
        doc.text('Fecha', 20, y);
        doc.text('Cliente', 50, y);
        doc.text('Gas', 90, y);
        doc.text('Agua', 110, y);
        doc.text('Precio', 130, y);
        doc.text('Método', 155, y);

        // Despachos filtrados
        doc.setFont(undefined, 'normal');
        y += 7;

        filteredDespachos.forEach((despacho) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const fecha = despacho.fecha_despacho || new Date(despacho.creado_en).toLocaleDateString('es-PE');
            doc.text(fecha, 20, y);
            doc.text(despacho.cliente || '-', 50, y);
            doc.text(despacho.gas?.toString() || '0', 90, y);
            doc.text(despacho.agua?.toString() || '0', 110, y);
            doc.text(`S/ ${parseFloat(despacho.precio).toFixed(2)}`, 130, y);
            doc.text(despacho.metodo_pago || '-', 155, y);

            y += 7;
        });

        // Línea separadora antes de totales
        y += 5;
        doc.line(20, y, 190, y);
        y += 10;

        // Totales
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(`TOTAL EFECTIVO: S/ ${totales.totalEfectivo.toFixed(2)}`, 20, y);
        y += 8;
        doc.text(`TOTAL YAPE: S/ ${totales.totalYape.toFixed(2)}`, 20, y);
        y += 8;
        doc.text(`TOTAL VENTAS: S/ ${totales.totalVentas.toFixed(2)}`, 20, y);

        // Guardar PDF
        const tipoArchivo = tipoProducto === 'todos' ? 'todos' : tipoProducto;
        doc.save(`reporte_${tipoArchivo}_${fechaInicio}_${fechaFin}.pdf`);
    };

    return (
        <div className="reportes-container">
            <h2>Reportes de Ventas</h2>

            <div className="filtros-container">
                <div className="filtro-grupo">
                    <label>Fecha Inicio:</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="input-fecha"
                    />
                </div>

                <div className="filtro-grupo">
                    <label>Fecha Fin:</label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="input-fecha"
                    />
                </div>

                <button onClick={exportarPDF} className="btn-exportar">
                    📄 Exportar PDF
                </button>
            </div>

            {/* Product Type Filter */}
            <div className="producto-filtros">
                <button
                    className={`filtro-btn ${tipoProducto === 'todos' ? 'active' : ''}`}
                    onClick={() => { setTipoProducto('todos'); setCurrentPage(1); }}
                >
                    Todos
                </button>
                <button
                    className={`filtro-btn ${tipoProducto === 'agua' ? 'active' : ''}`}
                    onClick={() => { setTipoProducto('agua'); setCurrentPage(1); }}
                >
                    Solo Agua
                </button>
                <button
                    className={`filtro-btn ${tipoProducto === 'gas' ? 'active' : ''}`}
                    onClick={() => { setTipoProducto('gas'); setCurrentPage(1); }}
                >
                    Solo Gas
                </button>
                <button
                    className={`filtro-btn ${tipoProducto === 'ambos' ? 'active' : ''}`}
                    onClick={() => { setTipoProducto('ambos'); setCurrentPage(1); }}
                >
                    Ambos (Agua y Gas)
                </button>
            </div>

            <div className="totales-resumen">
                <div className="total-card efectivo">
                    <h4>Total Efectivo</h4>
                    <p>S/ {totales.totalEfectivo.toFixed(2)}</p>
                </div>
                <div className="total-card yape">
                    <h4>Total Yape</h4>
                    <p>S/ {totales.totalYape.toFixed(2)}</p>
                </div>
                <div className="total-card ventas">
                    <h4>Total Ventas</h4>
                    <p>S/ {totales.totalVentas.toFixed(2)}</p>
                </div>
            </div>

            {/* Search and Info */}
            <div className="datatable-controls">
                <div className="datatable-info">
                    Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredDespachos.length)} de {filteredDespachos.length} registros
                    {filteredDespachos.length !== despachos.length && ` (filtrados de ${despachos.length} totales)`}
                </div>
                <div className="datatable-search">
                    <label>Buscar: </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cliente, dirección, observaciones..."
                        className="search-input"
                    />
                </div>
            </div>

            <div className="tabla-container">
                <table className="tabla-despachos">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('fecha_despacho')} style={{ cursor: 'pointer' }}>
                                Fecha{getSortIndicator('fecha_despacho')}
                            </th>
                            <th onClick={() => handleSort('cliente')} style={{ cursor: 'pointer' }}>
                                Cliente{getSortIndicator('cliente')}
                            </th>
                            <th onClick={() => handleSort('direccion')} style={{ cursor: 'pointer' }}>
                                Dirección{getSortIndicator('direccion')}
                            </th>
                            <th onClick={() => handleSort('gas')} style={{ cursor: 'pointer' }}>
                                Gas{getSortIndicator('gas')}
                            </th>
                            <th onClick={() => handleSort('agua')} style={{ cursor: 'pointer' }}>
                                Agua{getSortIndicator('agua')}
                            </th>
                            <th onClick={() => handleSort('precio')} style={{ cursor: 'pointer' }}>
                                Precio{getSortIndicator('precio')}
                            </th>
                            <th onClick={() => handleSort('metodo_pago')} style={{ cursor: 'pointer' }}>
                                Método Pago{getSortIndicator('metodo_pago')}
                            </th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center' }}>
                                    No hay despachos que coincidan con los filtros
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((despacho) => (
                                <tr key={despacho.id}>
                                    <td>{despacho.fecha_despacho || new Date(despacho.creado_en).toLocaleDateString('es-PE')}</td>
                                    <td>{despacho.cliente}</td>
                                    <td>{despacho.direccion}</td>
                                    <td>{despacho.gas}</td>
                                    <td>{despacho.agua}</td>
                                    <td>S/ {parseFloat(despacho.precio).toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${despacho.metodo_pago}`}>
                                            {despacho.metodo_pago}
                                        </span>
                                    </td>
                                    <td>{despacho.observaciones || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        Anterior
                    </button>

                    <div className="pagination-numbers">
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNum = index + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                return <span key={pageNum} className="pagination-ellipsis">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}

export default Reportes;
