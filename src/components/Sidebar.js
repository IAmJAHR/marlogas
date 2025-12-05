import React from 'react';
import '../styles/Sidebar.css';


function Sidebar({ onNavigate, onLogout, isOpen, onToggle }) {
    return (
        <>
            <button className="hamburger-btn" onClick={onToggle}>
                ☰
            </button>
            <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
                <h2 className="sidebar-title">Marlogas</h2>
                <ul className="sidebar-menu">
                    <li onClick={() => onNavigate('dashboard')}>Inicio</li>
                    <li onClick={() => onNavigate('caja')}>Caja</li>
                    <li onClick={() => onNavigate('registrar')}>Registrar Despacho</li>
                    <li onClick={() => onNavigate('reportes')}>Reportes</li>
                    <li onClick={onLogout} className="logout-item">Salir</li>
                </ul>
            </div>
        </>
    );
}

export default Sidebar;
