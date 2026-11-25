const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
process.env.SESSION_SECRET = "clave-pruebas-observabilidad";
process.env.APP_ENV = "staging";
process.env.ENABLE_INCIDENT_SIMULATION = "false";

const app = require("../../src/app");

test("CP-048: Health Check disponible", async () => {
  const respuesta = await request(app).get("/health");

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.body.status, "UP");
  assert.equal(respuesta.body.baseDatos, "UP");
});

test("CP-049: Identificador unico de peticion", async () => {
  const respuesta = await request(app).get("/health");

  assert.ok(respuesta.headers["x-request-id"]);
});

test("CP-050: Endpoint de metricas disponible", async () => {
  const respuesta = await request(app).get("/metrics");

  assert.equal(respuesta.status, 200);
  assert.equal(typeof respuesta.body.pedidos, "number");
  assert.equal(typeof respuesta.body.peticiones, "number");
  assert.equal(typeof respuesta.body.tiempoRespuestaMs, "number");
  assert.equal(typeof respuesta.body.errores5xx, "number");
});

test("CP-051: Estado inicial de alerta normal", async () => {
  const respuesta = await request(app).get("/metrics");

  assert.equal(respuesta.body.alerta, "NORMAL");
  assert.equal(respuesta.body.errores5xx, 0);
});

test("CP-052: Simulacion deshabilitada", async () => {
  const respuesta = await request(app).post("/api/simular-incidente");

  assert.equal(respuesta.status, 404);
});

test("CP-053: Simulacion bloqueada en produccion", async () => {
  process.env.APP_ENV = "produccion";
  process.env.ENABLE_INCIDENT_SIMULATION = "true";

  try {
    const respuesta = await request(app).post("/api/simular-incidente");

    assert.equal(respuesta.status, 404);
  } finally {
    process.env.APP_ENV = "staging";
    process.env.ENABLE_INCIDENT_SIMULATION = "false";
  }
});

test("CP-054: Generacion de incidente HTTP 503", async () => {
  process.env.ENABLE_INCIDENT_SIMULATION = "true";

  try {
    const respuesta = await request(app).post("/api/simular-incidente");

    assert.equal(respuesta.status, 503);
    assert.equal(respuesta.body.status, "ERROR");
    assert.ok(respuesta.body.requestId);
  } finally {
    process.env.ENABLE_INCIDENT_SIMULATION = "false";
  }
});

test("CP-055: Activacion automatica de alerta", async () => {
  const respuesta = await request(app).get("/metrics");

  assert.equal(respuesta.body.alerta, "ACTIVA");
  assert.ok(respuesta.body.errores5xx >= 1);
  assert.ok(respuesta.body.tasaErrores5xx > 0);
});

test("CP-056: Disponibilidad despues del incidente", async () => {
  const respuesta = await request(app).get("/health");

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.body.status, "UP");
  assert.equal(respuesta.body.baseDatos, "UP");
});
