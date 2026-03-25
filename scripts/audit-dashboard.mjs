/**
 * audit-dashboard.mjs — Navigate every dashboard page and report JS errors.
 * Usage: npx playwright test --config=none scripts/audit-dashboard.mjs
 *   or:  node scripts/audit-dashboard.mjs
 */

import { chromium } from "playwright";

const BASE = process.env.DASHBOARD_URL || "https://app.syspaq.com";
const TENANT = "demo";
const EMAIL = "admin@syspaq-demo.com";
const PASSWORD = "demo1234";

// All dashboard routes
const PAGES = [
  "/dashboard",
  "/customers",
  "/shipments",
  "/pre-alerts",
  "/receptions",
  "/post-alerts",
  "/containers",
  "/dga",
  "/delivery-orders",
  "/invoices",
  "/payments",
  "/credit-notes",
  "/branches",
  "/rate-tables",
  "/analytics",
  "/webhooks",
  "/notifications",
  "/ecommerce",
  "/bulk-import",
  "/settings",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const results = [];
  const globalErrors = [];

  // Collect console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      globalErrors.push({ url: page.url(), text: msg.text() });
    }
  });

  page.on("pageerror", (err) => {
    globalErrors.push({ url: page.url(), text: err.message });
  });

  // ── Login ──
  console.log(`\n🔐 Logging in to ${BASE}...`);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });

  // Fill login form
  const inputs = await page.locator("input").all();
  if (inputs.length >= 3) {
    await inputs[0].fill(TENANT);   // Empresa
    await inputs[1].fill(EMAIL);    // Email
    await inputs[2].fill(PASSWORD); // Password
  } else {
    console.error("❌ Could not find login form inputs. Found:", inputs.length);
    await browser.close();
    process.exit(1);
  }

  await page.locator("button[type=submit]").click();
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});

  const currentUrl = page.url();
  if (!currentUrl.includes("/dashboard")) {
    console.error(`❌ Login failed. Still at: ${currentUrl}`);
    await browser.close();
    process.exit(1);
  }
  console.log("✅ Logged in successfully\n");

  // ── Navigate each page ──
  for (const route of PAGES) {
    const url = `${BASE}${route}`;
    const pageErrors = [];

    // Reset error collection for this page
    const errorHandler = (err) => pageErrors.push(err.message);
    const consoleHandler = (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        pageErrors.push(msg.text());
      }
    };

    page.on("pageerror", errorHandler);
    page.on("console", consoleHandler);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      // Wait a bit for lazy-loaded content
      await page.waitForTimeout(2000);
    } catch (e) {
      pageErrors.push(`Navigation error: ${e.message}`);
    }

    // Check for visible error UI
    const errorText = await page.locator("text=No se pudo cargar").count();
    const has500 = await page.locator("text=500").count();
    const hasError = await page.locator("text=Error").count();

    page.off("pageerror", errorHandler);
    page.off("console", consoleHandler);

    const status = pageErrors.length === 0 ? "✅" : "❌";
    results.push({
      route,
      errors: pageErrors,
      uiErrors: errorText + has500,
      status,
    });

    const errorSummary = pageErrors.length > 0
      ? ` — ${pageErrors.length} error(s): ${pageErrors[0].substring(0, 100)}`
      : "";
    console.log(`${status} ${route}${errorSummary}`);
  }

  // ── Try a detail page (first shipment) ──
  console.log("\n📦 Testing detail pages...");

  // Shipment detail
  await page.goto(`${BASE}/shipments`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1500);
  const shipmentLink = page.locator("a[href*='/shipments/']").first();
  if (await shipmentLink.count() > 0) {
    const detailErrors = [];
    page.on("pageerror", (err) => detailErrors.push(err.message));
    await shipmentLink.click();
    await page.waitForTimeout(3000);
    const status = detailErrors.length === 0 ? "✅" : "❌";
    const errMsg = detailErrors.length > 0 ? ` — ${detailErrors[0].substring(0, 100)}` : "";
    console.log(`${status} /shipments/:id${errMsg}`);
    results.push({ route: "/shipments/:id", errors: detailErrors, status });
  }

  // Customer detail
  await page.goto(`${BASE}/customers`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1500);
  const customerLink = page.locator("a[href*='/customers/']").first();
  if (await customerLink.count() > 0) {
    const detailErrors = [];
    page.on("pageerror", (err) => detailErrors.push(err.message));
    await customerLink.click();
    await page.waitForTimeout(3000);
    const status = detailErrors.length === 0 ? "✅" : "❌";
    const errMsg = detailErrors.length > 0 ? ` — ${detailErrors[0].substring(0, 100)}` : "";
    console.log(`${status} /customers/:id${errMsg}`);
    results.push({ route: "/customers/:id", errors: detailErrors, status });
  }

  // Container detail
  await page.goto(`${BASE}/containers`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1500);
  const containerLink = page.locator("a[href*='/containers/']").first();
  if (await containerLink.count() > 0) {
    const detailErrors = [];
    page.on("pageerror", (err) => detailErrors.push(err.message));
    await containerLink.click();
    await page.waitForTimeout(3000);
    const status = detailErrors.length === 0 ? "✅" : "❌";
    const errMsg = detailErrors.length > 0 ? ` — ${detailErrors[0].substring(0, 100)}` : "";
    console.log(`${status} /containers/:id${errMsg}`);
    results.push({ route: "/containers/:id", errors: detailErrors, status });
  }

  // Invoice detail
  await page.goto(`${BASE}/invoices`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1500);
  const invoiceLink = page.locator("a[href*='/invoices/']").first();
  if (await invoiceLink.count() > 0) {
    const detailErrors = [];
    page.on("pageerror", (err) => detailErrors.push(err.message));
    await invoiceLink.click();
    await page.waitForTimeout(3000);
    const status = detailErrors.length === 0 ? "✅" : "❌";
    const errMsg = detailErrors.length > 0 ? ` — ${detailErrors[0].substring(0, 100)}` : "";
    console.log(`${status} /invoices/:id${errMsg}`);
    results.push({ route: "/invoices/:id", errors: detailErrors, status });
  }

  await browser.close();

  // ── Report ──
  console.log("\n═══════════════════════════════════════════");
  console.log("                AUDIT REPORT               ");
  console.log("═══════════════════════════════════════════");
  const passed = results.filter((r) => r.errors.length === 0).length;
  const failed = results.filter((r) => r.errors.length > 0).length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log("\n--- Failed pages ---");
    for (const r of results.filter((r) => r.errors.length > 0)) {
      console.log(`\n❌ ${r.route}`);
      for (const e of r.errors.slice(0, 3)) {
        console.log(`   ${e.substring(0, 200)}`);
      }
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
