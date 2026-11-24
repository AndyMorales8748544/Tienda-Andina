const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./database");

const router = express.Router();

// Registro de clientes
router.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (
    typeof nombre !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !nombre.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      error:
        "Datos inválidos. La contraseña debe tener al menos 8 caracteres y máximo 72 bytes.",
    });
  }

  const correo = email.trim().toLowerCase();

  const existente = db
    .prepare("SELECT id FROM clientes WHERE email = ?")
    .get(correo);

  if (existente) {
    return res.status(409).json({
      error: "El correo ya está registrado",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const resultado = db
      .prepare(
        `
            INSERT INTO clientes
            (nombre, email, password_hash)
            VALUES (?, ?, ?)
        `,
      )
      .run(nombre.trim(), correo, passwordHash);

    res.status(201).json({
      mensaje: "Registro exitoso",
      id: Number(resultado.lastInsertRowid),
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        error: "El correo ya está registrado",
      });
    }

    res.status(500).json({
      error: "No se pudo completar el registro",
    });
  }
});

// Inicio de sesión
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      error: "Complete los campos requeridos",
    });
  }

  const cliente = db
    .prepare(
      `
        SELECT * FROM clientes WHERE email = ?
    `,
    )
    .get(email.trim().toLowerCase());

  if (!cliente || !(await bcrypt.compare(password, cliente.password_hash))) {
    return res.status(401).json({
      error: "Correo o contraseña incorrectos",
    });
  }

  req.session.regenerate((error) => {
    if (error) {
      return res.status(500).json({
        error: "No se pudo iniciar la sesión",
      });
    }

    req.session.cliente = {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
    };

    res.json({
      mensaje: "Inicio de sesión exitoso",
      cliente: req.session.cliente,
    });
  });
});

// Consultar sesión actual
router.get("/sesion", (req, res) => {
  res.json({
    autenticado: Boolean(req.session.cliente),
    cliente: req.session.cliente || null,
  });
});

// Cerrar sesión
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: "No se pudo cerrar la sesión",
      });
    }

    res.clearCookie("connect.sid");
    res.json({
      mensaje: "Sesión cerrada correctamente",
    });
  });
});

module.exports = router;
