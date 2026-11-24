const express = require("express");
const db = require("./database");

const { calcularTotales, cuponValido } = require("./calculos");

const router = express.Router();

function obtenerCarrito(req) {
  if (!req.session.carrito) {
    req.session.carrito = [];
  }

  return req.session.carrito;
}

function responderCarrito(req, res) {
  const productos = obtenerCarrito(req);
  const cupon = req.session.cupon || "";

  res.json({
    productos,
    cupon,
    cantidad: productos.reduce((total, p) => total + p.cantidad, 0),
    ...calcularTotales(productos, cupon),
  });
}

// Consultar carrito
router.get("/", responderCarrito);

// Agregar producto
router.post("/agregar", (req, res) => {
  const id = Number(req.body.id);
  const cantidad = Number(req.body.cantidad ?? 1);

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    return res.status(400).json({
      error: "Datos inválidos",
    });
  }

  const producto = db.prepare("SELECT * FROM productos WHERE id = ?").get(id);

  if (!producto) {
    return res.status(404).json({
      error: "Producto no encontrado",
    });
  }

  const carrito = obtenerCarrito(req);
  const existente = carrito.find((p) => p.id === id);
  const nuevaCantidad = (existente?.cantidad || 0) + cantidad;

  if (nuevaCantidad > producto.stock) {
    return res.status(400).json({
      error: "Stock insuficiente",
    });
  }

  if (existente) {
    existente.cantidad = nuevaCantidad;
    existente.precio = producto.precio;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
    });
  }

  responderCarrito(req, res);
});

// Actualizar cantidad
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const cantidad = Number(req.body.cantidad);

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({
      error: "Cantidad inválida",
    });
  }

  const carrito = obtenerCarrito(req);
  const item = carrito.find((p) => p.id === id);

  if (!item) {
    return res.status(404).json({
      error: "Producto no encontrado en el carrito",
    });
  }

  const producto = db.prepare("SELECT * FROM productos WHERE id = ?").get(id);

  if (!producto || cantidad > producto.stock) {
    return res.status(400).json({
      error: "Stock insuficiente",
    });
  }

  item.cantidad = cantidad;
  item.precio = producto.precio;

  responderCarrito(req, res);
});

// Eliminar producto
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  req.session.carrito = obtenerCarrito(req).filter((p) => p.id !== id);

  responderCarrito(req, res);
});

// Aplicar cupón
router.post("/cupon", (req, res) => {
  const cupon = String(req.body.cupon || "")
    .trim()
    .toUpperCase();

  if (cupon && !cuponValido(cupon)) {
    return res.status(400).json({
      error: "Cupón inválido",
    });
  }

  req.session.cupon = cupon;

  responderCarrito(req, res);
});

// Vaciar carrito
router.delete("/", (req, res) => {
  req.session.carrito = [];
  req.session.cupon = "";

  responderCarrito(req, res);
});

module.exports = router;
