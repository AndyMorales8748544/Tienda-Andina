const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: false,
  workers: 1,

  timeout: 30000,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },

  webServer: {
    command: "node scripts/start-e2e.js",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
