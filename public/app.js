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
