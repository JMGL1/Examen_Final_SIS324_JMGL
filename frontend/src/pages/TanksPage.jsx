import React, { useState, useEffect } from 'react';
import { Database, Plus } from 'lucide-react';

export default function TanksPage() {
  const [tanques, setTanques] = useState([]);
  const [ingreso, setIngreso] = useState({ tanque_id: '', litros: '', factura: '' });
  const [mensaje, setMensaje] = useState(null);

  const cargarTanques = () => {
    fetch('/api/tanques')
      .then(res => res.json())
      .then(data => {
        setTanques(data);
        if (data.length > 0 && !ingreso.tanque_id) {
          setIngreso(prev => ({ ...prev, tanque_id: data[0].id }));
        }
      });
  };

  useEffect(() => {
    cargarTanques();
    const interval = setInterval(cargarTanques, 5000); // Polling cada 5s para tiempo real
    return () => clearInterval(interval);
  }, []);

  const handleIngreso = async (e) => {
    e.preventDefault();
    setMensaje(null);

    try {
      const response = await fetch('/api/tanques/ingreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanque_id: ingreso.tanque_id,
          litros: Number(ingreso.litros),
          factura_proveedor: ingreso.factura
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setMensaje({ type: 'success', text: result.message });
      setIngreso({ ...ingreso, litros: '', factura: '' });
      cargarTanques();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message });
    }
  };

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <Database /> Gestión de Tanques
      </h2>

      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        {tanques.map(tanque => {
          const porcentaje = Math.min(100, (tanque.stock_actual / tanque.capacidad_maxima) * 100);
          const isLow = tanque.stock_actual <= tanque.stock_minimo;

          return (
            <div key={tanque.id} className="card glass-panel" style={{ alignItems: 'center', borderColor: isLow ? 'var(--danger)' : 'var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem' }}>{tanque.tipo} ({tanque.id})</h3>
              
              <div className="tank-visualizer">
                <div 
                  className={`tank-level ${isLow ? 'low' : ''}`} 
                  style={{ height: `${porcentaje}%` }} 
                />
              </div>

              <div className="tank-info">
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isLow ? 'var(--danger)' : 'white' }}>
                  {tanque.stock_actual.toLocaleString()} L
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Max: {tanque.capacidad_maxima.toLocaleString()} L <br/>
                  Mín: {tanque.stock_minimo.toLocaleString()} L
                </div>
              </div>

              {isLow && (
                <div className="alert alert-danger" style={{ marginTop: '1rem', padding: '0.5rem', fontSize: '0.8rem' }}>
                  ¡ALERTA STOCK MÍNIMO!
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Registrar Ingreso (Abastecimiento)
        </h3>

        {mensaje && (
          <div className={`alert alert-${mensaje.type}`}>{mensaje.text}</div>
        )}

        <form onSubmit={handleIngreso}>
          <div className="form-group">
            <label className="form-label">Tanque Destino</label>
            <select 
              className="form-control"
              value={ingreso.tanque_id}
              onChange={e => setIngreso({...ingreso, tanque_id: e.target.value})}
            >
              {tanques.map(t => (
                <option key={t.id} value={t.id} style={{color: 'black'}}>{t.tipo} ({t.id})</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Litros Ingresados</label>
            <input 
              type="number" 
              className="form-control"
              value={ingreso.litros}
              onChange={e => setIngreso({...ingreso, litros: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nro. Factura Proveedor</label>
            <input 
              type="text" 
              className="form-control"
              value={ingreso.factura}
              onChange={e => setIngreso({...ingreso, factura: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">Registrar Ingreso</button>
        </form>
      </div>
    </div>
  );
}
