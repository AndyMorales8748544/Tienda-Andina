const { test, expect } = require("@playwright/test");

async function registrarCliente(page) {
  const email = `cliente-${Date.now()}@example.com`;
  const password = "Pruebas2026!";

  await page.goto("/");

  await page.locator("#btn-login").click();
  await page.locator("#mostrar-registro").click();

  await page.locator("#registro-nombre").fill("Cliente E2E");

  await page.locator("#registro-email").fill(email);

  await page.locator("#registro-password").fill(password);

  await page.locator('#form-registro button[type="submit"]').click();

  await expect(page.locator("#form-login")).toBeVisible();

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);

  await page.locator('#form-login button[type="submit"]').click();

  await expect(page.locator("#panel-cuenta")).toBeVisible();

  await page.locator("#cerrar-auth").click();
}

// E2E-001
test("Registro e inicio de sesión de un cliente", async ({ page }) => {
  await registrarCliente(page);

  await expect(page.locator("#btn-login")).toContainText("Cliente E2E");
});

// E2E-002
test("Flujo completo de compra y pago simulado", async ({ page }) => {
  await registrarCliente(page);

  await page.locator('[data-agregar="2"]').click();

  await expect(page.locator("#modal-carrito")).toBeVisible();

  await page.locator("#codigo-cupon").fill("ANDINA10");
  await page.locator("#aplicar-cupon").click();

  await expect(page.locator("#mensaje-carrito")).toContainText(
    "Cupón aplicado correctamente",
  );

  await page.locator("#btn-checkout").click();

  await expect(page.locator("#modal-checkout")).toBeVisible();

  await expect(page.locator("#resumen-checkout .estado-pedido")).toHaveText(
    "Pendiente",
  );

  await page.locator("#confirmar-pago").click();

  await expect(page.locator("#resumen-checkout .estado-pedido")).toHaveText(
    "Pagado",
  );

  await page.locator("#cerrar-checkout").click();

  await expect(page.locator("#btn-carrito")).toHaveText("Carrito (0)");

  await page.locator("#btn-pedidos").click();

  await expect(page.locator("#lista-pedidos")).toContainText("pagado");
});

// E2E-003
test("Vaciado del carrito de compras", async ({ page }) => {
  await page.goto("/");

  await page.locator('[data-agregar="1"]').click();

  await expect(page.locator("#modal-carrito")).toBeVisible();

  await expect(page.locator("#btn-carrito")).toHaveText("Carrito (1)");

  await page.locator("#vaciar-carrito").click();

  await expect(page.locator("#items-carrito")).toContainText(
    "Tu carrito está vacío",
  );

  await expect(page.locator("#btn-carrito")).toHaveText("Carrito (0)");

  await expect(page.locator("#btn-checkout")).toBeDisabled();
});
