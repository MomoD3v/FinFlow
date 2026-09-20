import { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Alert,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useFinance, FinanceProvider } from "./context";
import {
  categories,
  State,
  Tx,
  Account,
  Recurring,
  Commitment,
  Goal,
  uid,
  today,
  euros,
  addMonths,
  accountSchema,
  txSchema,
  recurringSchema,
  commitmentSchema,
  goalSchema,
} from "./model";
import { monthly, netWorth, schedule, remaining } from "./calculations";
import { Editor, Field } from "./Editor";
import { ImportView } from "./ImportView";
import { backup, download, readBackup } from "./storage";
import { AdvancedTools } from "./AdvancedTools";
import { AppProvider } from "../store/AppContext";
const cards = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(4,1fr)" },
  gap: 2,
};
const pages = [
  "Vue d’ensemble",
  "Budget mensuel",
  "Transactions",
  "Importer PDF / CSV",
  "Comptes & patrimoine",
  "Charges fixes",
  "Crédits & fiscalité",
  "Projets & cagnottes",
  "Historique patrimoine",
  "Sauvegardes",
  "Placements & Shariah",
];
const kinds = {
  income: "Revenu",
  expense: "Dépense",
  refund: "Remboursement",
  transfer: "Transfert interne",
  saving: "Épargne",
  investment: "Investissement",
};
const opts = (a: string[]) => a.map((value) => ({ value, label: value }));
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ my: 1, fontWeight: 750 }}>
        {value}
      </Typography>
      {detail && (
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      )}
    </Paper>
  );
}
function SimpleTable({
  heads,
  rows,
}: {
  heads: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {heads.map((h) => (
              <TableCell key={h}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((c, j) => (
                <TableCell key={j}>{c}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
function Dashboard() {
  const { state: s } = useFinance(),
    m = monthly(s, s.settings.month),
    nw = netWorth(s);
  const history = [...s.snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => ({
      date: x.date,
      net: (x.assets - x.otherDebts - x.creditDebt) / 100,
    }));
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Votre budget, en un regard</Typography>
      {m.reference == null && (
        <Alert severity="info">
          Le revenu prévu de ce mois n’est pas renseigné. Les indicateurs
          prévisionnels sont incomplets.
        </Alert>
      )}
      <Box sx={cards}>
        <Metric
          label="Revenu prévu"
          value={m.reference == null ? "À renseigner" : euros(m.plannedIn)}
        />
        <Metric
          label="Solde budgétaire prévu"
          value={m.reference == null ? "Incomplet" : euros(m.plannedBalance)}
          detail="Après toutes les enveloppes, épargne comprise"
        />
        <Metric
          label="Épargne + investissements prévus"
          value={euros(m.savings)}
          detail={
            m.savingsRate === null
              ? "Revenu requis"
              : `${m.savingsRate.toFixed(1)} % du revenu de référence`
          }
        />
        <Metric
          label="Patrimoine net"
          value={euros(nw.net)}
          detail="Dernières valeurs saisies, indépendantes du mois choisi"
        />
      </Box>
      <Box sx={cards}>
        <Metric
          label="Après charges, crédits et impôts"
          value={
            m.remainingAfterMandatory === null
              ? "À renseigner"
              : euros(m.remainingAfterMandatory)
          }
          detail="Avant vie courante, loisirs, projets et épargne"
        />
        <Metric
          label="Solde des flux enregistrés"
          value={euros(m.actualBalance)}
          detail="Ne représente pas le solde bancaire disponible"
        />
        <Metric
          label="Buffer protégé"
          value={
            s.settings.buffer === null
              ? "À renseigner"
              : euros(s.settings.buffer)
          }
          detail={`Utilisation prévue : ${m.reference == null ? "inconnue" : euros(m.bufferUsed)}`}
        />
        <Metric
          label="Épargne + investissements réalisés"
          value={euros(m.savingsActual)}
        />
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Répartition du budget</Typography>
        <Box sx={{ height: 430 }}>
          <ResponsiveContainer>
            <BarChart
              data={m.rows.map((r) => ({
                ...r,
                planned: r.planned / 100,
                actual: r.actual / 100,
              }))}
              layout="vertical"
              margin={{ bottom: 0, left: 0, right: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="category"
                width={125}
                interval={0}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) =>
                  ({
                    "Crédits & paiements fractionnés": "Crédits",
                    "Fiscalité & régularisations": "Impôts",
                    "Projets & cagnottes": "Projets",
                    "Épargne de sécurité": "Épargne",
                    "Fun & lifestyle": "Loisirs",
                  })[v] || v
                }
              />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
              <Bar
                name="Prévu"
                dataKey="planned"
                fill="#6474df"
                radius={[0, 5, 5, 0]}
                isAnimationActive={false}
              />
              <Bar
                name="Réel net"
                dataKey="actual"
                fill="#18a68d"
                radius={[0, 5, 5, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Évolution réelle du patrimoine</Typography>
        {history.length < 2 ? (
          <Typography sx={{ py: 4 }} color="text.secondary">
            Ajoutez au moins deux photos datées pour afficher l’évolution.
          </Typography>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={history}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                <Line
                  dataKey="net"
                  name="Patrimoine net"
                  stroke="#18a68d"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
function Budget() {
  const { state: s, change } = useFinance(),
    m = monthly(s, s.settings.month);
  const [edit, setEdit] = useState(false);
  const plan = s.plans.find((p) => p.month === s.settings.month);
  const initial = {
    income: plan?.income ?? null,
    exceptional: plan?.exceptional || 0,
    refundTax: plan?.refundTax ?? null,
    fixedAdjustment: plan?.fixedAdjustment || 0,
    ...Object.fromEntries(
      categories.map((c, i) => [`c${i}`, plan?.categories[c] ?? null]),
    ),
  };
  const fields: Field[] = [
    {
      key: "income",
      label: "Revenu régulier prévu (€)",
      type: "money",
      optional: true,
    },
    { key: "exceptional", label: "Entrées exceptionnelles (€)", type: "money" },
    {
      key: "refundTax",
      label: "Remboursement fiscal prévu (€) — vide = échéancier",
      type: "money",
      optional: true,
    },
    {
      key: "fixedAdjustment",
      label: "Ajustement ponctuel des charges (€)",
      type: "money",
    },
    ...categories.map((c, i) => ({
      key: `c${i}`,
      label: `${c} (€) — vide = automatique`,
      type: "money" as const,
      optional: true,
    })),
  ];
  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="h4">Budget mensuel</Typography>
        <Button variant="contained" onClick={() => setEdit(true)}>
          Modifier le mois
        </Button>
      </Stack>
      <Alert severity="info">
        Les charges, crédits, impôts et cotisations des projets sont calculés
        automatiquement si aucune valeur ne les remplace. Les prévisions ne
        créent pas de dépenses réelles.
      </Alert>
      <SimpleTable
        heads={["Enveloppe", "Prévu", "Réel net", "Reste", "Consommé"]}
        rows={m.rows.map((r) => [
          r.category,
          euros(r.planned),
          euros(r.actual),
          euros(r.planned - r.actual),
          r.planned ? `${((r.actual / r.planned) * 100).toFixed(1)} %` : "—",
        ])}
      />
      <Box sx={cards}>
        <Metric label="Entrées prévues" value={euros(m.plannedIn)} />
        <Metric label="Total affectations" value={euros(m.plannedOut)} />
        <Metric label="Solde prévu" value={euros(m.plannedBalance)} />
        <Metric label="Engagements obligatoires" value={euros(m.mandatory)} />
      </Box>
      <Button
        onClick={() => {
          const next = addMonths(s.settings.month, 1);
          if (
            s.plans.some((p) => p.month === next) &&
            !confirm(`Remplacer les prévisions de ${next} ?`)
          )
            return;
          void change((st) => ({
            ...st,
            plans: [
              ...st.plans.filter((p) => p.month !== next),
              {
                month: next,
                income: plan?.income ?? null,
                exceptional: 0,
                refundTax: null,
                categories: {
                  ...plan?.categories,
                  "Charges fixes": null,
                  "Crédits & paiements fractionnés": null,
                  "Fiscalité & régularisations": null,
                  "Marge libre": null,
                },
                fixedAdjustment: 0,
              },
            ],
            settings: { ...st.settings, month: next },
          })).catch(() => {});
        }}
      >
        Préparer le mois suivant
      </Button>
      {edit && (
        <Editor
          title={`Prévisions ${s.settings.month}`}
          fields={fields}
          initial={initial}
          onClose={() => setEdit(false)}
          onSave={async (v) => {
            await change((st) => ({
              ...st,
              plans: [
                ...st.plans.filter((p) => p.month !== st.settings.month),
                {
                  month: st.settings.month,
                  income: v.income as number | null,
                  exceptional: v.exceptional as number,
                  refundTax: v.refundTax as number | null,
                  fixedAdjustment: v.fixedAdjustment as number,
                  categories: Object.fromEntries(
                    categories.map((c, i) => [c, v[`c${i}`] as number | null]),
                  ),
                },
              ],
            }));
          }}
        />
      )}
    </Stack>
  );
}
function Transactions() {
  const { state: s, change } = useFinance();
  const [edit, setEdit] = useState<Tx | null>(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState(""),
    [all, setAll] = useState(false);
  const accountOpts = s.accounts.map((a) => ({ value: a.id, label: a.name }));
  const fields: Field[] = [
    { key: "date", label: "Date bancaire", type: "date" },
    { key: "description", label: "Libellé" },
    {
      key: "amount",
      label: "Montant signé (€) : sortie négative",
      type: "money",
    },
    { key: "accountId", label: "Compte", options: accountOpts },
    {
      key: "kind",
      label: "Type",
      options: Object.entries(kinds).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "category",
      label: "Catégorie",
      options: opts(["Revenus", ...categories, "Hors budget / transfert"]),
    },
    { key: "budgetMonth", label: "Mois budgétaire", type: "month" },
    {
      key: "status",
      label: "Statut",
      options: [
        { value: "booked", label: "Comptabilisée" },
        { value: "pending", label: "En attente" },
      ],
    },
    { key: "notes", label: "Notes", optional: true },
    {
      key: "linkedId",
      label: "Charge, crédit ou projet lié",
      optional: true,
      options: [
        { value: "", label: "Aucun" },
        ...[...s.recurring, ...s.commitments, ...s.goals].map((x) => ({
          value: x.id,
          label: x.name,
        })),
      ],
    },
    {
      key: "peerAccountId",
      label: "Autre compte du transfert",
      optional: true,
      options: [{ value: "", label: "Aucun" }, ...accountOpts],
    },
  ];
  const list = s.transactions
    .filter(
      (t) =>
        (all || t.budgetMonth === s.settings.month) &&
        (!filter || t.accountId === filter) &&
        t.description.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="h4">Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!s.accounts.length}
          onClick={() =>
            setEdit({
              id: uid(),
              date: today(),
              description: "",
              amount: 0,
              accountId: s.accounts[0].id,
              kind: "expense",
              category: "Vie courante",
              budgetMonth: s.settings.month,
              status: "booked",
              notes: "",
            })
          }
        >
          Ajouter
        </Button>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Rechercher un libellé"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TextField
          select
          label="Compte"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tous</MenuItem>
          {accountOpts.map((a) => (
            <MenuItem key={a.value} value={a.value}>
              {a.label}
            </MenuItem>
          ))}
        </TextField>
        <Button onClick={() => setAll(!all)}>
          {all ? "Afficher le mois choisi" : "Afficher tous les mois"}
        </Button>
      </Stack>
      <SimpleTable
        heads={[
          "Date",
          "Libellé",
          "Compte",
          "Montant",
          "Catégorie / mois",
          "Actions",
        ]}
        rows={list.map((t) => [
          t.date,
          <>
            <Typography>{t.description}</Typography>
            <Chip
              size="small"
              label={t.status === "pending" ? "En attente" : kinds[t.kind]}
            />
          </>,
          s.accounts.find((a) => a.id === t.accountId)?.name,
          euros(t.amount),
          `${t.category} · ${t.budgetMonth}`,
          <Stack direction="row">
            <Button onClick={() => setEdit(t)}>Modifier</Button>
            <Button
              onClick={() => {
                const contains = prompt(
                  "Texte à reconnaître pour cette catégorie :",
                  t.description.split(" ").slice(0, 3).join(" "),
                );
                if (contains?.trim())
                  void change((st) => ({
                    ...st,
                    rules: [
                      ...st.rules,
                      {
                        id: uid(),
                        contains: contains.trim(),
                        category: t.category,
                        kind: t.kind,
                      },
                    ],
                  })).catch(() => {});
              }}
            >
              Règle
            </Button>
            <Button
              color="error"
              onClick={() => {
                if (confirm("Supprimer cette opération ?"))
                  void change((st) => ({
                    ...st,
                    transactions: st.transactions.filter((x) => x.id !== t.id),
                  })).catch(() => {});
              }}
            >
              Supprimer
            </Button>
          </Stack>,
        ])}
      />
      {!list.length && (
        <Typography color="text.secondary">
          Aucune opération pour cette sélection.
        </Typography>
      )}
      {edit && (
        <Editor
          title="Transaction"
          initial={edit}
          fields={fields}
          onClose={() => setEdit(null)}
          onSave={async (v) => {
            const t = txSchema.parse({
              ...v,
              notes: v.notes || "",
              linkedId: v.linkedId || undefined,
              peerAccountId: v.peerAccountId || undefined,
            });
            if (
              (t.kind === "expense" ||
                t.kind === "saving" ||
                t.kind === "investment") &&
              t.amount > 0
            )
              throw Error("Une sortie doit avoir un montant négatif");
            if ((t.kind === "income" || t.kind === "refund") && t.amount < 0)
              throw Error("Une entrée doit avoir un montant positif");
            if (t.kind === "transfer") t.category = "Hors budget / transfert";
            await change((st) => ({
              ...st,
              transactions: [
                ...st.transactions.filter((x) => x.id !== t.id),
                t,
              ],
            }));
          }}
        />
      )}
    </Stack>
  );
}
function Entities({
  type,
}: {
  type: "accounts" | "recurring" | "commitments" | "goals";
}) {
  const { state: s, change } = useFinance();
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null),
    [due, setDue] = useState<Commitment | null>(null);
  const acc = s.accounts.map((a) => ({ value: a.id, label: a.name }));
  let title = "",
    fields: Field[] = [],
    initial: Record<string, unknown> = {},
    heads: string[] = [],
    rows: React.ReactNode[][] = [];
  const actions = (v: { id: string }) => (
    <Stack direction="row">
      <Button onClick={() => setEdit(v)}>Modifier</Button>
      <Button
        color="error"
        onClick={() => {
          if (!confirm("Supprimer cet élément ?")) return;
          void change((st) => {
            if (
              type === "accounts" &&
              (st.transactions.some(
                (t) => t.accountId === v.id || t.peerAccountId === v.id,
              ) ||
                st.recurring.some((r) => r.accountId === v.id) ||
                st.commitments.some((c) => c.accountId === v.id))
            )
              throw Error("Ce compte est encore utilisé");
            return { ...st, [type]: st[type].filter((x) => x.id !== v.id) };
          }).catch(() => {});
        }}
      >
        Supprimer
      </Button>
    </Stack>
  );
  if (type === "accounts") {
    title = "Comptes & patrimoine";
    fields = [
      { key: "name", label: "Nom du compte / actif" },
      { key: "institution", label: "Établissement", optional: true },
      {
        key: "kind",
        label: "Nature",
        options: [
          { value: "current", label: "Compte courant" },
          { value: "savings", label: "Livret / épargne" },
          { value: "investment", label: "Placement" },
          { value: "other", label: "Autre actif" },
          { value: "debt", label: "Autre dette (hors crédits suivis)" },
        ],
      },
      { key: "balance", label: "Valeur / solde (€)", type: "money" },
      { key: "asOf", label: "Date du solde", type: "date", optional: true },
      {
        key: "iban",
        label: "IBAN (facultatif, pour les transferts)",
        optional: true,
      },
    ];
    initial = {
      id: uid(),
      name: "",
      institution: "",
      kind: "current",
      balance: 0,
      asOf: today(),
      currency: "EUR",
    };
    heads = [
      "Compte / actif",
      "Établissement",
      "Valeur",
      "Date du solde",
      "Actions",
    ];
    rows = s.accounts.map((a) => [
      a.name,
      a.institution,
      euros(a.balance),
      a.asOf || "À préciser",
      actions(a),
    ]);
  }
  if (type === "recurring") {
    title = "Charges fixes";
    fields = [
      { key: "name", label: "Charge" },
      { key: "amount", label: "Montant mensuel (€)", type: "money", min: 0 },
      { key: "accountId", label: "Compte", options: acc },
      {
        key: "day",
        label: "Jour de prélèvement",
        type: "number",
        min: 1,
        max: 31,
      },
      { key: "start", label: "Premier mois", type: "month" },
      {
        key: "end",
        label: "Dernier mois inclus",
        type: "month",
        optional: true,
      },
    ];
    initial = {
      id: uid(),
      name: "",
      amount: 0,
      accountId: s.accounts[0]?.id || "",
      day: 1,
      start: s.settings.month,
      end: null,
      category: "Charges fixes",
    };
    heads = [
      "Charge",
      "Mensualité",
      "Compte",
      "Période",
      "Paiement du mois",
      "Actions",
    ];
    rows = s.recurring.map((r) => {
      const paid = s.transactions.filter(
        (t) =>
          t.status === "booked" &&
          t.budgetMonth === s.settings.month &&
          t.accountId === r.accountId &&
          (t.linkedId === r.id ||
            (t.amount === -r.amount &&
              t.description.toLowerCase().includes(r.name.toLowerCase()))),
      );
      return [
        r.name,
        euros(r.amount),
        s.accounts.find((a) => a.id === r.accountId)?.name,
        `${r.start} → ${r.end || "sans fin"}`,
        paid.length ? "Opération trouvée" : "À rapprocher",
        actions(r),
      ];
    });
  }
  if (type === "commitments") {
    title = "Crédits & fiscalité";
    fields = [
      { key: "name", label: "Engagement" },
      {
        key: "type",
        label: "Type",
        options: [
          { value: "credit", label: "Crédit / paiement fractionné" },
          { value: "tax", label: "Fiscalité / régularisation" },
        ],
      },
      { key: "amount", label: "Montant total (€)", type: "money", min: 0 },
      { key: "firstDate", label: "Première échéance", type: "date" },
      { key: "count", label: "Nombre d’échéances", type: "number", min: 1 },
      { key: "paid", label: "Échéances payées", type: "number", min: 0 },
      {
        key: "direction",
        label: "Sens",
        options: [
          { value: "out", label: "À payer" },
          { value: "in", label: "À recevoir" },
        ],
      },
      {
        key: "accountId",
        label: "Compte",
        options: [{ value: "", label: "À préciser" }, ...acc],
        optional: true,
      },
      { key: "notes", label: "Notes", optional: true },
    ];
    initial = {
      id: uid(),
      name: "",
      type: "credit",
      amount: 0,
      firstDate: today(),
      count: 4,
      paid: 0,
      direction: "out",
      accountId: "",
      notes: "",
    };
    heads = [
      "Engagement",
      "Restant",
      "Progression",
      "Prochaine échéance",
      "Actions",
    ];
    rows = s.commitments.map((c) => [
      c.name,
      euros(remaining(c)),
      `${c.paid}/${c.count}`,
      schedule(c).find((e) => !e.paid)?.date || "Terminé",
      <Stack>
        {actions(c)}
        <Button onClick={() => setDue(c)}>Échéancier</Button>
      </Stack>,
    ]);
  }
  if (type === "goals") {
    title = "Projets & cagnottes";
    fields = [
      { key: "name", label: "Projet" },
      { key: "target", label: "Objectif (€)", type: "money", min: 0 },
      { key: "current", label: "Déjà réservé (€)", type: "money", min: 0 },
      { key: "monthly", label: "Cotisation prévue (€)", type: "money", min: 0 },
      { key: "targetDate", label: "Date cible", type: "date", optional: true },
      {
        key: "active",
        label: "Statut",
        options: [
          { value: "true", label: "Actif" },
          { value: "false", label: "Suspendu / terminé" },
        ],
      },
    ];
    initial = {
      id: uid(),
      name: "",
      target: 0,
      current: 0,
      monthly: 0,
      targetDate: null,
      active: true,
    };
    heads = [
      "Projet",
      "Réservé / objectif",
      "Cotisation prévue",
      "Recommandée / mois",
      "Actions",
    ];
    rows = s.goals.map((g) => {
      const now = s.settings.month;
      const months = g.targetDate
        ? Math.max(
            1,
            (Number(g.targetDate.slice(0, 4)) - Number(now.slice(0, 4))) * 12 +
              Number(g.targetDate.slice(5, 7)) -
              Number(now.slice(5, 7)),
          )
        : null;
      return [
        g.name,
        `${euros(g.current)} / ${euros(g.target)}`,
        euros(g.monthly),
        months
          ? euros(Math.ceil(Math.max(0, g.target - g.current) / months))
          : "Date cible requise",
        actions(g),
      ];
    });
  }
  const nw = netWorth(s);
  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="h4">{title}</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          disabled={type === "recurring" && !acc.length}
          onClick={() => setEdit(initial)}
        >
          Ajouter
        </Button>
      </Stack>
      {type === "accounts" && (
        <>
          <Alert severity="info">
            Les soldes sont des photos datées. Importer des transactions ne
            modifie pas ces photos et ne les compte pas deux fois. Saisissez les
            autres dettes en positif.
          </Alert>
          <Box sx={cards}>
            <Metric label="Actifs" value={euros(nw.assets)} />
            <Metric label="Autres passifs" value={euros(nw.otherDebts)} />
            <Metric label="Crédits restants" value={euros(nw.creditDebt)} />
            <Metric label="Patrimoine net" value={euros(nw.net)} />
          </Box>
        </>
      )}
      {type === "goals" && (
        <Alert severity="info">
          Les cagnottes représentent une affectation de votre argent : leur
          montant n’est pas ajouté une deuxième fois au patrimoine.
        </Alert>
      )}
      {type === "recurring" && (
        <>
          <Alert severity="info">
            Pour un changement permanent de tarif, terminez l’ancienne charge et
            créez la nouvelle à sa date d’effet. Le passé restera inchangé.
          </Alert>
          <SimpleTable
            heads={["Compte", "Charges prévues du mois"]}
            rows={s.accounts.map((a) => [
              a.name,
              euros(
                s.recurring
                  .filter(
                    (r) =>
                      r.accountId === a.id &&
                      r.start <= s.settings.month &&
                      (!r.end || r.end >= s.settings.month),
                  )
                  .reduce((n, r) => n + r.amount, 0),
              ),
            ])}
          />
        </>
      )}
      <SimpleTable heads={heads} rows={rows} />
      {edit && (
        <Editor
          title={title}
          fields={fields}
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={async (v) => {
            const value =
              type === "accounts"
                ? accountSchema.parse({
                    ...v,
                    institution: v.institution || "",
                    iban: v.iban || undefined,
                  })
                : type === "recurring"
                  ? recurringSchema.parse(v)
                  : type === "commitments"
                    ? commitmentSchema.parse({
                        ...v,
                        accountId: v.accountId || "",
                        notes: v.notes || "",
                      })
                    : goalSchema.parse({
                        ...v,
                        active: v.active === true || v.active === "true",
                      });
            await change((st) => {
              if (type === "recurring") {
                const old = st.recurring.find((r) => r.id === value.id),
                  next = value as Recurring;
                if (old && old.amount !== next.amount) {
                  if (next.start <= old.start)
                    throw Error(
                      "Pour changer le tarif, choisissez un premier mois après le début de l’ancienne charge.",
                    );
                  return {
                    ...st,
                    recurring: [
                      ...st.recurring.filter((r) => r.id !== old.id),
                      { ...old, end: addMonths(next.start, -1) },
                      { ...next, id: uid() },
                    ],
                  };
                }
              }
              return {
                ...st,
                [type]: [...st[type].filter((x) => x.id !== value.id), value],
              };
            });
          }}
        />
      )}
      {due && (
        <Dialog open onClose={() => setDue(null)} fullWidth>
          <DialogTitle>{due.name}</DialogTitle>
          <DialogContent>
            <SimpleTable
              heads={["Date", "Montant", "État"]}
              rows={schedule(due).map((e) => [
                e.date,
                euros(e.amount),
                e.paid ? "Payée" : "À venir / à vérifier",
              ])}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDue(null)}>Fermer</Button>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
}
function History() {
  const { state: s, change } = useFinance();
  const [edit, setEdit] = useState(false);
  const nw = netWorth(s);
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Historique du patrimoine</Typography>
      <Button variant="contained" onClick={() => setEdit(true)}>
        Enregistrer une photo
      </Button>
      <SimpleTable
        heads={[
          "Date",
          "Actifs",
          "Autres passifs",
          "Crédits",
          "Patrimoine net",
          "Actions",
        ]}
        rows={[...s.snapshots]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((x) => [
            x.date,
            euros(x.assets),
            euros(x.otherDebts),
            euros(x.creditDebt),
            euros(x.assets - x.otherDebts - x.creditDebt),
            <Button
              color="error"
              onClick={() => {
                if (confirm("Supprimer cette photo ?"))
                  void change((st) => ({
                    ...st,
                    snapshots: st.snapshots.filter((v) => v.id !== x.id),
                  })).catch(() => {});
              }}
            >
              Supprimer
            </Button>,
          ])}
      />
      {edit && (
        <Editor
          title="Photo du patrimoine"
          initial={{
            id: uid(),
            date: today(),
            ...nw,
            buffer: s.settings.buffer,
          }}
          fields={[
            { key: "date", label: "Date de la photo", type: "date" },
            ...["assets", "otherDebts", "creditDebt", "checking", "buffer"].map(
              (key, i) => ({
                key,
                label: [
                  "Actifs (€)",
                  "Autres passifs (€)",
                  "Crédits restants (€)",
                  "Comptes courants (€)",
                  "Buffer protégé (€)",
                ][i],
                type: "money" as const,
                optional: key === "buffer",
              }),
            ),
          ]}
          onClose={() => setEdit(false)}
          onSave={async (v) => {
            await change((st) => {
              if (st.snapshots.some((x) => x.date === v.date))
                throw Error("Une photo existe déjà à cette date");
              return {
                ...st,
                snapshots: [...st.snapshots, v as State["snapshots"][number]],
              };
            });
          }}
        />
      )}
    </Stack>
  );
}
function Backups() {
  const { state: s, change } = useFinance();
  const [incoming, setIncoming] = useState<State | null>(null),
    [error, setError] = useState(""),
    [edit, setEdit] = useState(false);
  const nw = incoming ? netWorth(incoming) : null;
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Sauvegardes & import initial</Typography>
      <Alert severity="info">
        Vos données sont conservées dans ce navigateur. Un autre appareil
        nécessite une restauration manuelle. Exportez régulièrement une copie.
      </Alert>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography>
            Dernier export :{" "}
            {s.settings.lastExport
              ? new Date(s.settings.lastExport).toLocaleString("fr-FR")
              : "aucun"}
          </Typography>
          <Button
            variant="contained"
            onClick={async () => {
              const next = {
                ...s,
                settings: {
                  ...s.settings,
                  lastExport: new Date().toISOString(),
                },
              };
              download(`finflow-${today()}.json`, backup(next));
              await change(() => next).catch(() => {});
            }}
          >
            Exporter ma sauvegarde complète
          </Button>
          <Button component="label" variant="outlined">
            Charger mon import initial ou une sauvegarde
            <input
              hidden
              type="file"
              accept=".json"
              onChange={async (e) => {
                try {
                  const file = e.target.files?.[0];
                  if (file) setIncoming(readBackup(await file.text()));
                  setError("");
                } catch (e) {
                  setError(`Fichier refusé : ${(e as Error).message}`);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </Button>
          <Typography variant="body2">
            L’import initial septembre–octobre est un fichier privé fourni
            séparément. Il ne fait pas partie du site public.
          </Typography>
          <Button onClick={() => setEdit(true)}>
            Renseigner le buffer protégé
          </Button>
          <Button
            onClick={async () => {
              const granted = await navigator.storage?.persist?.();
              setError(
                granted
                  ? "Stockage persistant accordé. Cela ne remplace pas une sauvegarde."
                  : "Le navigateur n’a pas accordé le stockage persistant. Conservez une sauvegarde.",
              );
            }}
          >
            Demander la conservation du stockage
          </Button>
        </Stack>
      </Paper>
      {incoming && (
        <Dialog open fullWidth onClose={() => setIncoming(null)}>
          <DialogTitle>Vérifier la reprise des données</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="warning">
                La restauration remplacera le budget actuel. Une sauvegarde du
                budget actuel sera téléchargée avant le remplacement.
              </Alert>
              <Typography>
                {incoming.accounts.length} comptes ·{" "}
                {incoming.transactions.length} transactions ·{" "}
                {incoming.recurring.length} charges fixes
              </Typography>
              <Typography>
                Mois prévus : {incoming.plans.map((p) => p.month).join(", ")}
              </Typography>
              <Typography>Patrimoine net : {euros(nw!.net)}</Typography>
              <Typography>
                Les opérations futures et les prévisions restent distinctes du
                réalisé.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIncoming(null)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  download(
                    `finflow-avant-restauration-${today()}.json`,
                    backup(s),
                  );
                  await change(() => incoming);
                  setIncoming(null);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Confirmer la restauration
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {edit && (
        <Editor
          title="Buffer protégé"
          fields={[
            {
              key: "buffer",
              label: "Montant réservé sur vos comptes courants (€)",
              type: "money",
              optional: true,
              min: 0,
            },
          ]}
          initial={{ buffer: s.settings.buffer }}
          onClose={() => setEdit(false)}
          onSave={async (v) => {
            await change((st) => ({
              ...st,
              settings: { ...st.settings, buffer: v.buffer as number | null },
            }));
          }}
        />
      )}
    </Stack>
  );
}
function Shell() {
  const { state: s, change, error, busy } = useFinance();
  const [page, setPage] = useState(0),
    [drawer, setDrawer] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      s.settings.theme === "dark",
    );
    document.documentElement.lang = "fr";
    document.documentElement.dir = "ltr";
  }, [s.settings.theme]);
  const theme = createTheme({
    palette: {
      mode: s.settings.theme,
      primary: { main: s.settings.theme === "light" ? "#4657bd" : "#a9b5ff" },
      secondary: { main: "#168a77" },
      background: {
        default: s.settings.theme === "light" ? "#f4f6fb" : "#111522",
        paper: s.settings.theme === "light" ? "#ffffff" : "#1d2435",
      },
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h4: { fontWeight: 750, fontSize: "1.85rem" },
      h6: { fontWeight: 650 },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: "1px solid",
            borderColor: s.settings.theme === "light" ? "#e3e7f0" : "#344059",
          },
        },
      },
      MuiButton: {
        styleOverrides: { root: { textTransform: "none", fontWeight: 650 } },
      },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 700 } } },
    },
  });
  const nav = (
    <Box sx={{ p: 2, width: 248 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, p: 2, color: "primary.main" }}
      >
        FinFlow
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
        BUDGET PERSONNEL
      </Typography>
      <Stack spacing={0.5} sx={{ mt: 3 }}>
        {pages.map((p, i) => (
          <Button
            key={p}
            sx={{ justifyContent: "flex-start", px: 2, py: 1.2 }}
            variant={page === i ? "contained" : "text"}
            onClick={() => {
              setPage(i);
              setDrawer(false);
            }}
          >
            {p}
          </Button>
        ))}
      </Stack>
    </Box>
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Box
          component="nav"
          sx={{
            display: { xs: "none", lg: "block" },
            position: "fixed",
            height: "100vh",
            overflow: "auto",
            borderRight: "1px solid",
            borderColor: "divider",
          }}
        >
          {nav}
        </Box>
        <Drawer open={drawer} onClose={() => setDrawer(false)}>
          {nav}
        </Drawer>
        <Box
          sx={{
            ml: { lg: "248px" },
            width: { xs: "100%", lg: "calc(100% - 248px)" },
            p: { xs: 2, md: 4 },
            maxWidth: 1800,
            minWidth: 0,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{ mb: 4, alignItems: "center", flexWrap: "wrap", gap: 1 }}
          >
            <IconButton
              aria-label="Ouvrir le menu"
              sx={{ display: { lg: "none" } }}
              onClick={() => setDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <TextField
              type="month"
              size="small"
              label="Mois budgétaire"
              slotProps={{ inputLabel: { shrink: true } }}
              value={s.settings.month}
              onChange={(e) => {
                if (e.target.value)
                  void change((st) => ({
                    ...st,
                    settings: { ...st.settings, month: e.target.value },
                  })).catch(() => {});
              }}
            />
            <Box sx={{ flex: 1 }} />
            <Chip
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
              label={
                error
                  ? "Non enregistré"
                  : busy
                    ? "Enregistrement…"
                    : "Enregistré sur cet appareil"
              }
              size="small"
              color={error ? "error" : busy ? "default" : "success"}
            />
            <Button
              onClick={() =>
                void change((st) => ({
                  ...st,
                  settings: {
                    ...st.settings,
                    theme: st.settings.theme === "light" ? "dark" : "light",
                  },
                })).catch(() => {})
              }
            >
              {s.settings.theme === "light" ? "Sombre" : "Clair"}
            </Button>
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {(!s.settings.lastExport ||
            Date.now() - Date.parse(s.settings.lastExport) > 30 * 86400000) && (
            <Alert
              severity="info"
              sx={{ mb: 3 }}
              action={<Button onClick={() => setPage(9)}>Sauvegarder</Button>}
            >
              Conservez une sauvegarde hors du navigateur.
            </Alert>
          )}
          {page === 0 ? (
            <Dashboard />
          ) : page === 1 ? (
            <Budget />
          ) : page === 2 ? (
            <Transactions />
          ) : page === 3 ? (
            <ImportView />
          ) : page === 4 ? (
            <Entities type="accounts" />
          ) : page === 5 ? (
            <Entities type="recurring" />
          ) : page === 6 ? (
            <Entities type="commitments" />
          ) : page === 7 ? (
            <Entities type="goals" />
          ) : page === 8 ? (
            <History />
          ) : page === 9 ? (
            <Backups />
          ) : (
            <AdvancedTools />
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default function FinanceApp() {
  return (
    <FinanceProvider>
      <Shell />
    </FinanceProvider>
  );
}
