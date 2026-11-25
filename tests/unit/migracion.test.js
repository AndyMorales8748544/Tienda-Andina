const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");

process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
process.env.SESSION_SECRET = "clave-pruebas-migracion";

const app = require("../../src/app");
const db = require("../../src/database");

const password = "PruebaMigracion2026!";
const hash = bcrypt.hashSync(password, 4);

db.prepare(
  `
    INSERT INTO clientes
    (nombre, email, password_hash, id_origen, requiere_activacion)
    VALUES (?, ?, ?, ?, ?)
`,
).run("Cliente Migrado", "migrado@example.com", hash, "TEST-001", 1);

db.prepare(
  `
    INSERT INTO clientes
    (nombre, email, password_hash)
    VALUES (?, ?, ?)
`,
).run("Cliente Activo", "activo@example.com", hash);

test("CP-057: Bloquear inicio de sesion de cliente migrado", async () => {
  const respuesta = await request(app).post("/api/auth/login").send({
    email: "migrado@example.com",
    password,
  });

  assert.equal(respuesta.status, 401);
});

test("CP-058: Permitir inicio de sesion de cliente activo", async () => {
  const respuesta = await request(app).post("/api/auth/login").send({
    email: "activo@example.com",
    password,
  });

  assert.equal(respuesta.status, 200);
});

test("CP-059: Impedir registro duplicado de cliente migrado", async () => {
  const respuesta = await request(app).post("/api/auth/registro").send({
    nombre: "Cliente Duplicado",
    email: "migrado@example.com",
    password,
  });

  assert.equal(respuesta.status, 409);
});
