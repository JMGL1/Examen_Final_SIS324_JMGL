import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Fuel, Settings, Database, LayoutDashboard } from 'lucide-react';
import POSPage from './pages/POSPage';
import TanksPage from './pages/TanksPage';
import SettingsPage from './pages/SettingsPage';

function Sidebar() {
  const location = useLocation();

  return (
    <div className="sidebar glass-panel" style={{ borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0 }}>
      <h1 className="sidebar-title">JMGL Petrol</h1>
      <nav>
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <Fuel size={20} />
          Terminal de Venta
        </Link>
        <Link to="/tanques" className={`nav-item ${location.pathname === '/tanques' ? 'active' : ''}`}>
          <Database size={20} />
          Gestión de Tanques
        </Link>
        <Link to="/config" className={`nav-item ${location.pathname === '/config' ? 'active' : ''}`}>
          <Settings size={20} />
          Configuración
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<POSPage />} />
            <Route path="/tanques" element={<TanksPage />} />
            <Route path="/config" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
