const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

// Base de datos exclusiva para las pruebas
process.env.DB_PATH = ":memory:";
process.env.SESSION_SECRET = "clave-exclusiva-para-pruebas";

const app = require("../../src/app");
const db = require("../../src/database");

const cliente = request.agent(app);

// Datos de prueba
db.prepare(
  `
    INSERT INTO productos (
        id, nombre, categoria, descripcion, precio, stock
    )
    VALUES (?, ?, ?, ?, ?, ?)
`,
).run(1, "Poncho de alpaca", "Textiles", "Producto de prueba", 120, 20);

const datosCliente = {
  nombre: "Cliente Pruebas",
  email: "pruebas@example.com",
  password: "Pruebas2026!",
};

// CP-016
test("Consulta el catálogo de productos", async () => {
  const res = await cliente.get("/api/productos");
  assert.equal(res.status, 200);
});

// CP-017
test("Busca productos por nombre", async () => {
  const res = await cliente.get("/api/productos?buscar=Poncho");
  assert.equal(res.status, 200);
});

// CP-018
test("Filtra productos por categoría", async () => {
  const res = await cliente.get("/api/productos?categoria=Textiles");
  assert.equal(res.status, 200);
});

// CP-019
test("Consulta las categorías disponibles", async () => {
  const res = await cliente.get("/api/productos/categorias");
  assert.equal(res.status, 200);
});

// CP-020
test("Consulta el detalle de un producto", async () => {
  const res = await cliente.get("/api/productos/1");
  assert.equal(res.status, 200);
});

// CP-021
test("Rechaza la consulta de un producto inexistente", async () => {
  const res = await cliente.get("/api/productos/999");
  assert.equal(res.status, 404);
});

// CP-022
test("Rechaza un identificador inválido", async () => {
  const res = await cliente.get("/api/productos/abc");
  assert.equal(res.status, 400);
});

// CP-023
test("Registra un cliente correctamente", async () => {
  const res = await cliente.post("/api/auth/registro").send(datosCliente);

  assert.equal(res.status, 201);
});

// CP-024
test("Rechaza el registro de un correo duplicado", async () => {
  const res = await cliente.post("/api/auth/registro").send(datosCliente);

  assert.equal(res.status, 409);
});

// CP-025
test("Rechaza datos de registro incompletos", async () => {
  const res = await cliente
    .post("/api/auth/registro")
    .send({ nombre: "Prueba" });

  assert.equal(res.status, 400);
});

// CP-026
test("Inicia sesión correctamente", async () => {
  const res = await cliente.post("/api/auth/login").send({
    email: datosCliente.email,
    password: datosCliente.password,
  });

  assert.equal(res.status, 200);
});

// CP-027
test("Verifica la sesión del cliente", async () => {
  const res = await cliente.get("/api/auth/sesion");

  assert.equal(res.status, 200);
  assert.equal(res.body.autenticado, true);
});

// CP-028
test("Rechaza credenciales incorrectas", async () => {
  const res = await request(app).post("/api/auth/login").send({
    email: datosCliente.email,
    password: "Incorrecta123",
  });

  assert.equal(res.status, 401);
});

// CP-029
test("Consulta el carrito vacío", async () => {
  const res = await cliente.get("/api/carrito");

  assert.equal(res.status, 200);
  assert.equal(res.body.cantidad, 0);
});

// CP-030
test("Agrega un producto al carrito", async () => {
  const res = await cliente
    .post("/api/carrito/agregar")
    .send({ id: 1, cantidad: 1 });

  assert.equal(res.status, 200);
  assert.equal(res.body.cantidad, 1);
});

// CP-031
test("Actualiza la cantidad de un producto", async () => {
  const res = await cliente.put("/api/carrito/1").send({ cantidad: 2 });

  assert.equal(res.status, 200);
  assert.equal(res.body.cantidad, 2);
});

// CP-032
test("Rechaza cantidades superiores al stock", async () => {
  const res = await cliente.put("/api/carrito/1").send({ cantidad: 999 });

  assert.equal(res.status, 400);
});

// CP-033
test("Aplica un cupón válido al carrito", async () => {
  const res = await cliente
    .post("/api/carrito/cupon")
    .send({ cupon: "ANDINA10" });

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 254.88);
});

// CP-034
test("Rechaza un cupón inválido", async () => {
  const res = await cliente
    .post("/api/carrito/cupon")
    .send({ cupon: "INVALIDO" });

  assert.equal(res.status, 400);
});

// CP-035
test("Elimina un producto del carrito", async () => {
  const res = await cliente.delete("/api/carrito/1");

  assert.equal(res.status, 200);
  assert.equal(res.body.cantidad, 0);
});

// CP-036
test("Rechaza el checkout con carrito vacío", async () => {
  const res = await cliente.post("/api/pedidos/checkout");

  assert.equal(res.status, 400);
});

// CP-037
test("Rechaza pedidos sin autenticación", async () => {
  const res = await request(app).get("/api/pedidos");

  assert.equal(res.status, 401);
});

let pedidoId;

// CP-038
test("Registra un pedido correctamente", async () => {
  await cliente.post("/api/carrito/agregar").send({ id: 1, cantidad: 2 });

  const res = await cliente.post("/api/pedidos/checkout");

  assert.equal(res.status, 201);
  assert.equal(res.body.estado, "pendiente");

  pedidoId = res.body.pedidoId;
  assert.ok(pedidoId);
});

// CP-039
test("Confirma el pago simulado", async () => {
  const res = await cliente.post(`/api/pedidos/${pedidoId}/pagar`);

  assert.equal(res.status, 200);
  assert.equal(res.body.estado, "pagado");
});

// CP-040
test("Actualiza el pedido al estado enviado", async () => {
  const res = await cliente.post(`/api/pedidos/${pedidoId}/enviar`);

  assert.equal(res.status, 200);
  assert.equal(res.body.estado, "enviado");
});

// CP-041
test("Consulta el historial de pedidos", async () => {
  const res = await cliente.get("/api/pedidos");

  assert.equal(res.status, 200);
  assert.ok(res.body.length > 0);
});

// CP-042
test("Consulta el detalle del pedido", async () => {
  const res = await cliente.get(`/api/pedidos/${pedidoId}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.detalle.length, 1);
});

// CP-043
test("Rechaza un pedido inexistente", async () => {
  const res = await cliente.get("/api/pedidos/999");

  assert.equal(res.status, 404);
});

// CP-044
test("Verifica el carrito vacío después del checkout", async () => {
  const res = await cliente.get("/api/carrito");

  assert.equal(res.status, 200);
  assert.equal(res.body.cantidad, 0);
});

// CP-045
test("Verifica la actualización del inventario", () => {
  const producto = db
    .prepare(
      `
        SELECT stock FROM productos WHERE id = 1
    `,
    )
    .get();

  assert.equal(producto.stock, 18);
});

// CP-046
test("Vacía el carrito correctamente", async () => {
  await cliente.post("/api/carrito/agregar").send({ id: 1, cantidad: 1 });

  const res = await cliente.delete("/api/carrito");

  assert.equal(res.status, 200);
  assert.equal(res.body.cantidad, 0);
});

// CP-047
test("Cierra la sesión correctamente", async () => {
  const res = await cliente.post("/api/auth/logout");

  assert.equal(res.status, 200);

  const sesion = await cliente.get("/api/auth/sesion");

  assert.equal(sesion.body.autenticado, false);
});
