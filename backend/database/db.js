const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Empresa
    db.run(`
        CREATE TABLE IF NOT EXISTS empresa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            nit TEXT NOT NULL,
            direccion TEXT,
            ciudad TEXT,
            contacto TEXT,
            alerta_stock_minimo INTEGER DEFAULT 1000,
            factor_holgura REAL DEFAULT 0.10,
            cupo_base_nuevos INTEGER DEFAULT 50
        )
    `);

    // 2. Tanques
    db.run(`
        CREATE TABLE IF NOT EXISTS tanques (
            id TEXT PRIMARY KEY, -- Ej: T-01
            tipo TEXT NOT NULL CHECK(tipo IN ('Gasolina', 'Diésel')),
            capacidad_maxima INTEGER NOT NULL,
            stock_minimo INTEGER NOT NULL,
            stock_actual INTEGER DEFAULT 0
        )
    `);

    // 3. Clientes
    db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cedula_nit TEXT NOT NULL,
            nombre_razon_social TEXT NOT NULL,
            placa TEXT NOT NULL UNIQUE,
            tipo TEXT CHECK(tipo IN ('Particular', 'Transporte Público', 'Empresa')),
            estado TEXT CHECK(estado IN ('Activo', 'Suspendido')) DEFAULT 'Activo'
        )
    `);

    // 4. Ingresos
    db.run(`
        CREATE TABLE IF NOT EXISTS ingresos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanque_id TEXT NOT NULL,
            litros INTEGER NOT NULL,
            factura_proveedor TEXT,
            fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(tanque_id) REFERENCES tanques(id)
        )
    `);

    // 5. Ventas (Salidas)
    db.run(`
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            tanque_id TEXT NOT NULL,
            litros INTEGER NOT NULL,
            fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
            cupo_aplicado INTEGER NOT NULL,
            FOREIGN KEY(cliente_id) REFERENCES clientes(id),
            FOREIGN KEY(tanque_id) REFERENCES tanques(id)
        )
    `);

    // Iniciar con datos por defecto si no existen
    db.get("SELECT COUNT(*) as count FROM empresa", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO empresa (nombre, nit, direccion, ciudad, contacto) 
                    VALUES ('JMGL Petrol', '123456789', 'Av. Principal 123', 'La Paz', '77712345')`);
        }
    });

    db.get("SELECT COUNT(*) as count FROM tanques", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO tanques (id, tipo, capacidad_maxima, stock_minimo, stock_actual) VALUES 
                ('T-01', 'Gasolina', 20000, 2000, 10000),
                ('T-02', 'Diésel', 20000, 2000, 8000)
            `);
        }
    });
});

module.exports = db;
