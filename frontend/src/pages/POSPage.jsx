import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';

export default function POSPage() {
  const [placa, setPlaca] = useState('');
  const [litros, setLitros] = useState('');
  const [tanqueId, setTanqueId] = useState('T-01');
  const [tanques, setTanques] = useState([]);
  const [limiteInfo, setLimiteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Load tanks for the dropdown
  useEffect(() => {
    fetch('http://localhost:3001/api/tanques')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setTanques(data);
            if (data.length > 0) setTanqueId(data[0].id);
        }
      })
      .catch(err => console.error("Error loading tanks:", err));
  }, []);

  // Check quota immediately when plate changes
  useEffect(() => {
    if (placa.length >= 3) {
      const delayDebounceFn = setTimeout(() => {
        setLoading(true);
        fetch(`http://localhost:3001/api/ventas/limite/${placa}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error);
            setLimiteInfo(data);
          })
          .catch(err => {
            console.error(err);
            setLimiteInfo(null);
          })
          .finally(() => setLoading(false));
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setLimiteInfo(null);
    }
  }, [placa]);

  const handleVenta = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa,
          litros_solicitados: Number(litros),
          tanque_id: tanqueId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error procesando venta');
      }

      setMensaje({
        type: result.advertencia ? 'warning' : 'success',
        text: result.advertencia || result.message,
        alerta_stock: result.alerta_stock
      });

      // Clear form except plate to see updated limit
      setLitros('');
      // trigger limit refresh
      setPlaca(placa + ' '); setTimeout(() => setPlaca(placa.trim()), 0);

    } catch (err) {
      setMensaje({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <ShoppingCart /> Terminal de Venta (Playero)
      </h2>

      <div className="grid-cards">
        <div className="card glass-panel" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <form onSubmit={handleVenta}>
            <div className="form-group">
              <label className="form-label">Placa del Vehículo</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. 1234ABC" 
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tanque Origen (Carburante)</label>
              <select 
                className="form-control"
                value={tanqueId}
                onChange={(e) => setTanqueId(e.target.value)}
              >
                {tanques.map(t => (
                  <option key={t.id} value={t.id} style={{color: 'black'}}>{t.tipo} ({t.id}) - Disp: {t.stock_actual}L</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Litros a Despachar</label>
              <input 
                type="number" 
                step="0.1"
                className="form-control" 
                placeholder="Cantidad" 
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading || !limiteInfo || limiteInfo.limite <= 0}
            >
              {loading ? 'Procesando...' : 'Procesar Venta'}
            </button>
          </form>
        </div>

        <div>
          {/* Panel de Información del Cupo */}
          <div className="card glass-panel" style={{ background: 'rgba(0,210,255,0.05)', borderColor: 'rgba(0,210,255,0.2)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Estado del Cupo</h3>
            
            {!placa || placa.length < 3 ? (
              <p>Ingrese una placa para verificar el cupo disponible.</p>
            ) : loading && !limiteInfo ? (
              <p>Consultando historial...</p>
            ) : limiteInfo ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                  <strong style={{ color: limiteInfo.esNuevo ? 'var(--warning)' : 'var(--success)' }}>
                    {limiteInfo.esNuevo ? 'Nuevo (Cupo Base)' : 'Registrado'}
                  </strong>
                </div>
                
                {!limiteInfo.esNuevo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Promedio Semanal (Ps):</span>
                    <strong>{limiteInfo.promedioSemanal.toFixed(2)} L</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Límite Permitido Hoy:</span>
                  <strong style={{ fontSize: '1.25rem', color: limiteInfo.limite > 0 ? 'var(--primary-color)' : 'var(--danger)' }}>
                    {limiteInfo.limite} L
                  </strong>
                </div>
                
                {Number(litros) > limiteInfo.limite && (
                  <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                    <AlertTriangle size={20} />
                    La cantidad supera el límite. La venta se ajustará automáticamente a {limiteInfo.limite} L.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-danger">Error al consultar cupo.</p>
            )}
          </div>

          {/* Mensajes de feedback */}
          {mensaje && (
            <div className={`alert alert-${mensaje.type}`} style={{ marginTop: '1.5rem' }}>
              {mensaje.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <div>
                {mensaje.text}
                {mensaje.alerta_stock && (
                   <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                     {mensaje.alerta_stock}
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
