const express = require("express");
const db = require("./database");
const { calcularTotales } = require("./calculos");

const router = express.Router();

// Verificar autenticación
router.use((req, res, next) => {
  if (!req.session.cliente) {
    return res.status(401).json({
      error: "Debes iniciar sesión para continuar",
    });
  }

  next();
});

// Crear pedido
router.post("/checkout", (req, res) => {
  const carrito = req.session.carrito || [];

  if (carrito.length === 0) {
    return res.status(400).json({
      error: "El carrito está vacío",
    });
  }

  const clienteId = req.session.cliente.id;
  const cupon = req.session.cupon || "";

  db.exec("BEGIN IMMEDIATE");

  try {
    const productos = [];

    for (const item of carrito) {
      const producto = db
        .prepare(
          `
                SELECT * FROM productos WHERE id = ?
            `,
        )
        .get(item.id);

      if (!producto || producto.stock < item.cantidad) {
        db.exec("ROLLBACK");

        return res.status(400).json({
          error: `Stock insuficiente: ${item.nombre}`,
        });
      }

      productos.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
      });
    }

    const totales = calcularTotales(productos, cupon);

    const resultado = db
      .prepare(
        `
            INSERT INTO pedidos (
                cliente_id, subtotal, descuento,
                igv, total, estado
            )
            VALUES (?, ?, ?, ?, ?, 'pendiente')
        `,
      )
      .run(
        clienteId,
        totales.subtotal,
        totales.descuento,
        totales.igv,
        totales.total,
      );

    const pedidoId = Number(resultado.lastInsertRowid);

    const insertarDetalle = db.prepare(`
            INSERT INTO detalle_pedido (
                pedido_id, producto_id,
                cantidad, precio_unitario
            )
            VALUES (?, ?, ?, ?)
        `);

    const actualizarStock = db.prepare(`
            UPDATE productos
            SET stock = stock - ?
            WHERE id = ?
        `);

    for (const producto of productos) {
      insertarDetalle.run(
        pedidoId,
        producto.id,
        producto.cantidad,
        producto.precio,
      );

      actualizarStock.run(producto.cantidad, producto.id);
    }

    db.exec("COMMIT");

    req.session.carrito = [];
    req.session.cupon = "";

    res.status(201).json({
      mensaje: "Pedido registrado correctamente",
      pedidoId,
      estado: "pendiente",
      ...totales,
    });
  } catch (error) {
    db.exec("ROLLBACK");

    console.error(error.message);

    res.status(500).json({
      error: "No se pudo registrar el pedido",
    });
  }
});

// Simular pago
router.post("/:id/pagar", (req, res) => {
  const id = Number(req.params.id);
  const clienteId = req.session.cliente.id;

  const resultado = db
    .prepare(
      `
        UPDATE pedidos
        SET estado = 'pagado'
        WHERE id = ?
        AND cliente_id = ?
        AND estado = 'pendiente'
    `,
    )
    .run(id, clienteId);

  if (resultado.changes === 0) {
    return res.status(400).json({
      error: "El pedido no está disponible para pago",
    });
  }

  res.json({
    mensaje: "Pago simulado exitosamente",
    pedidoId: id,
    estado: "pagado",
  });
});

// Simular envío
router.post("/:id/enviar", (req, res) => {
  const id = Number(req.params.id);
  const clienteId = req.session.cliente.id;

  const resultado = db
    .prepare(
      `
        UPDATE pedidos
        SET estado = 'enviado'
        WHERE id = ?
        AND cliente_id = ?
        AND estado = 'pagado'
    `,
    )
    .run(id, clienteId);

  if (resultado.changes === 0) {
    return res.status(400).json({
      error: "El pedido debe estar pagado",
    });
  }

  res.json({
    mensaje: "Envío simulado correctamente",
    pedidoId: id,
    estado: "enviado",
  });
});

// Consultar pedidos del cliente
router.get("/", (req, res) => {
  const pedidos = db
    .prepare(
      `
        SELECT *
        FROM pedidos
        WHERE cliente_id = ?
        ORDER BY id DESC
    `,
    )
    .all(req.session.cliente.id);

  res.json(pedidos);
});

// Consultar detalle de un pedido
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const pedido = db
    .prepare(
      `
        SELECT *
        FROM pedidos
        WHERE id = ? AND cliente_id = ?
    `,
    )
    .get(id, req.session.cliente.id);

  if (!pedido) {
    return res.status(404).json({
      error: "Pedido no encontrado",
    });
  }

  const detalle = db
    .prepare(
      `
        SELECT
            p.nombre,
            d.cantidad,
            d.precio_unitario
        FROM detalle_pedido d
        INNER JOIN productos p
            ON p.id = d.producto_id
        WHERE d.pedido_id = ?
    `,
    )
    .all(id);

  res.json({
    ...pedido,
    detalle,
  });
});

module.exports = router;
