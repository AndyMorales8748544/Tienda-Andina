const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const dbPath = process.env.DB_PATH || path.join(__dirname, "../data/tienda.db");

if (dbPath !== ":memory:") {
  fs.mkdirSync(path.dirname(dbPath), {
    recursive: true,
  });
}

const db = new DatabaseSync(dbPath);

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        telefono TEXT,
        direccion TEXT
    );

    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        descripcion TEXT,
        precio REAL NOT NULL CHECK (precio >= 0),
        stock INTEGER NOT NULL CHECK (stock >= 0)
    );

    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        descuento REAL NOT NULL DEFAULT 0,
        igv REAL NOT NULL,
        total REAL NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente'
            CHECK (estado IN ('pendiente', 'pagado', 'enviado')),
        fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS detalle_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario REAL NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
`);

// Adecuacion del esquema para la migracion de datos
function agregarColumna(tabla, columna, definicion) {
  const columnas = db.prepare(`PRAGMA table_info(${tabla})`).all();

  const existe = columnas.some((campo) => campo.name === columna);

  if (!existe) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

db.exec("BEGIN IMMEDIATE");

try {
  // Campos adicionales de productos
  agregarColumna("productos", "sku", "TEXT");
  agregarColumna("productos", "proveedor", "TEXT");

  // Campos adicionales de clientes
  agregarColumna("clientes", "id_origen", "TEXT");
  agregarColumna("clientes", "distrito", "TEXT");
  agregarColumna("clientes", "fecha_registro", "TEXT");

  agregarColumna(
    "clientes",
    "requiere_activacion",
    "INTEGER NOT NULL DEFAULT 0 CHECK (requiere_activacion IN (0, 1))",
  );

  // Restricciones de unicidad para datos migrados
  db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_sku
      ON productos(sku COLLATE NOCASE);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_id_origen
      ON clientes(id_origen);
  `);

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

module.exports = db;
