const IGV = 0.18;

const CUPONES = {
  ANDINA10: 0.1,
  ANDINA20: 0.2,
};

function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function calcularSubtotal(productos) {
  return redondear(
    productos.reduce((total, p) => total + p.precio * p.cantidad, 0),
  );
}

function calcularDescuento(subtotal, cupon) {
  const codigo = String(cupon || "")
    .trim()
    .toUpperCase();

  const porcentaje = Object.hasOwn(CUPONES, codigo) ? CUPONES[codigo] : 0;

  return redondear(subtotal * porcentaje);
}

function calcularIGV(base) {
  return redondear(base * IGV);
}

function calcularTotales(productos, cupon = "") {
  const subtotal = calcularSubtotal(productos);
  const descuento = calcularDescuento(subtotal, cupon);
  const base = redondear(subtotal - descuento);
  const igv = calcularIGV(base);
  const total = redondear(base + igv);

  return {
    subtotal,
    descuento,
    base,
    igv,
    total,
  };
}

function cuponValido(cupon) {
  return Object.hasOwn(
    CUPONES,
    String(cupon || "")
      .trim()
      .toUpperCase(),
  );
}

module.exports = {
  calcularSubtotal,
  calcularDescuento,
  calcularIGV,
  calcularTotales,
  cuponValido,
};
