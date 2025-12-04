import React from 'react';
import '../styles/Sidebar.css';


function Sidebar({ onNavigate, onLogout }) {
    return (
        <div className="sidebar">
            <h2 className="sidebar-title">Marlogas</h2>
            <ul className="sidebar-menu">
                <li onClick={() => onNavigate('dashboard')}>Inicio</li>
                <li onClick={() => onNavigate('caja')}>Caja</li>
                <li onClick={() => onNavigate('registrar')}>Registrar Despacho</li>
                <li onClick={onLogout} className="logout-item">Salir</li>
            </ul>
        </div>
    );
}

export default Sidebar;
