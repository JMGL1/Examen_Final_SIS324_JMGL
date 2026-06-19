const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Obtener todos los clientes
router.get('/', (req, res) => {
    db.all('SELECT * FROM clientes', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener cliente por placa
router.get('/placa/:placa', (req, res) => {
    db.get('SELECT * FROM clientes WHERE placa = ?', [req.params.placa.toUpperCase()], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(row);
    });
});

// Crear o actualizar cliente
router.post('/', (req, res) => {
    const { cedula_nit, nombre_razon_social, placa, tipo } = req.body;
    const placaUpper = placa.toUpperCase();

    if (!placa) {
        return res.status(400).json({ error: "Placa es obligatoria" });
    }

    // Upsert logic
    db.get('SELECT id FROM clientes WHERE placa = ?', [placaUpper], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Update
            db.run(
                'UPDATE clientes SET cedula_nit = ?, nombre_razon_social = ?, tipo = ? WHERE placa = ?',
                [cedula_nit, nombre_razon_social, tipo, placaUpper],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Cliente actualizado", id: row.id });
                }
            );
        } else {
            // Insert
            db.run(
                'INSERT INTO clientes (cedula_nit, nombre_razon_social, placa, tipo) VALUES (?, ?, ?, ?)',
                [cedula_nit || 'S/N', nombre_razon_social || 'S/N', placaUpper, tipo || 'Particular'],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Cliente creado", id: this.lastID });
                }
            );
        }
    });
});

module.exports = router;
