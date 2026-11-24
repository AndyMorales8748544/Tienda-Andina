process.env.NODE_ENV = "test";
process.env.PORT = "3100";
process.env.DB_PATH = ":memory:";
process.env.SESSION_SECRET = "clave-exclusiva-e2e";
process.env.COOKIE_SECURE = "false";

require("../src/seed");

const app = require("../src/app");

app.listen(3100, () => {
  console.log("Servidor E2E disponible en el puerto 3100");
});
