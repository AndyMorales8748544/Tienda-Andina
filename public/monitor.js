function mostrar(id, valor) {
  document.getElementById(id).textContent = valor;
}

function mostrarEstado(id, valor, correcto) {
  const elemento = document.getElementById(id);

  elemento.textContent = valor;
  elemento.className = correcto ? "correcto" : "critico";
}

function mostrarAlerta(activa, mensaje) {
  const panel = document.getElementById("panel-alerta");

  panel.className = activa ? "alerta activa" : "alerta normal";

  mostrar("mensaje-alerta", mensaje);
}

async function actualizarDashboard() {
  try {
    const [respuestaHealth, respuestaMetricas] = await Promise.all([
      fetch("/health", { cache: "no-store" }),
      fetch("/metrics", { cache: "no-store" }),
    ]);

    const health = await respuestaHealth.json();

    mostrarEstado("estado-app", health.status, health.status === "UP");

    mostrarEstado("estado-db", health.baseDatos, health.baseDatos === "UP");

    if (!respuestaHealth.ok || !respuestaMetricas.ok) {
      throw new Error("Servicio no disponible");
    }

    const metricas = await respuestaMetricas.json();

    mostrar("ambiente", metricas.ambiente.toUpperCase());
    mostrar("pedidos", metricas.pedidos);
    mostrar("peticiones", metricas.peticiones);
    mostrar("tiempo", `${metricas.tiempoRespuestaMs} ms`);
    mostrar("errores", metricas.errores5xx);
    mostrar("tasa", `${metricas.tasaErrores5xx}%`);
    mostrar("uptime", `${health.uptime} s`);

    const alertaActiva = metricas.alerta === "ACTIVA";

    mostrarEstado("estado-alerta", metricas.alerta, !alertaActiva);

    mostrarAlerta(
      alertaActiva,
      alertaActiva
        ? `ALERTA: Se detectaron ${metricas.errores5xx} errores del servidor. Revisar los logs.`
        : "Sistema operativo. No se detectaron errores 5xx.",
    );

    mostrar("actualizacion", new Date().toLocaleString("es-PE"));
  } catch {
    mostrarEstado("estado-app", "DOWN", false);
    mostrarEstado("estado-db", "NO VERIFICADO", false);
    mostrarEstado("estado-alerta", "ACTIVA", false);

    mostrarAlerta(
      true,
      "ALERTA: No fue posible verificar la disponibilidad del sistema.",
    );
  }
}

actualizarDashboard();

setInterval(actualizarDashboard, 5000);
