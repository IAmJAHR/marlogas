import React from 'react';
import '../styles/Dashboard.css';

function Dashboard() {
    return (
        <div className="dashboard-container">
            <h2>Panel de Control</h2>
            <div className="dashboard-cards">
                <div className="card card-blue">
                    <h3>Total Vendido</h3>
                    <p>S/ 0.00</p>
                </div>
                <div className="card card-green">
                    <h3>Total Yape</h3>
                    <p>S/ 0.00</p>
                </div>
                <div className="card card-orange">
                    <h3>Total Efectivo</h3>
                    <p>S/ 0.00</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
