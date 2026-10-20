// Isolated browser context and fictional data only. Run against npm run dev.
import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.FINFLOW_BROWSER_PATH
    ? { executablePath: process.env.FINFLOW_BROWSER_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: "fr-FR",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const output = process.env.FINFLOW_SCREENSHOTS;
const capture = async (name) => {
  if (output) {
    await fs.mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, name), fullPage: true });
  }
};
try {
  await page.goto(process.env.FINFLOW_URL || "http://127.0.0.1:5183/FinFlow/");
  await expect(
    page.getByRole("heading", { name: "Votre budget, en un regard" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Ajoutez au moins deux photos datées pour afficher l’évolution.",
    ),
  ).toBeVisible();
  const fixture = {
    version: 2,
    accounts: [
      {
        id: "sample-account",
        name: "Compte exemple",
        institution: "Banque exemple",
        kind: "current",
        balance: 500000,
        asOf: "2026-10-20",
        currency: "EUR",
      },
    ],
    transactions: [
      {
        id: "salary",
        date: "2026-09-20",
        description: "Salaire exemple",
        amount: 300000,
        kind: "income",
        category: "Revenus",
        accountId: "sample-account",
        budgetMonth: "2026-10",
        status: "booked",
        notes: "",
      },
      {
        id: "food",
        date: "2026-10-05",
        description: "Courses exemple",
        amount: -12000,
        kind: "expense",
        category: "Vie courante",
        accountId: "sample-account",
        budgetMonth: "2026-10",
        status: "booked",
        notes: "",
      },
      {
        id: "refund",
        date: "2026-10-06",
        description: "Remboursement exemple",
        amount: 2000,
        kind: "refund",
        category: "Vie courante",
        accountId: "sample-account",
        budgetMonth: "2026-10",
        status: "booked",
        notes: "",
      },
      {
        id: "saving",
        date: "2026-10-07",
        description: "Épargne exemple",
        amount: -20000,
        kind: "saving",
        category: "Épargne de sécurité",
        accountId: "sample-account",
        budgetMonth: "2026-10",
        status: "booked",
        notes: "",
      },
      {
        id: "pending",
        date: "2026-10-08",
        description: "En attente exemple",
        amount: -90000,
        kind: "expense",
        category: "Vie courante",
        accountId: "sample-account",
        budgetMonth: "2026-10",
        status: "pending",
        notes: "",
      },
      {
        id: "transfer",
        date: "2026-10-09",
        description: "Transfert exemple",
        amount: -70000,
        kind: "transfer",
        category: "Hors budget / transfert",
        accountId: "sample-account",
        budgetMonth: "2026-10",
        status: "booked",
        notes: "",
      },
    ],
    recurring: [],
    commitments: [],
    goals: [
      {
        id: "goal",
        name: "Voyage exemple",
        target: 200000,
        current: 50000,
        targetDate: "2027-07-01",
        monthly: 15000,
        active: true,
      },
    ],
    snapshots: [
      {
        id: "s1",
        date: "2026-09-30",
        assets: 450000,
        otherDebts: 0,
        creditDebt: 0,
        checking: 450000,
        buffer: 50000,
      },
      {
        id: "s2",
        date: "2026-10-20",
        assets: 500000,
        otherDebts: 0,
        creditDebt: 0,
        checking: 500000,
        buffer: 50000,
      },
    ],
    plans: [
      {
        month: "2026-10",
        income: 300000,
        exceptional: 0,
        refundTax: null,
        fixedAdjustment: 0,
        categories: { "Vie courante": 30000, "Épargne de sécurité": 20000 },
      },
    ],
    batches: [],
    ignored: [],
    rules: [],
    settings: {
      theme: "dark",
      month: "2026-10",
      buffer: 50000,
      lastExport: new Date().toISOString(),
    },
  };
  await page.getByRole("button", { name: "Sauvegardes", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "fictional-budget.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
  await page.getByRole("button", { name: "Confirmer la restauration" }).click();
  await page
    .getByRole("button", { name: "Vue d’ensemble", exact: true })
    .click();
  const metric = (label) =>
    page.getByText(label, { exact: true }).locator("../..");
  await expect(metric("Revenus enregistrés")).toContainText("3 000,00");
  await expect(metric("Dépenses nettes enregistrées")).toContainText("100,00");
  await expect(metric("Épargne + investissements réalisés")).toContainText(
    "200,00",
  );
  await expect(page.getByText("25 %", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Ajoutez au moins deux photos datées pour afficher l’évolution.",
    ),
  ).toHaveCount(0);
  await capture("finflow-dashboard-dark.png");
  await page.getByRole("button", { name: "Mois suivant", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Mois budgétaire", exact: true }),
  ).toHaveText("novembre");
  await expect(metric("Revenus enregistrés")).toContainText("0,00");
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Mois budgétaire", exact: true }),
  ).toHaveText("novembre");
  await page
    .getByRole("button", { name: "Mois précédent", exact: true })
    .click();
  await expect(metric("Revenus enregistrés")).toContainText("3 000,00");
  await page
    .getByRole("combobox", { name: "Mois budgétaire", exact: true })
    .click();
  await page.getByRole("option", { name: "décembre", exact: true }).click();
  await page.getByRole("button", { name: "Mois suivant", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Mois budgétaire", exact: true }),
  ).toHaveText("janvier");
  await expect(
    page.getByRole("combobox", { name: "Année", exact: true }),
  ).toHaveText("2027");
  await page.getByRole("combobox", { name: "Année", exact: true }).click();
  await page.getByRole("option", { name: "2026", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Mois budgétaire", exact: true })
    .click();
  await page.getByRole("option", { name: "octobre", exact: true }).click();
  await page.getByRole("button", { name: "Activer le thème clair" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Activer le thème sombre" }),
  ).toBeVisible();
  await capture("finflow-dashboard-light.png");
  await page.getByRole("button", { name: "Activer le thème sombre" }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(
      page.getByRole("button", { name: "Ouvrir le menu" }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) throw Error(`Horizontal overflow at ${width}px`);
    if (width === 390) await capture("finflow-dashboard-mobile.png");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page
      .getByRole("button", { name: "Budget mensuel", exact: true })
      .last()
      .click();
    await expect(
      page.getByRole("button", { name: "Modifier le mois" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page
      .getByRole("button", { name: "Vue d’ensemble", exact: true })
      .last()
      .click();
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "Dashboard checks passed: refunds, savings, pending/transfer exclusion, real history, goals, month navigation and rollover, persisted month/theme, mobile menu, 320/390px overflow, no runtime errors.",
  );
} finally {
  await browser.close();
}
