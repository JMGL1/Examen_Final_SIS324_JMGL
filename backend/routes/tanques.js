const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Obtener todos los tanques
router.get('/', (req, res) => {
    db.all('SELECT * FROM tanques', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Obtener un tanque por ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM tanques WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Tanque no encontrado" });
        }
        res.json(row);
    });
});

// Registrar ingreso a un tanque (abastecimiento)
router.post('/ingreso', (req, res) => {
    const { tanque_id, litros, factura_proveedor } = req.body;
    
    if (!tanque_id || !litros || litros <= 0) {
        return res.status(400).json({ error: "Datos de ingreso inválidos" });
    }

    db.get('SELECT capacidad_maxima, stock_actual FROM tanques WHERE id = ?', [tanque_id], (err, tanque) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tanque) return res.status(404).json({ error: "Tanque no encontrado" });

        const nuevo_stock = tanque.stock_actual + Number(litros);
        if (nuevo_stock > tanque.capacidad_maxima) {
            return res.status(400).json({ error: `El ingreso excede la capacidad máxima del tanque (${tanque.capacidad_maxima} L)` });
        }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            db.run(
                'INSERT INTO ingresos (tanque_id, litros, factura_proveedor) VALUES (?, ?, ?)',
                [tanque_id, litros, factura_proveedor],
                function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                }
            );

            db.run(
                'UPDATE tanques SET stock_actual = ? WHERE id = ?',
                [nuevo_stock, tanque_id],
                function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    db.run('COMMIT');
                    res.json({ message: "Ingreso registrado correctamente", nuevo_stock });
                }
            );
        });
    });
});

module.exports = router;
