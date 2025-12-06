import React, { useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import jsPDF from 'jspdf';
import '../styles/Reportes.css';

function Reportes() {
    const supabase = AuthService.getInstance().getSupabase();
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [despachos, setDespachos] = useState([]);
    const [totales, setTotales] = useState({
        totalEfectivo: 0,
        totalYape: 0,
        totalVentas: 0
    });

    useEffect(() => {
        // Establecer fechas por defecto (hoy)
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
                calcularTotales(data);
            }
        } catch (error) {
            console.error('Error al obtener despachos:', error);
        }
    };

    const calcularTotales = (data) => {
        let totalEfectivo = 0;
        let totalYape = 0;

        data.forEach(despacho => {
            const precio = parseFloat(despacho.precio) || 0;
            const metodoPago = (despacho.metodo_pago || '').toLowerCase();

            if (metodoPago === 'efectivo') {
                totalEfectivo += precio;
            } else if (metodoPago === 'yape') {
                totalYape += precio;
            }
        });

        setTotales({
            totalEfectivo,
            totalYape,
            totalVentas: totalEfectivo + totalYape
        });
    };

    const exportarPDF = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('REPORTE DE VENTAS MARLOGAS', 105, 20, { align: 'center' });

        // Fechas
        doc.setFontSize(12);
        doc.text(`Fecha Inicio: ${fechaInicio}`, 20, 35);
        doc.text(`Fecha Fin: ${fechaFin}`, 20, 42);

        // Línea separadora
        doc.line(20, 47, 190, 47);

        // Encabezados de tabla
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        let y = 55;
        doc.text('Fecha', 20, y);
        doc.text('Cliente', 50, y);
        doc.text('Gas', 90, y);
        doc.text('Agua', 110, y);
        doc.text('Precio', 130, y);
        doc.text('Método', 155, y);

        // Despachos
        doc.setFont(undefined, 'normal');
        y += 7;

        despachos.forEach((despacho, index) => {
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
        doc.save(`reporte_ventas_${fechaInicio}_${fechaFin}.pdf`);
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

            <div className="tabla-container">
                <table className="tabla-despachos">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Dirección</th>
                            <th>Gas</th>
                            <th>Agua</th>
                            <th>Precio</th>
                            <th>Método Pago</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {despachos.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center' }}>
                                    No hay despachos en este rango de fechas
                                </td>
                            </tr>
                        ) : (
                            despachos.map((despacho) => (
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
        </div>
    );
}

export default Reportes;
