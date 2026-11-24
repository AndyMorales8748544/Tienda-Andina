const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    nombre: "Tienda Andina",
    mensaje: "Bienvenido a Tienda Andina",
  });
});

module.exports = app;
