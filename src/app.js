require("dotenv").config();

const express = require("express");
const path = require("node:path");
const session = require("express-session");
const crypto = require("node:crypto");
const catalogo = require("./catalogo");
const auth = require("./auth");

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET es obligatorio");
}

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

app.use("/api/productos", catalogo);
app.use("/api/auth", auth);

app.get("/api", (req, res) => {
  res.json({
    nombre: "Tienda Andina",
    mensaje: "Bienvenido a Tienda Andina",
  });
});

app.use(express.static(path.join(__dirname, "../public")));

module.exports = app;
