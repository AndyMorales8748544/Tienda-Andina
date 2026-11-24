const contenedor = document.getElementById("productos");
const buscar = document.getElementById("buscar");
const categoria = document.getElementById("categoria");
const modal = document.getElementById("modal-producto");

function escapar(valor) {
  const elemento = document.createElement("span");
  elemento.textContent = String(valor ?? "");
  return elemento.innerHTML;
}

function icono(tipo) {
  const iconos = {
    Textiles: "🧶",
    Cerámica: "🏺",
    Accesorios: "👜",
  };

  return iconos[tipo] || "🎁";
}

async function cargarCategorias() {
  const respuesta = await fetch("/api/productos/categorias");
  const categorias = await respuesta.json();

  categorias.forEach((item) => {
    const opcion = document.createElement("option");
    opcion.value = item;
    opcion.textContent = item;
    categoria.appendChild(opcion);
  });
}

async function cargarProductos() {
  const parametros = new URLSearchParams({
    buscar: buscar.value,
    categoria: categoria.value,
  });

  const respuesta = await fetch(`/api/productos?${parametros}`);
  const productos = await respuesta.json();

  if (productos.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  contenedor.innerHTML = productos
    .map(
      (p) => `
        <article class="producto">
            <div class="producto-imagen">
                ${icono(p.categoria)}
            </div>
            <div class="producto-info">
                <span class="categoria">${escapar(p.categoria)}</span>
                <h3>${escapar(p.nombre)}</h3>
                <p class="precio">S/ ${Number(p.precio).toFixed(2)}</p>
                <p class="stock">Stock: ${Number(p.stock)} unidades</p>
                <div class="acciones">
                    <button class="btn-secundario"
                        data-detalle="${Number(p.id)}">
                        Ver detalle
                    </button>
                    <button data-agregar="${Number(p.id)}">
                        Agregar
                    </button>
                </div>
            </div>
        </article>
    `,
    )
    .join("");
}

async function verDetalle(id) {
  const respuesta = await fetch(`/api/productos/${id}`);
  const producto = await respuesta.json();

  document.getElementById("detalle-producto").innerHTML = `
        <h2>${escapar(producto.nombre)}</h2>
        <p>${escapar(producto.descripcion)}</p>
        <p>Categoría: ${escapar(producto.categoria)}</p>
        <p class="precio">
            S/ ${Number(producto.precio).toFixed(2)}
        </p>
        <p>Stock disponible: ${Number(producto.stock)}</p>
    `;

  modal.showModal();
}

contenedor.addEventListener("click", (evento) => {
  const id = evento.target.dataset.detalle;

  if (id) {
    verDetalle(id);
  }
});

document
  .getElementById("cerrar-modal")
  .addEventListener("click", () => modal.close());

buscar.addEventListener("input", cargarProductos);
categoria.addEventListener("change", cargarProductos);

cargarCategorias();
cargarProductos();

// Autenticación de clientes

const modalAuth = document.getElementById("modal-auth");
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const mensajeAuth = document.getElementById("mensaje-auth");
const panelCuenta = document.getElementById("panel-cuenta");
const btnLogin = document.getElementById("btn-login");
const mostrarLogin = document.getElementById("mostrar-login");
const mostrarRegistro = document.getElementById("mostrar-registro");

function mensajeAutenticacion(mensaje, error = false) {
  mensajeAuth.textContent = mensaje;
  mensajeAuth.style.color = error ? "#b91c1c" : "#15803d";
}

function cambiarFormulario(registro) {
  formLogin.hidden = registro;
  formRegistro.hidden = !registro;
  mensajeAuth.textContent = "";
}

async function peticionAuth(ruta, datos) {
  const respuesta = await fetch(`/api/auth/${ruta}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || "Error de autenticación");
  }

  return resultado;
}

async function verificarSesion() {
  const respuesta = await fetch("/api/auth/sesion");
  const sesion = await respuesta.json();

  if (sesion.autenticado) {
    btnLogin.textContent = `Hola, ${sesion.cliente.nombre}`;
    formLogin.hidden = true;
    formRegistro.hidden = true;
    mostrarLogin.hidden = true;
    mostrarRegistro.hidden = true;
    panelCuenta.hidden = false;

    document.getElementById("datos-cliente").textContent =
      `${sesion.cliente.nombre} - ${sesion.cliente.email}`;
  } else {
    btnLogin.textContent = "Mi cuenta";
    panelCuenta.hidden = true;
    mostrarLogin.hidden = false;
    mostrarRegistro.hidden = false;
    cambiarFormulario(false);
  }
}

btnLogin.addEventListener("click", async () => {
  try {
    await verificarSesion();
    mensajeAuth.textContent = "";
    modalAuth.showModal();
  } catch {
    alert("No se pudo consultar la sesión.");
  }
});

mostrarLogin.addEventListener("click", () => {
  cambiarFormulario(false);
});

mostrarRegistro.addEventListener("click", () => {
  cambiarFormulario(true);
});

document
  .getElementById("cerrar-auth")
  .addEventListener("click", () => modalAuth.close());

formRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  try {
    const resultado = await peticionAuth("registro", {
      nombre: document.getElementById("registro-nombre").value,
      email: document.getElementById("registro-email").value,
      password: document.getElementById("registro-password").value,
    });

    formRegistro.reset();
    cambiarFormulario(false);

    mensajeAutenticacion(`${resultado.mensaje}. Ahora puedes iniciar sesión.`);
  } catch (error) {
    mensajeAutenticacion(error.message, true);
  }
});

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  try {
    const resultado = await peticionAuth("login", {
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value,
    });

    formLogin.reset();
    await verificarSesion();
    mensajeAutenticacion(resultado.mensaje);
  } catch (error) {
    mensajeAutenticacion(error.message, true);
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  try {
    const resultado = await peticionAuth("logout", {});
    await verificarSesion();
    mensajeAutenticacion(resultado.mensaje);
  } catch (error) {
    mensajeAutenticacion(error.message, true);
  }
});

verificarSesion().catch(() => {
  btnLogin.textContent = "Mi cuenta";
});

// Carrito de compras

const modalCarrito = document.getElementById("modal-carrito");
const btnCarrito = document.getElementById("btn-carrito");
const itemsCarrito = document.getElementById("items-carrito");
const totalesCarrito = document.getElementById("totales-carrito");
const mensajeCarrito = document.getElementById("mensaje-carrito");

function moneda(valor) {
  return `S/ ${Number(valor).toFixed(2)}`;
}

function mostrarMensajeCarrito(mensaje, error = false) {
  mensajeCarrito.textContent = mensaje;
  mensajeCarrito.style.color = error ? "#b91c1c" : "#15803d";
}

async function peticionCarrito(ruta = "", metodo = "GET", datos) {
  const opciones = {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (datos !== undefined) {
    opciones.body = JSON.stringify(datos);
  }

  const respuesta = await fetch(`/api/carrito${ruta}`, opciones);

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || "Error en el carrito");
  }

  return resultado;
}

function renderizarCarrito(carrito) {
  btnCarrito.textContent = `Carrito (${carrito.cantidad})`;

  if (carrito.productos.length === 0) {
    itemsCarrito.innerHTML = "<p>Tu carrito está vacío.</p>";
  } else {
    itemsCarrito.innerHTML = carrito.productos
      .map(
        (p) => `
            <div class="item-carrito">
                <div>
                    <h4>${escapar(p.nombre)}</h4>
                    <p>${moneda(p.precio)} por unidad</p>
                </div>

                <input type="number"
                    min="1"
                    value="${Number(p.cantidad)}"
                    data-cantidad="${Number(p.id)}"
                    aria-label="Cantidad">

                <strong>
                    ${moneda(p.precio * p.cantidad)}
                </strong>

                <button data-eliminar="${Number(p.id)}">
                    Eliminar
                </button>
            </div>
        `,
      )
      .join("");
  }

  document.getElementById("codigo-cupon").value = carrito.cupon || "";

  totalesCarrito.innerHTML = `
        <div class="fila-total">
            <span>Subtotal</span>
            <span>${moneda(carrito.subtotal)}</span>
        </div>

        <div class="fila-total">
            <span>Descuento</span>
            <span>- ${moneda(carrito.descuento)}</span>
        </div>

        <div class="fila-total">
            <span>Base imponible</span>
            <span>${moneda(carrito.base)}</span>
        </div>

        <div class="fila-total">
            <span>IGV (18%)</span>
            <span>${moneda(carrito.igv)}</span>
        </div>

        <div class="fila-total total-final">
            <span>Total a pagar</span>
            <span>${moneda(carrito.total)}</span>
        </div>
    `;

  document.getElementById("btn-checkout").disabled =
    carrito.productos.length === 0;
}

async function cargarCarrito() {
  const carrito = await peticionCarrito();
  renderizarCarrito(carrito);
}

contenedor.addEventListener("click", async (evento) => {
  const id = evento.target.dataset.agregar;

  if (!id) return;

  try {
    const carrito = await peticionCarrito("/agregar", "POST", {
      id: Number(id),
      cantidad: 1,
    });

    renderizarCarrito(carrito);
    mostrarMensajeCarrito("Producto agregado correctamente.");

    if (!modalCarrito.open) {
      modalCarrito.showModal();
    }
  } catch (error) {
    alert(error.message);
  }
});

btnCarrito.addEventListener("click", async () => {
  try {
    await cargarCarrito();
    mostrarMensajeCarrito("");
    modalCarrito.showModal();
  } catch (error) {
    alert(error.message);
  }
});

itemsCarrito.addEventListener("change", async (evento) => {
  const id = evento.target.dataset.cantidad;

  if (!id) return;

  try {
    const carrito = await peticionCarrito(`/${id}`, "PUT", {
      cantidad: Number(evento.target.value),
    });

    renderizarCarrito(carrito);
    mostrarMensajeCarrito("Cantidad actualizada.");
  } catch (error) {
    mostrarMensajeCarrito(error.message, true);
    await cargarCarrito();
  }
});

itemsCarrito.addEventListener("click", async (evento) => {
  const id = evento.target.dataset.eliminar;

  if (!id) return;

  try {
    const carrito = await peticionCarrito(`/${id}`, "DELETE");

    renderizarCarrito(carrito);
    mostrarMensajeCarrito("Producto eliminado.");
  } catch (error) {
    mostrarMensajeCarrito(error.message, true);
  }
});

document.getElementById("aplicar-cupon").addEventListener("click", async () => {
  try {
    const cupon = document.getElementById("codigo-cupon").value;

    const carrito = await peticionCarrito("/cupon", "POST", { cupon });

    renderizarCarrito(carrito);

    mostrarMensajeCarrito(
      carrito.cupon ? "Cupón aplicado correctamente." : "Cupón retirado.",
    );
  } catch (error) {
    mostrarMensajeCarrito(error.message, true);
  }
});

document
  .getElementById("vaciar-carrito")
  .addEventListener("click", async () => {
    try {
      const carrito = await peticionCarrito("", "DELETE");

      renderizarCarrito(carrito);
      mostrarMensajeCarrito("Carrito vacío.");
    } catch (error) {
      mostrarMensajeCarrito(error.message, true);
    }
  });

document
  .getElementById("cerrar-carrito")
  .addEventListener("click", () => modalCarrito.close());

cargarCarrito().catch((error) => {
  console.error(error.message);
});

// Checkout y gestión de pedidos

const modalCheckout = document.getElementById("modal-checkout");
const modalPedidos = document.getElementById("modal-pedidos");
const confirmarPago = document.getElementById("confirmar-pago");
const mensajeCheckout = document.getElementById("mensaje-checkout");
const mensajePedidos = document.getElementById("mensaje-pedidos");
const listaPedidos = document.getElementById("lista-pedidos");

let pedidoActual = null;

async function peticionPedidos(ruta = "", metodo = "GET") {
  const respuesta = await fetch(`/api/pedidos${ruta}`, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.error || "Error en el pedido");
  }

  return resultado;
}

async function clienteAutenticado() {
  const respuesta = await fetch("/api/auth/sesion");
  const sesion = await respuesta.json();

  return sesion.autenticado;
}

document
  .getElementById("btn-checkout")
  .addEventListener("click", async (evento) => {
    const boton = evento.currentTarget;
    boton.disabled = true;

    try {
      if (!(await clienteAutenticado())) {
        modalCarrito.close();
        btnLogin.click();
        mensajeAutenticacion("Inicia sesión para finalizar tu compra.");
        return;
      }

      const pedido = await peticionPedidos("/checkout", "POST");

      pedidoActual = pedido.pedidoId;

      document.getElementById("resumen-checkout").innerHTML = `
                <h3>Pedido #${Number(pedido.pedidoId)}</h3>
                <p>Subtotal: ${moneda(pedido.subtotal)}</p>
                <p>Descuento: ${moneda(pedido.descuento)}</p>
                <p>IGV: ${moneda(pedido.igv)}</p>
                <h3>Total: ${moneda(pedido.total)}</h3>
                <span class="estado-pedido estado-pendiente">
                    Pendiente
                </span>
            `;

      mensajeCheckout.textContent = "";
      confirmarPago.disabled = false;

      modalCarrito.close();
      modalCheckout.showModal();

      await cargarCarrito();
      await cargarProductos();
    } catch (error) {
      alert(error.message);
    } finally {
      await cargarCarrito().catch(() => {
        boton.disabled = false;
      });
    }
  });

confirmarPago.addEventListener("click", async () => {
  if (!pedidoActual) return;

  confirmarPago.disabled = true;

  try {
    const resultado = await peticionPedidos(`/${pedidoActual}/pagar`, "POST");

    mensajeCheckout.textContent = resultado.mensaje;
    mensajeCheckout.style.color = "#15803d";

    const estado = document.querySelector("#resumen-checkout .estado-pedido");

    estado.textContent = "Pagado";
    estado.className = "estado-pedido estado-pagado";
  } catch (error) {
    mensajeCheckout.textContent = error.message;
    mensajeCheckout.style.color = "#b91c1c";
    confirmarPago.disabled = false;
  }
});

document
  .getElementById("cerrar-checkout")
  .addEventListener("click", () => modalCheckout.close());

async function cargarPedidos() {
  const pedidos = await peticionPedidos();

  if (pedidos.length === 0) {
    listaPedidos.innerHTML = "<p>No tienes pedidos registrados.</p>";
    return;
  }

  listaPedidos.innerHTML = pedidos
    .map(
      (p) => `
        <article class="pedido">
            <h3>Pedido #${Number(p.id)}</h3>

            <p>Fecha: ${escapar(p.fecha)}</p>
            <p>Total: ${moneda(p.total)}</p>

            <span class="estado-pedido estado-${escapar(p.estado)}">
                ${escapar(p.estado)}
            </span>

            <div class="acciones">
                ${
                  p.estado === "pendiente"
                    ? `
                    <button data-pagar="${Number(p.id)}">
                        Simular pago
                    </button>
                `
                    : ""
                }

                ${
                  p.estado === "pagado"
                    ? `
                    <button data-enviar="${Number(p.id)}">
                        Simular envío
                    </button>
                `
                    : ""
                }

                <button class="btn-secundario"
                    data-ver-pedido="${Number(p.id)}">
                    Ver detalle
                </button>
            </div>

            <div id="detalle-pedido-${Number(p.id)}"></div>
        </article>
    `,
    )
    .join("");
}

document.getElementById("btn-pedidos").addEventListener("click", async () => {
  try {
    if (!(await clienteAutenticado())) {
      btnLogin.click();
      return;
    }

    await cargarPedidos();
    mensajePedidos.textContent = "";
    modalPedidos.showModal();
  } catch (error) {
    alert(error.message);
  }
});

listaPedidos.addEventListener("click", async (evento) => {
  const pagar = evento.target.dataset.pagar;
  const enviar = evento.target.dataset.enviar;
  const detalle = evento.target.dataset.verPedido;

  try {
    if (pagar || enviar) {
      const id = pagar || enviar;
      const accion = pagar ? "pagar" : "enviar";

      const resultado = await peticionPedidos(`/${id}/${accion}`, "POST");

      mensajePedidos.textContent = resultado.mensaje;
      mensajePedidos.style.color = "#15803d";

      await cargarPedidos();
    }

    if (detalle) {
      const pedido = await peticionPedidos(`/${detalle}`);

      document.getElementById(`detalle-pedido-${detalle}`).innerHTML =
        pedido.detalle
          .map(
            (p) => `
                <p>
                    ${escapar(p.nombre)} —
                    ${Number(p.cantidad)} unidad(es) —
                    ${moneda(p.precio_unitario * p.cantidad)}
                </p>
            `,
          )
          .join("");
    }
  } catch (error) {
    mensajePedidos.textContent = error.message;
    mensajePedidos.style.color = "#b91c1c";
  }
});

document
  .getElementById("cerrar-pedidos")
  .addEventListener("click", () => modalPedidos.close());
