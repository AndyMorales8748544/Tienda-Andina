const express = require("express");
const path = require("node:path");
const catalogo = require("./catalogo");

const app = express();

app.use(express.json());

app.use("/api/productos", catalogo);

app.get("/api", (req, res) => {
  res.json({
    nombre: "Tienda Andina",
    mensaje: "Bienvenido a Tienda Andina",
  });
});

app.use(express.static(path.join(__dirname, "../public")));

module.exports = app;
