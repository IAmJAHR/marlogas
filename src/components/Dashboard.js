import React, { useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import '../styles/Dashboard.css';

function Dashboard() {
    const supabase = AuthService.getInstance().getSupabase();
    const [totales, setTotales] = useState({
        totalVendido: 0,
        totalYape: 0,
        totalEfectivo: 0
    });

    useEffect(() => {
        fetchTotales();

        // Suscribirse a cambios en tiempo real
        const subscription = supabase
            .channel('despachos_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'despachos' },
                () => {
                    fetchTotales();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTotales = async () => {
        try {
            const { data, error } = await supabase
                .from('despachos')
                .select('precio, metodo_pago');

            if (error) throw error;

            if (data) {
                let totalVendido = 0;
                let totalYape = 0;
                let totalEfectivo = 0;

                data.forEach(despacho => {
                    const precio = parseFloat(despacho.precio) || 0;
                    const metodoPago = (despacho.metodo_pago || '').toLowerCase();

                    totalVendido += precio;

                    if (metodoPago === 'yape') {
                        totalYape += precio;
                    } else if (metodoPago === 'efectivo') {
                        totalEfectivo += precio;
                    }
                });

                setTotales({
                    totalVendido,
                    totalYape,
                    totalEfectivo
                });
            }
        } catch (error) {
            console.error('Error al obtener totales:', error);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>Panel de Control</h2>
            <div className="dashboard-cards">
                <div className="card card-blue">
                    <h3>Total Vendido</h3>
                    <p>S/ {totales.totalVendido.toFixed(2)}</p>
                </div>
                <div className="card card-green">
                    <h3>Total Yape</h3>
                    <p>S/ {totales.totalYape.toFixed(2)}</p>
                </div>
                <div className="card card-orange">
                    <h3>Total Efectivo</h3>
                    <p>S/ {totales.totalEfectivo.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
