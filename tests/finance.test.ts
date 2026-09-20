import { describe, it, expect } from "vitest";
import { emptyState, validateState, addMonths } from "../src/finance/model";
import { monthly, schedule, remaining } from "../src/finance/calculations";
import {
  parseCSV,
  parseDate,
  parseMoney,
  applySuggestions,
  commitImport,
  undoImport,
} from "../src/finance/imports";
import { backup, readBackup, migrateLegacy } from "../src/finance/storage";
const account = {
  id: "a",
  name: "Compte",
  institution: "",
  kind: "current" as const,
  balance: 10000,
  asOf: null,
  currency: "EUR" as const,
};
describe("Budget et stockage", () => {
  it("respecte le mois budgétaire et exclut les transferts", () => {
    const s = emptyState();
    s.accounts = [account];
    s.transactions = [
      {
        id: "1",
        date: "2026-09-19",
        amount: 300000,
        accountId: "a",
        kind: "income",
        category: "Revenus",
        budgetMonth: "2026-10",
        status: "booked",
        description: "Salaire",
        notes: "",
      },
      {
        id: "2",
        date: "2026-10-01",
        amount: -20000,
        accountId: "a",
        kind: "transfer",
        category: "Hors budget / transfert",
        budgetMonth: "2026-10",
        status: "booked",
        description: "Virement",
        notes: "",
      },
    ];
    expect(monthly(s, "2026-09").actualBalance).toBe(0);
    expect(monthly(s, "2026-10").actualBalance).toBe(300000);
  });
  it("répartit les centimes et borne les jours en fin de mois", () => {
    const c = {
      id: "c",
      name: "Crédit",
      type: "credit" as const,
      amount: 10000,
      firstDate: "2026-01-31",
      count: 3,
      paid: 1,
      direction: "out" as const,
      accountId: "",
      notes: "",
    };
    expect(schedule(c).map((e) => e.amount)).toEqual([3333, 3333, 3334]);
    expect(schedule(c)[1].date).toBe("2026-02-28");
    expect(remaining(c)).toBe(6667);
  });
  it("conserve les valeurs nulles et rejette une restauration invalide", () => {
    const s = emptyState();
    expect(readBackup(backup(s))).toEqual(s);
    expect(() => validateState({ ...s, transactions: [{}] })).toThrow();
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });
  it("garde les remboursements dans leur catégorie", () => {
    const s = emptyState();
    s.accounts = [account];
    s.transactions = [
      {
        id: "1",
        date: "2026-10-01",
        amount: -5000,
        accountId: "a",
        kind: "expense",
        category: "Vie courante",
        budgetMonth: "2026-10",
        status: "booked",
        description: "Achat",
        notes: "",
      },
      {
        id: "2",
        date: "2026-10-02",
        amount: 1000,
        accountId: "a",
        kind: "refund",
        category: "Vie courante",
        budgetMonth: "2026-10",
        status: "booked",
        description: "Retour",
        notes: "",
      },
    ];
    expect(monthly(s, "2026-10").actualOut).toBe(4000);
    expect(monthly(s, "2026-10").actualBalance).toBe(-4000);
  });
});
describe("Imports génériques", () => {
  it("lit CSV à points-virgules, virgules décimales et libellés cités", () => {
    const r = parseCSV(
      'date;description;montant\n01/09/2026;"Marchand; Centre";-12,50\n02/09/2026;Remboursement;5,00',
      "a",
    );
    expect(r.rows.map((t) => t.amount)).toEqual([-1250, 500]);
    expect(r.rows[0].description).toBe("Marchand; Centre");
  });
  it("préserve deux opérations identiques puis détecte leur réimport", () => {
    let s = emptyState();
    s.accounts = [account];
    const csv =
      "date,description,amount\n2026-09-01,Café,-4.50\n2026-09-01,Café,-4.50";
    const r = applySuggestions(parseCSV(csv, "a"), s, "file");
    expect(r.rows.filter((r) => r.keep)).toHaveLength(2);
    s = commitImport(s, r, "relevé");
    expect(
      applySuggestions(parseCSV(csv, "a"), s, "file").rows.some((r) => r.keep),
    ).toBe(false);
    s = undoImport(s, s.batches[0].id);
    expect(s.transactions).toHaveLength(0);
  });
  it("interprète les dates françaises et refuse les dates impossibles", () => {
    expect(parseDate("2 sept. 2026", 2026)).toBe("2026-09-02");
    expect(parseDate("31/02/2026", 2026)).toBeNull();
    expect(parseMoney("1 234,56 €")).toBe(123456);
  });
});

