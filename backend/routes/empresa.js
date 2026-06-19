const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Obtener configuración de la empresa
router.get('/', (req, res) => {
    db.get('SELECT * FROM empresa LIMIT 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Actualizar configuración
router.put('/', (req, res) => {
    const { nombre, nit, direccion, ciudad, contacto, alerta_stock_minimo, factor_holgura, cupo_base_nuevos } = req.body;
    
    db.run(
        `UPDATE empresa SET 
            nombre = ?, nit = ?, direccion = ?, ciudad = ?, contacto = ?, 
            alerta_stock_minimo = ?, factor_holgura = ?, cupo_base_nuevos = ?`,
        [nombre, nit, direccion, ciudad, contacto, alerta_stock_minimo, factor_holgura, cupo_base_nuevos],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Configuración actualizada', changes: this.changes });
        }
    );
});

module.exports = router;
