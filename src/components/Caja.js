import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CajaService from '../services/CajaService';
import DespachoService from '../services/DespachoService';
import '../styles/Caja.css';
import '../styles/Layout.css';
import '../styles/RegistrarDespacho.css';

function Caja() {
    const [caja, setCaja] = useState(null);
    const [loading, setLoading] = useState(true);
    const [montoInicial, setMontoInicial] = useState('');
    const [despachos, setDespachos] = useState([]);
    const [resumen, setResumen] = useState({
        ventasEfectivo: 0,
        ventasYape: 0,
        totalVentas: 0,
        totalCaja: 0
    });

    const cajaService = CajaService.getInstance();
    const despachoService = DespachoService.getInstance();
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        checkCaja();
    }, []);

    const checkCaja = async () => {
        try {
            setLoading(true);
            const data = await cajaService.checkCajaDelDia(today);
            if (data) {
                setCaja(data);
                fetchDespachos(data.monto_inicial);
            } else {
                setCaja(null);
            }
        } catch (error) {
            console.error('Error checking caja:', error);
            Swal.fire('Error', 'No se pudo verificar el estado de la caja', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDespachos = async (montoInicialVal) => {
        try {
            const data = await despachoService.getDespachosByDate(today);
            setDespachos(data || []);
            calculateTotals(data || [], montoInicialVal);
        } catch (error) {
            console.error('Error fetching despachos:', error);
        }
    };

    const calculateTotals = (listaDespachos, montoInicialVal) => {
        let efectivo = 0;
        let yape = 0;

        listaDespachos.forEach(d => {
            const precio = parseFloat(d.precio) || 0;
            if (d.metodo_pago === 'Efectivo') {
                efectivo += precio;
            } else if (d.metodo_pago === 'Yape') {
                yape += precio;
            }
        });

        const totalVentas = efectivo + yape;
        const totalCaja = parseFloat(montoInicialVal) + efectivo;

        setResumen({
            ventasEfectivo: efectivo,
            ventasYape: yape,
            totalVentas: totalVentas,
            totalCaja: totalCaja
        });
    };

    const handleAperturar = async (e) => {
        e.preventDefault();
        if (!montoInicial) return;

        try {
            setLoading(true);
            const nuevaCaja = await cajaService.aperturarCaja(parseFloat(montoInicial));
            setCaja(nuevaCaja);
            fetchDespachos(nuevaCaja.monto_inicial);
            Swal.fire({
                icon: 'success',
                title: 'Caja Aperturada',
                text: `Monto inicial: S/ ${parseFloat(montoInicial).toFixed(2)}`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', 'No se pudo aperturar la caja: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarCaja = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar Caja?',
            text: "Se guardarán los totales y se cerrará el turno actual.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cerrar caja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                await cajaService.cerrarCaja(caja.id, {
                    total: resumen.totalCaja,        // Total en Caja (Inicial + Efectivo)
                    yape: resumen.ventasYape,        // Ventas Yape
                    efectivo: resumen.ventasEfectivo // Ventas Efectivo
                });

                await Swal.fire(
                    '¡Cerrada!',
                    'La caja ha sido cerrada correctamente.',
                    'success'
                );

                setCaja(null);
                setMontoInicial('');
                setDespachos([]);
                setResumen({
                    ventasEfectivo: 0,
                    ventasYape: 0,
                    totalVentas: 0,
                    totalCaja: 0
                });

            } catch (error) {
                Swal.fire('Error', 'No se pudo cerrar la caja: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && !caja) {
        return <div className="caja-container"><p>Cargando...</p></div>;
    }

    if (!caja) {
        return (
            <div className="caja-container">
                <div className="apertura-card">
                    <h3>Apertura de Caja</h3>
                    <p className="text-gray-500 mb-4">{new Date().toLocaleDateString()}</p>
                    <form onSubmit={handleAperturar}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                            Ingrese Monto Inicial
                        </label>
                        <input
                            type="number"
                            className="monto-input"
                            value={montoInicial}
                            onChange={(e) => setMontoInicial(e.target.value)}
                            placeholder="0.00"
                            step="0.10"
                            min="0"
                            required
                            autoFocus
                        />
                        <button type="submit" className="btn-primary" style={{ maxWidth: '200px', margin: '0 auto' }}>
                            Aperturar Caja
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="caja-container">
            <div className="header" style={{ justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                <div>
                    <h2>Caja del Día</h2>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6b7280' }}>
                        {new Date().toLocaleDateString()}
                    </span>
                </div>
                <button
                    onClick={handleCerrarCaja}
                    className="btn-primary"
                    style={{ backgroundColor: '#ef4444', maxWidth: '150px' }}
                >
                    Cerrar Caja
                </button>
            </div>

            <div className="summary-grid">
                <div className="summary-card initial">
                    <span>Monto Inicial</span>
                    <strong>S/ {parseFloat(caja.monto_inicial).toFixed(2)}</strong>
                </div>
                <div className="summary-card sales">
                    <span>Ventas Efectivo</span>
                    <strong>S/ {resumen.ventasEfectivo.toFixed(2)}</strong>
                </div>
                <div className="summary-card sales">
                    <span>Ventas Yape</span>
                    <strong>S/ {resumen.ventasYape.toFixed(2)}</strong>
                </div>
                <div className="summary-card sales" style={{ borderLeftColor: '#8b5cf6' }}>
                    <span>Total Ventas</span>
                    <strong>S/ {resumen.totalVentas.toFixed(2)}</strong>
                </div>
                <div className="summary-card total">
                    <span>Total en Caja (Efectivo)</span>
                    <strong>S/ {resumen.totalCaja.toFixed(2)}</strong>
                </div>
            </div>

            <div className="daily-list">
                <h3>Despachos del Día</h3>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Dirección</th>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Pago</th>
                                <th>Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {despachos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay movimientos hoy</td>
                                </tr>
                            ) : (
                                despachos.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.cliente}</td>
                                        <td>{d.direccion}</td>
                                        <td>Gas: {d.gas} / Agua: {d.agua}</td>
                                        <td style={{ fontWeight: 'bold' }}>S/ {parseFloat(d.precio).toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${d.metodo_pago === 'Yape' ? 'badge-yape' : 'badge-efectivo'}`}>
                                                {d.metodo_pago}
                                            </span>
                                        </td>
                                        <td>{new Date(d.creado_en).toLocaleTimeString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Caja;
