import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [empresa, setEmpresa] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/empresa')
      .then(res => res.json())
      .then(data => {
        setEmpresa(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setEmpresa({ ...empresa, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMensaje(null);
    try {
      const response = await fetch('http://localhost:3001/api/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...empresa,
            factor_holgura: Number(empresa.factor_holgura),
            cupo_base_nuevos: Number(empresa.cupo_base_nuevos),
            alerta_stock_minimo: Number(empresa.alerta_stock_minimo)
        })
      });

      if (!response.ok) throw new Error('Error al guardar configuración');
      setMensaje({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message });
    }
  };

  if (loading) return <div>Cargando configuración...</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <Settings /> Configuración de la Estación
      </h2>

      {mensaje && (
        <div className={`alert alert-${mensaje.type}`}>
          {mensaje.type === 'success' && <CheckCircle size={20} />}
          {mensaje.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid-cards" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
                <label className="form-label">Nombre Comercial</label>
                <input type="text" className="form-control" name="nombre" value={empresa?.nombre || ''} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
                <label className="form-label">NIT</label>
                <input type="text" className="form-control" name="nit" value={empresa?.nit || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label className="form-label">Dirección</label>
                <input type="text" className="form-control" name="direccion" value={empresa?.direccion || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label className="form-label">Contacto / Teléfono</label>
                <input type="text" className="form-control" name="contacto" value={empresa?.contacto || ''} onChange={handleChange} required />
            </div>
        </div>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Parámetros de Control Críticos</h3>
        
        <div className="grid-cards" style={{ gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
                <label className="form-label">Factor de Holgura (Decimal, Ej: 0.10 para 10%)</label>
                <input type="number" step="0.01" className="form-control" name="factor_holgura" value={empresa?.factor_holgura || 0} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label className="form-label">Cupo Base para Clientes Nuevos (Litros)</label>
                <input type="number" className="form-control" name="cupo_base_nuevos" value={empresa?.cupo_base_nuevos || 0} onChange={handleChange} required />
            </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          <Save size={20} /> Guardar Cambios
        </button>
      </form>
    </div>
  );
}
