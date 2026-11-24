require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Tienda Andina ejecutándose en http://localhost:${PORT}`);
});
