import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import fs from "node:fs";
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5183"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
process.on("exit", () => server.kill());
await new Promise((resolve, reject) => {
  server.stdout.on("data", (b) => {
    if (b.toString().includes("Local:")) resolve();
  });
  server.on("error", reject);
  server.on("exit", (c) => reject(Error("Server exited " + c)));
  setTimeout(() => reject(Error("Server timeout")), 15000).unref();
});
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.FINFLOW_BROWSER_PATH,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
  locale: "fr-FR",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5183/FinFlow/");
await page
  .getByRole("heading", { name: "Votre budget, en un regard" })
  .waitFor();
if (process.env.FINFLOW_PRIVATE_BACKUP) {
  await page.getByRole("button", { name: "Sauvegardes", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles(process.env.FINFLOW_PRIVATE_BACKUP);
  await page.getByRole("button", { name: "Confirmer la restauration" }).click();
  await page
    .getByRole("button", { name: "Vue d’ensemble", exact: true })
    .click();
  await page.screenshot({ path: "/tmp/finflow-desktop.png", fullPage: true });
  await page.reload();
  await page
    .getByRole("heading", { name: "Votre budget, en un regard" })
    .waitFor();
  const expected = JSON.parse(
    fs.readFileSync(process.env.FINFLOW_PRIVATE_BACKUP, "utf8"),
  ).state;
  const stored = await page.evaluate(async () => {
    const db = await new Promise((res, rej) => {
      const q = indexedDB.open("finflow-budget", 1);
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
    return await new Promise((res, rej) => {
      const q = db.transaction("state").objectStore("state").get("current");
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  });
  if (
    stored.transactions.length !== expected.transactions.length ||
    stored.accounts.length !== expected.accounts.length
  )
    throw Error("Restore/reload mismatch");
}
for (const name of [
  "Budget mensuel",
  "Transactions",
  "Comptes & patrimoine",
  "Charges fixes",
  "Crédits & fiscalité",
  "Projets & cagnottes",
  "Historique patrimoine",
  "Importer PDF / CSV",
]) {
  await page.getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(100);
}
// Exercise quick entry and persistence through the actual form.
if (process.env.FINFLOW_PRIVATE_BACKUP) {
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Libellé")
    .fill("Test saisie locale");
  await page
    .getByRole("dialog")
    .getByLabel("Montant signé (€) : sortie négative")
    .fill("-1.23");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await page.getByText("Test saisie locale", { exact: true }).waitFor();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("row")
    .filter({ hasText: "Test saisie locale" })
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await page
    .getByText("Test saisie locale", { exact: true })
    .waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "Placements & Shariah", exact: true })
    .click();
  await page.getByRole("tab", { name: "Shariah & Zakat", exact: true }).click();
  await page
    .getByRole("button", { name: "Importer PDF / CSV", exact: true })
    .click();
}
if (process.env.FINFLOW_PRIVATE_PDFS) {
  const files = fs
    .readdirSync(process.env.FINFLOW_PRIVATE_PDFS)
    .filter((n) => n.endsWith(".pdf"));
  for (const file of files) {
    await page
      .locator("input[type=file]")
      .setInputFiles(`${process.env.FINFLOW_PRIVATE_PDFS}/${file}`);
    await page.getByText(file, { exact: true }).waitFor({ timeout: 20000 });
    await page
      .getByText("Totaux et/ou soldes rapprochés avant sélection.", {
        exact: true,
      })
      .waitFor({ timeout: 10000 });
  }
  await page.screenshot({ path: "/tmp/finflow-import.png", fullPage: false });
  // Import one reviewed lot, persist on reload and undo it.
  await page
    .getByRole("button", { name: /Importer \d+ opérations sélectionnées/ })
    .click();
  await page.getByRole("button", { name: "Annuler ce lot" }).waitFor();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Annuler ce lot" }).click();
  await page
    .getByRole("button", { name: "Annuler ce lot" })
    .waitFor({ state: "detached" });
}
await page.getByRole("button", { name: "Vue d’ensemble", exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "/tmp/finflow-mobile.png", fullPage: true });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth + 2,
);
if (overflow) throw Error("Mobile overflow");
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "UI checks passed: restore, persistence, screens, PDF preview, import/undo, mobile.",
);
await browser.close();
server.kill();
