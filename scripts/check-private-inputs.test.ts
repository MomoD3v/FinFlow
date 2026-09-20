// Opt-in local verification. Inputs and extracted values never belong in git.
import { it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parsePages, reconciliation } from "../src/finance/imports";
import { readBackup } from "../src/finance/storage";
import { monthly, netWorth } from "../src/finance/calculations";
const dir = process.env.FINFLOW_PRIVATE_PDFS;
it.skipIf(!dir)(
  "reconcile supplied private statements",
  async () => {
    for (const name of readdirSync(dir!).filter((n) => n.endsWith(".pdf"))) {
      const doc = await getDocument({
        data: new Uint8Array(readFileSync(`${dir}/${name}`)),
        isEvalSupported: false,
      }).promise;
      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i),
          v = p.getViewport({ scale: 1 }),
          t = await p.getTextContent();
        pages.push({
          width: v.width,
          height: v.height,
          words: t.items
            .filter((x): x is any => "str" in x)
            .map((x: any) => ({
              text: x.str,
              x: x.transform[4],
              y: v.height - x.transform[5],
              width: x.width,
            })),
        });
      }
      const parsed = parsePages(pages, "test"),
        check = reconciliation(parsed);
      console.log(
        JSON.stringify({
          name,
          rows: parsed.rows.length,
          pending: parsed.rows.filter((t) => t.status === "pending").length,
          warnings: parsed.warnings,
          check,
          controls: parsed.controls,
        }),
      );
      if (process.env.FINFLOW_DEBUG)
        console.log(
          parsed.rows.map((t) => ({
            date: t.date,
            amount: t.amount,
            desc: t.description.slice(0, 80),
          })),
        );
      expect(parsed.rows.length).toBeGreaterThan(0);
      expect(parsed.warnings).toEqual([]);
      if (check.checked) expect(check.ok).toBe(true);
      await doc.destroy();
    }
  },
  30000,
);
it.skipIf(!process.env.FINFLOW_PRIVATE_BACKUP)(
  "validate initial spreadsheet backup",
  () => {
    const s = readBackup(
      readFileSync(process.env.FINFLOW_PRIVATE_BACKUP!, "utf8"),
    );
    expect(s.plans.map((p) => p.month)).toEqual(["2026-09", "2026-10"]);
    const m = monthly(s, "2026-10");
    console.log(
      JSON.stringify({
        plannedIn: m.plannedIn,
        plannedOut: m.plannedOut,
        balance: m.plannedBalance,
        net: netWorth(s).net,
        transactions: s.transactions.length,
      }),
    );
    const source = JSON.parse(
      readFileSync(process.env.FINFLOW_PRIVATE_BACKUP!, "utf8"),
    );
    if (source.checks) {
      const actual = monthly(s, source.checks.month);
      expect(actual.plannedIn).toBe(source.checks.plannedIn);
      expect(actual.plannedOut).toBe(source.checks.plannedOut);
      expect(actual.plannedBalance).toBe(source.checks.balance);
      expect(netWorth(s).net).toBe(source.checks.netWorth);
    }
    expect(s.transactions.every((t) => t.kind === "income")).toBe(true);
  },
);
