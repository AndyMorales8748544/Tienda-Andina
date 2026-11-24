const db = require("./database");

const productos = [
  [
    "Chullo andino",
    "Textiles",
    "Chullo artesanal de lana con diseños andinos.",
    35.0,
    30,
  ],

  [
    "Poncho de alpaca",
    "Textiles",
    "Poncho elaborado con fibra de alpaca.",
    120.0,
    15,
  ],

  [
    "Manta cusqueña",
    "Textiles",
    "Manta tradicional con diseños multicolores.",
    85.0,
    20,
  ],

  [
    "Torito de Pucará",
    "Cerámica",
    "Figura decorativa tradicional de Puno.",
    45.0,
    25,
  ],

  [
    "Vasija artesanal",
    "Cerámica",
    "Vasija decorativa elaborada a mano.",
    55.0,
    12,
  ],

  [
    "Pulsera andina",
    "Accesorios",
    "Pulsera tejida con motivos tradicionales.",
    15.0,
    50,
  ],

  [
    "Bolso artesanal",
    "Accesorios",
    "Bolso tejido con diseños de la sierra peruana.",
    65.0,
    18,
  ],

  [
    "Bufanda de alpaca",
    "Textiles",
    "Bufanda suave elaborada con fibra de alpaca.",
    50.0,
    22,
  ],
];

const cantidad = db.prepare("SELECT COUNT(*) AS total FROM productos").get();

if (cantidad.total === 0) {
  const insertar = db.prepare(`
        INSERT INTO productos
        (nombre, categoria, descripcion, precio, stock)
        VALUES (?, ?, ?, ?, ?)
    `);

  for (const producto of productos) {
    insertar.run(...producto);
  }

  console.log("8 productos iniciales registrados correctamente.");
} else {
  console.log("El catálogo ya contiene productos.");
}
