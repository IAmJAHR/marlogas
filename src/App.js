import { useState, useEffect } from 'react';
import AuthService from './services/AuthService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RegistrarDespacho from './components/RegistrarDespacho';
import Caja from './components/Caja';
import Reportes from './components/Reportes';
import './styles/Layout.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await authService.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo se ejecuta 1 vez

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await authService.login(username, password);
      if (userData) {
        setUser(userData);
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (error) {
      alert('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.supabase.auth.signOut();
    setUser(null);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'registrar':
        return <RegistrarDespacho />;
      case 'caja':
        return <Caja />;
      case 'reportes':
        return <Reportes />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return (
      <div className="app-container">
        <h1 className="app-title">Marlogas System</h1>
        <form onSubmit={handleLogin} className="login-form">
          <h3>Iniciar Sesión</h3>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="content">
        <div className="header">
          <span>
            Bienvenido, <strong>{user.username || 'Usuario'}</strong>
          </span>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
