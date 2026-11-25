require("dotenv").config();

const express = require("express");
const path = require("node:path");
const session = require("express-session");
const crypto = require("node:crypto");

const catalogo = require("./catalogo");
const auth = require("./auth");
const carrito = require("./carrito");
const pedidos = require("./pedidos");

const {
  monitorizarPeticiones,
  healthCheck,
  obtenerMetricas,
  simularIncidente,
} = require("./observabilidad");

const app = express();

// Monitorizacion de peticiones
app.use(monitorizarPeticiones);

app.use(express.json());

// Configuracion de seguridad
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET es obligatorio");
}

// Configuracion de sesiones
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  }),
);

// Endpoints de observabilidad
app.get("/health", healthCheck);
app.get("/metrics", obtenerMetricas);
app.post("/api/simular-incidente", simularIncidente);

// Rutas de negocio
app.use("/api/productos", catalogo);
app.use("/api/auth", auth);
app.use("/api/carrito", carrito);
app.use("/api/pedidos", pedidos);

// Endpoint principal
app.get("/api", (req, res) => {
  res.json({
    nombre: "Tienda Andina",
    mensaje: "Bienvenido a Tienda Andina",
  });
});

// Archivos estaticos
app.use(express.static(path.join(__dirname, "../public")));

module.exports = app;
