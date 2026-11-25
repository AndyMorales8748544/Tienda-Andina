const crypto = require("node:crypto");
const db = require("./database");

const metricas = {
  peticiones: 0,
  errores5xx: 0,
  tiempoTotal: 0,
};

function registrarLog(nivel, datos) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: nivel,
      ambiente: process.env.APP_ENV || "local",
      ...datos,
    }),
  );
}

function monitorizarPeticiones(req, res, next) {
  const inicio = process.hrtime.bigint();
  const requestId = crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const duracion = Number(process.hrtime.bigint() - inicio) / 1000000;

    metricas.peticiones++;
    metricas.tiempoTotal += duracion;

    let nivel = "info";

    if (res.statusCode >= 500) {
      metricas.errores5xx++;
      nivel = "error";
    } else if (res.statusCode >= 400) {
      nivel = "warn";
    }

    registrarLog(nivel, {
      requestId,
      metodo: req.method,
      ruta: req.originalUrl.split("?")[0],
      statusCode: res.statusCode,
      duracionMs: Number(duracion.toFixed(2)),
    });
  });

  next();
}

function healthCheck(req, res) {
  try {
    db.prepare("SELECT 1 AS ok").get();

    res.status(200).json({
      status: "UP",
      aplicacion: "Tienda Andina",
      ambiente: process.env.APP_ENV || "local",
      baseDatos: "UP",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    });
  } catch {
    res.status(503).json({
      status: "DOWN",
      aplicacion: "Tienda Andina",
      baseDatos: "DOWN",
      timestamp: new Date().toISOString(),
    });
  }
}

function obtenerMetricas(req, res) {
  const pedidos = db
    .prepare("SELECT COUNT(*) AS total FROM pedidos")
    .get().total;

  const tiempoPromedio =
    metricas.peticiones > 0 ? metricas.tiempoTotal / metricas.peticiones : 0;

  const tasaErrores =
    metricas.peticiones > 0
      ? (metricas.errores5xx / metricas.peticiones) * 100
      : 0;

  res.json({
    ambiente: process.env.APP_ENV || "local",
    pedidos,
    peticiones: metricas.peticiones,
    tiempoRespuestaMs: Number(tiempoPromedio.toFixed(2)),
    errores5xx: metricas.errores5xx,
    tasaErrores5xx: Number(tasaErrores.toFixed(2)),
    alerta: metricas.errores5xx > 0 ? "ACTIVA" : "NORMAL",
    timestamp: new Date().toISOString(),
  });
}

function simularIncidente(req, res) {
  if (
    process.env.APP_ENV !== "staging" ||
    process.env.ENABLE_INCIDENT_SIMULATION !== "true"
  ) {
    return res.status(404).json({
      mensaje: "Recurso no disponible",
    });
  }

  registrarLog("error", {
    requestId: req.requestId,
    evento: "INCIDENTE_CONTROLADO",
    causa: "Simulacion de indisponibilidad del servicio",
  });

  res.status(503).json({
    status: "ERROR",
    mensaje: "Servicio temporalmente no disponible",
    requestId: req.requestId,
  });
}

module.exports = {
  monitorizarPeticiones,
  healthCheck,
  obtenerMetricas,
  simularIncidente,
};
