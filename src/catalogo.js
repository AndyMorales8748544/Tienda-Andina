const express = require("express");
const db = require("./database");

const router = express.Router();

// Listar y buscar productos
router.get("/", (req, res) => {
  const buscar = String(req.query.buscar || "").trim();
  const categoria = String(req.query.categoria || "").trim();

  let sql = "SELECT * FROM productos WHERE 1 = 1";
  const parametros = [];

  if (buscar) {
    sql += " AND (nombre LIKE ? OR categoria LIKE ?)";
    parametros.push(`%${buscar}%`, `%${buscar}%`);
  }

  if (categoria) {
    sql += " AND categoria = ?";
    parametros.push(categoria);
  }

  sql += " ORDER BY id";

  const productos = db.prepare(sql).all(...parametros);

  res.json(productos);
});

// Listar categorías
router.get("/categorias", (req, res) => {
  const categorias = db
    .prepare(
      `
        SELECT DISTINCT categoria
        FROM productos
        ORDER BY categoria
    `,
    )
    .all();

  res.json(categorias.map((item) => item.categoria));
});

// Consultar detalle de un producto
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Identificador inválido",
    });
  }

  const producto = db
    .prepare(
      `
        SELECT * FROM productos WHERE id = ?
    `,
    )
    .get(id);

  if (!producto) {
    return res.status(404).json({
      error: "Producto no encontrado",
    });
  }

  res.json(producto);
});

module.exports = router;
