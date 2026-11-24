const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calcularSubtotal,
  calcularDescuento,
  calcularIGV,
  calcularTotales,
  cuponValido,
} = require("../../src/calculos");

// CP-001
test("Calcula el subtotal de un carrito vacío", () => {
  assert.equal(calcularSubtotal([]), 0);
});

// CP-002
test("Calcula el subtotal de un producto", () => {
  const productos = [{ precio: 35, cantidad: 1 }];

  assert.equal(calcularSubtotal(productos), 35);
});

// CP-003
test("Calcula el subtotal de varias unidades", () => {
  const productos = [{ precio: 120, cantidad: 2 }];

  assert.equal(calcularSubtotal(productos), 240);
});

// CP-004
test("Calcula el subtotal de diferentes productos", () => {
  const productos = [
    { precio: 35, cantidad: 2 },
    { precio: 120, cantidad: 1 },
  ];

  assert.equal(calcularSubtotal(productos), 190);
});

// CP-005
test("Calcula correctamente el IGV del 18%", () => {
  assert.equal(calcularIGV(100), 18);
});

// CP-006
test("Calcula el IGV de un importe igual a cero", () => {
  assert.equal(calcularIGV(0), 0);
});

// CP-007
test("Aplica el cupón ANDINA10", () => {
  assert.equal(calcularDescuento(240, "ANDINA10"), 24);
});

// CP-008
test("Aplica el cupón ANDINA20", () => {
  assert.equal(calcularDescuento(100, "ANDINA20"), 20);
});

// CP-009
test("No aplica descuento con un cupón inválido", () => {
  assert.equal(calcularDescuento(100, "INVALIDO"), 0);
});

// CP-010
test("Reconoce cupones escritos en minúsculas", () => {
  assert.equal(calcularDescuento(100, "andina10"), 10);
});

// CP-011
test("Valida correctamente los cupones disponibles", () => {
  assert.equal(cuponValido("ANDINA10"), true);
  assert.equal(cuponValido("ANDINA20"), true);
  assert.equal(cuponValido("PRUEBA50"), false);
});

// CP-012
test("Calcula el total de una compra sin descuento", () => {
  const productos = [{ precio: 100, cantidad: 1 }];

  assert.deepEqual(calcularTotales(productos), {
    subtotal: 100,
    descuento: 0,
    base: 100,
    igv: 18,
    total: 118,
  });
});

// CP-013
test("Calcula el total aplicando descuento e IGV", () => {
  const productos = [{ precio: 120, cantidad: 2 }];

  assert.deepEqual(calcularTotales(productos, "ANDINA10"), {
    subtotal: 240,
    descuento: 24,
    base: 216,
    igv: 38.88,
    total: 254.88,
  });
});

// CP-014
test("Calcula los totales de un carrito vacío", () => {
  assert.deepEqual(calcularTotales([]), {
    subtotal: 0,
    descuento: 0,
    base: 0,
    igv: 0,
    total: 0,
  });
});

// CP-015
test("Redondea correctamente los importes monetarios", () => {
  const productos = [{ precio: 19.99, cantidad: 3 }];

  assert.equal(calcularSubtotal(productos), 59.97);
  assert.equal(calcularIGV(59.97), 10.79);
});
