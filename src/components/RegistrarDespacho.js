import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import DespachoService from '../services/DespachoService';
import '../styles/RegistrarDespacho.css';
import '../styles/Layout.css';

function RegistrarDespacho() {
    const [activeTab, setActiveTab] = useState('registro');
    const [despachos, setDespachos] = useState([]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        cliente: '',
        direccion: '',
        gas: 0,
        agua: 0,
        precio: '',
        metodo_pago: 'Efectivo',
        cilindro: 0,
        observaciones: ''
    });

    const despachoService = DespachoService.getInstance();

    const fetchDespachos = useCallback(async () => {
        try {
            setLoading(true);
            const data = await despachoService.getDespachosByDate(filterDate);
            setDespachos(data || []);
        } catch (error) {
            console.error('Error fetching despachos:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los despachos'
            });
        } finally {
            setLoading(false);
        }
    }, [despachoService, filterDate]);

    useEffect(() => {
        if (activeTab === 'listado') {
            fetchDespachos();
        }
    }, [activeTab, filterDate, fetchDespachos]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Show loading alert
        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            await despachoService.createDespacho(formData);

            // Success alert
            await Swal.fire({
                icon: 'success',
                title: '¡Registrado!',
                text: 'El despacho se ha guardado correctamente',
                timer: 1500,
                showConfirmButton: false
            });

            // Clear form and switch to list
            setFormData({
                cliente: '',
                direccion: '',
                gas: 0,
                agua: 0,
                precio: '',
                metodo_pago: 'Efectivo',
                cilindro: 0,
                observaciones: ''
            });
            setActiveTab('listado');

        } catch (error) {
            // Error alert
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo registrar el despacho: ' + error.message
            });
        }
    };

    return (
        <div className="despacho-container">
            <h2>Gestión de Despachos</h2>

            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'registro' ? 'active' : ''}`}
                    onClick={() => setActiveTab('registro')}
                >
                    Registrar
                </button>
                <button
                    className={`tab-button ${activeTab === 'listado' ? 'active' : ''}`}
                    onClick={() => setActiveTab('listado')}
                >
                    Listado
                </button>
            </div>

            {activeTab === 'registro' && (
                <form onSubmit={handleSubmit} className="despacho-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Cliente</label>
                            <input
                                type="text"
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="Nombre del cliente"
                            />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="Dirección de entrega"
                            />
                        </div>
                        <div className="form-group">
                            <label>Gas (Unidades)</label>
                            <input
                                type="number"
                                name="gas"
                                value={formData.gas}
                                onChange={handleChange}
                                className="input-field"
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Agua (Unidades)</label>
                            <input
                                type="number"
                                name="agua"
                                value={formData.agua}
                                onChange={handleChange}
                                className="input-field"
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio Total (S/)</label>
                            <input
                                type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                required
                                step="0.10"
                                className="input-field"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Método de Pago</label>
                            <select
                                name="metodo_pago"
                                value={formData.metodo_pago}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Yape">Yape</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Cilindro (Préstamo)</label>
                            <input
                                type="number"
                                name="cilindro"
                                value={formData.cilindro}
                                onChange={handleChange}
                                className="input-field"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Observaciones</label>
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleChange}
                            className="input-field textarea-small"
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Guardando...' : 'Registrar Despacho'}
                    </button>
                </form>
            )}

            {activeTab === 'listado' && (
                <div>
                    <div className="filter-container">
                        <label>Filtrar por Fecha:</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                        {loading && <span style={{ marginLeft: '10px', color: '#6b7280' }}>Cargando...</span>}
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Dirección</th>
                                    <th>Gas</th>
                                    <th>Agua</th>
                                    <th>Precio</th>
                                    <th>Pago</th>
                                    <th>Cilindro</th>
                                    <th>Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {despachos.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                            No hay despachos registrados para esta fecha.
                                        </td>
                                    </tr>
                                ) : (
                                    despachos.map(d => (
                                        <tr key={d.id}>
                                            <td>{d.cliente}</td>
                                            <td>{d.direccion}</td>
                                            <td>{d.gas}</td>
                                            <td>{d.agua}</td>
                                            <td style={{ fontWeight: 'bold' }}>S/ {parseFloat(d.precio).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${d.metodo_pago === 'Yape' ? 'badge-yape' : 'badge-efectivo'}`}>
                                                    {d.metodo_pago}
                                                </span>
                                            </td>
                                            <td>{d.cilindro}</td>
                                            <td>{new Date(d.creado_en).toLocaleTimeString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RegistrarDespacho;