describe("Rapprochement et annulation", () => {
  it("ne compte pas deux fois une opération passée de en attente à comptabilisée", () => {
    let s = emptyState();
    s.accounts = [account];
    s.transactions = [
      {
        id: "pending",
        date: "2026-09-01",
        amount: -1000,
        accountId: "a",
        kind: "expense",
        category: "Vie courante",
        budgetMonth: "2026-09",
        status: "pending",
        description: "Marchand",
        notes: "",
      },
    ];
    const result = applySuggestions(
      parseCSV("date,description,amount\n2026-09-02,Marchand,-10.00", "a"),
      s,
      "new",
    );
    const next = commitImport(s, result, "Document");
    expect(next.transactions).toHaveLength(1);
    expect(next.transactions[0].status).toBe("booked");
    expect(undoImport(next, next.batches[0].id).transactions).toEqual(
      s.transactions,
    );
  });
  it("rapproche les deux côtés du transfert et restaure le côté existant lors de l’annulation", () => {
    let s = emptyState();
    s.accounts = [account, { ...account, id: "b", name: "Autre" }];
    s.transactions = [
      {
        id: "out",
        date: "2026-09-01",
        amount: -1000,
        accountId: "a",
        kind: "expense",
        category: "Vie courante",
        budgetMonth: "2026-09",
        status: "booked",
        description: "Virement",
        notes: "",
      },
    ];
    const r = applySuggestions(
      parseCSV(
        "date,description,amount\n2026-09-01,Virement entrant,10.00",
        "b",
      ),
      s,
      "f",
    );
    const next = commitImport(s, r, "Import");
    expect(next.transactions.every((t) => t.kind === "transfer")).toBe(true);
    expect(monthly(next, "2026-09").actualBalance).toBe(0);
    expect(undoImport(next, next.batches[0].id).transactions).toEqual(
      s.transactions,
    );
  });
  it("mémorise une ligne ignorée à travers deux exports qui se chevauchent", () => {
    let s = emptyState();
    s.accounts = [account];
    const csv = "date,description,amount\n2026-09-01,Café,-4.50";
    const r = applySuggestions(parseCSV(csv, "a"), s, "first");
    r.rows[0].keep = false;
    s = commitImport(s, r, "Premier");
    expect(
      applySuggestions(parseCSV(csv, "a"), s, "different").rows[0].keep,
    ).toBe(false);
  });
});
it("conserve une affectation épargne lors du rapprochement du crédit sur le livret", () => {
  const s = emptyState();
  s.accounts = [account, { ...account, id: "livret", kind: "savings" }];
  s.transactions = [
    {
      id: "out",
      date: "2026-09-01",
      amount: -20000,
      accountId: "a",
      kind: "saving",
      category: "Épargne de sécurité",
      budgetMonth: "2026-09",
      status: "booked",
      description: "Virement épargne",
      notes: "",
    },
  ];
  const r = applySuggestions(
    parseCSV(
      "date,description,amount\n2026-09-01,Virement entrant,200.00",
      "livret",
    ),
    s,
    "file",
  );
  const next = commitImport(s, r, "Import");
  expect(monthly(next, "2026-09").savingsActual).toBe(20000);
  expect(next.transactions.find((t) => t.id === "out")?.kind).toBe("saving");
  expect(next.transactions.find((t) => t.accountId === "livret")?.kind).toBe(
    "transfer",
  );
});
