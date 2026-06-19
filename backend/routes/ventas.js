const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Función auxiliar para realizar consultas con promesas
const getPromise = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const runPromise = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// Consultar límite de compra de un cliente
router.get('/limite/:placa', async (req, res) => {
    try {
        const placa = req.params.placa.toUpperCase();
        
        // 1. Obtener configuración empresa
        const empresa = await getPromise('SELECT factor_holgura, cupo_base_nuevos FROM empresa LIMIT 1');
        if (!empresa) return res.status(500).json({ error: "Empresa no configurada" });

        // 2. Obtener cliente
        const cliente = await getPromise('SELECT id FROM clientes WHERE placa = ?', [placa]);
        if (!cliente) {
            // Si el cliente no existe, límite = cupo_base_nuevos
            return res.json({ limite: empresa.cupo_base_nuevos, esNuevo: true, promedioSemanal: 0 });
        }

        // 3. Calcular consumo últimos 28 días
        const historyQuery = `
            SELECT SUM(litros) as total_litros 
            FROM ventas 
            WHERE cliente_id = ? 
            AND fecha_hora >= date('now', '-28 days')
        `;
        const history = await getPromise(historyQuery, [cliente.id]);
        const total_litros = history.total_litros || 0;

        // Si no tiene historial o es la primera semana, puede usar cupo base
        if (total_litros === 0) {
            return res.json({ limite: empresa.cupo_base_nuevos, esNuevo: true, promedioSemanal: 0 });
        }

        const promedioSemanal = total_litros / 4;
        const limite = promedioSemanal + (promedioSemanal * empresa.factor_holgura);

        // Si el límite calculado es menor al cupo base (por si compró muy poco), podríamos
        // respetar el límite calculado o darle el cupo base. La regla dice "promedio semanal más holgura"
        // o "clientes nuevos cupo base". Usaremos el límite calculado.
        res.json({ limite: Math.floor(limite), esNuevo: false, promedioSemanal });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Procesar Venta
router.post('/', async (req, res) => {
    const { placa, litros_solicitados, tanque_id } = req.body;
    const placaUpper = (placa || "").toUpperCase();

    if (!placaUpper || !litros_solicitados || !tanque_id) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    try {
        // 1. Obtener/Crear cliente automáticamente si no está registrado
        let cliente = await getPromise('SELECT id FROM clientes WHERE placa = ?', [placaUpper]);
        if (!cliente) {
            const insertResult = await runPromise(
                'INSERT INTO clientes (cedula_nit, nombre_razon_social, placa, tipo) VALUES (?, ?, ?, ?)',
                ['S/N', 'S/N', placaUpper, 'Particular']
            );
            cliente = { id: insertResult.lastID };
        }

        // 2. Obtener empresa y calcular límite
        const empresa = await getPromise('SELECT factor_holgura, cupo_base_nuevos FROM empresa LIMIT 1');
        const history = await getPromise(
            "SELECT SUM(litros) as total_litros FROM ventas WHERE cliente_id = ? AND fecha_hora >= date('now', '-28 days')",
            [cliente.id]
        );
        
        const total_litros = history.total_litros || 0;
        let limitePermitido = 0;
        
        if (total_litros === 0) {
            limitePermitido = empresa.cupo_base_nuevos;
        } else {
            const ps = total_litros / 4;
            limitePermitido = Math.floor(ps + (ps * empresa.factor_holgura));
        }

        // 3. Ajustar cantidad al límite
        let litrosVender = Number(litros_solicitados);
        let advertencia = null;

        if (litrosVender > limitePermitido) {
            litrosVender = limitePermitido; // Ajuste automático al límite máximo
            advertencia = `Venta ajustada. Límite máximo excedido. Se despacharán ${limitePermitido} L.`;
        }

        if (litrosVender <= 0) {
            return res.status(400).json({ error: "El límite permitido es 0 litros o la cantidad es inválida." });
        }

        // 4. Validar stock en tanque
        const tanque = await getPromise('SELECT stock_actual, stock_minimo FROM tanques WHERE id = ?', [tanque_id]);
        if (!tanque) {
            return res.status(404).json({ error: "Tanque no encontrado." });
        }

        if (tanque.stock_actual < litrosVender) {
            return res.status(400).json({ error: "Stock insuficiente en el tanque." });
        }

        const nuevo_stock = tanque.stock_actual - litrosVender;
        let alerta_stock = null;
        if (nuevo_stock <= tanque.stock_minimo) {
            alerta_stock = "ALERTA: El tanque ha alcanzado o superado el stock mínimo de seguridad.";
        }

        // 5. Transacción de venta
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run(
                'INSERT INTO ventas (cliente_id, tanque_id, litros, cupo_aplicado) VALUES (?, ?, ?, ?)',
                [cliente.id, tanque_id, litrosVender, limitePermitido],
                (err) => {
                    if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
                }
            );

            db.run(
                'UPDATE tanques SET stock_actual = ? WHERE id = ?',
                [nuevo_stock, tanque_id],
                (err) => {
                    if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
                    db.run('COMMIT');
                    res.json({
                        message: "Venta procesada con éxito.",
                        advertencia,
                        alerta_stock,
                        litros_despachados: litrosVender,
                        limite_permitido: limitePermitido
                    });
                }
            );
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
