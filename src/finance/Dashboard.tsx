import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Shield,
  Target,
  Landmark,
  Receipt,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useFinance } from "./context";
import { euros } from "./model";
import { monthly, netWorth } from "./calculations";
import { SalaryBreakdown } from "./SalaryBreakdown";

const colors = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#84cc16",
  "#64748b",
];
const grid = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
  },
  gap: 2,
};
const short: Record<string, string> = {
  "Crédits & paiements fractionnés": "Crédits",
  "Fiscalité & régularisations": "Impôts",
  "Épargne de sécurité": "Épargne",
  "Fun & lifestyle": "Loisirs",
};

export function Dashboard({ navigate }: { navigate: (page: number) => void }) {
  const { state: s } = useFinance();
  const m = monthly(s, s.settings.month),
    nw = netWorth(s),
    theme = useTheme();
  const booked = s.transactions.filter(
    (t) =>
      t.budgetMonth === s.settings.month &&
      t.status === "booked" &&
      t.kind !== "transfer",
  );
  const expenseCount = booked.filter((t) => t.kind === "expense").length;
  const spending = m.rows
    .filter(
      (r) => !["Épargne de sécurité", "Investissements"].includes(r.category),
    )
    .reduce((n, r) => n + r.actual, 0);
  const history = [...s.snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => ({
      date: x.date,
      net: (x.assets - x.otherDebts - x.creditDebt) / 100,
    }));
  const pie = m.rows
    .filter((r) => r.actual > 0)
    .map((r) => ({ name: r.category, value: r.actual / 100 }));
  const goals = s.goals.filter((g) => g.active);
  const chartStyle = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    color: theme.palette.text.primary,
  };
  const axis = { fill: theme.palette.text.secondary, fontSize: 11 };
  const metrics = [
    {
      label: "Patrimoine net",
      value: euros(nw.net),
      detail: "Dernières valeurs saisies · indépendant du mois",
      icon: Wallet,
      color: colors[0],
    },
    {
      label: "Revenus enregistrés",
      value: euros(m.actualIn),
      detail: `Prévu : ${m.reference == null ? "à renseigner" : euros(m.plannedIn)}`,
      icon: TrendingUp,
      color: colors[1],
    },
    {
      label: "Dépenses nettes enregistrées",
      value: euros(spending),
      detail: `${expenseCount} dépense(s) comptabilisée(s) · hors épargne et investissements`,
      icon: TrendingDown,
      color: colors[2],
    },
    {
      label: "Épargne + investissements prévus",
      value: euros(m.savings),
      detail:
        m.savingsRate == null
          ? "Revenu prévu requis pour le taux"
          : `${m.savingsRate.toFixed(1)} % du revenu prévu`,
      icon: PiggyBank,
      color: colors[3],
    },
    {
      label: "Solde budgétaire prévu",
      value: m.reference == null ? "À renseigner" : euros(m.plannedBalance),
      detail: "Après toutes les enveloppes, épargne comprise",
      icon: Receipt,
      color: m.plannedBalance < 0 ? "#ef4444" : colors[0],
    },
    {
      label: "Après charges, crédits et impôts",
      value:
        m.remainingAfterMandatory == null
          ? "À renseigner"
          : euros(m.remainingAfterMandatory),
      detail: "Avant vie courante, loisirs, projets et épargne",
      icon: Landmark,
      color: colors[1],
    },
    {
      label: "Buffer protégé",
      value:
        s.settings.buffer == null ? "À renseigner" : euros(s.settings.buffer),
      detail: `Utilisation prévue : ${m.reference == null ? "inconnue" : euros(m.bufferUsed)}`,
      icon: Shield,
      color: colors[2],
    },
    {
      label: "Épargne + investissements réalisés",
      value: euros(m.savingsActual),
      detail:
        m.actualIn > 0
          ? `${((m.savingsActual / m.actualIn) * 100).toFixed(1)} % des revenus enregistrés`
          : "Revenus enregistrés requis pour le taux",
      icon: Target,
      color: colors[3],
    },
    {
      label: "Revenu prévu",
      value: m.reference == null ? "À renseigner" : euros(m.plannedIn),
      detail: "Revenu régulier et entrées exceptionnelles prévues",
      icon: TrendingUp,
      color: colors[1],
    },
    {
      label: "Solde des flux enregistrés",
      value: euros(m.actualBalance),
      detail: "Ne représente pas le solde bancaire disponible",
      icon: Receipt,
      color: m.actualBalance < 0 ? "#ef4444" : colors[0],
    },
    {
      label: "Valeur des placements",
      value: euros(
        s.accounts
          .filter((a) => a.kind === "investment")
          .reduce((sum, a) => sum + a.balance, 0),
      ),
      detail: "Dernières valorisations EUR saisies · indépendant du mois",
      icon: Landmark,
      color: colors[3],
    },
    {
      label: "Crédits restants",
      value: euros(nw.creditDebt),
      detail: "Échéances restantes selon le suivi des crédits",
      icon: Wallet,
      color: colors[2],
    },
  ];
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          gap: 2,
          justifyContent: "space-between",
          alignItems: { md: "center" },
        }}
      >
        <Box>
          <Typography variant="overline" color="primary">
            VUE D’ENSEMBLE
          </Typography>
          <Typography variant="h4">Votre budget, en un regard</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Planifiez votre mois, suivez vos dépenses et vos projets.
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate(2)}>
            Transactions
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowRight size={16} />}
            onClick={() => navigate(3)}
          >
            Importer un relevé
          </Button>
        </Stack>
      </Stack>
      {m.reference == null && (
        <Alert
          severity="info"
          action={<Button onClick={() => navigate(1)}>Renseigner</Button>}
        >
          Le revenu prévu de ce mois n’est pas renseigné. Les prévisions sont
          incomplètes.
        </Alert>
      )}
      <Alert severity="info">
        Les montants réels reflètent uniquement vos opérations enregistrées.{" "}
        {expenseCount === 0
          ? "Aucune dépense comptabilisée pour ce mois : importez vos opérations pour compléter le suivi."
          : "Vérifiez que tous vos comptes et relevés sont à jour."}{" "}
        Le solde des flux n’est pas votre solde bancaire disponible.
      </Alert>
      <Box sx={grid}>
        {metrics.map(({ label, value, detail, icon: Icon, color }) => (
          <Paper
            key={label}
            sx={{
              p: 2.5,
              minWidth: 0,
              backgroundImage: `linear-gradient(135deg, ${color}16, ${color}04)`,
              borderColor: `${color}50`,
            }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", gap: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Box
                sx={{
                  color,
                  p: 1,
                  borderRadius: 2,
                  bgcolor: `${color}18`,
                  display: "flex",
                  alignSelf: "flex-start",
                }}
              >
                <Icon size={20} />
              </Box>
            </Stack>
            <Typography
              variant="h5"
              sx={{ my: 1, fontWeight: 800, overflowWrap: "anywhere" }}
            >
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {detail}
            </Typography>
          </Paper>
        ))}
      </Box>
      <SalaryBreakdown editBudget={() => navigate(1)} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ p: 3, minWidth: 0 }}>
          <Typography variant="h6">Évolution du patrimoine</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Photos datées enregistrées · toutes périodes
          </Typography>
          {history.length < 2 ? (
            <Stack
              sx={{
                justifyContent: "center",
                alignItems: "center",
                minHeight: 240,
              }}
              spacing={2}
            >
              <Wallet size={32} color={colors[0]} />
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                Ajoutez au moins deux photos datées pour afficher l’évolution.
              </Typography>
              <Button onClick={() => navigate(8)}>Historique patrimoine</Button>
            </Stack>
          ) : (
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={history}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="wealthGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={colors[0]}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors[0]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke={theme.palette.divider}
                    strokeDasharray="3 3"
                  />
                  <XAxis dataKey="date" tick={axis} />
                  <YAxis tick={axis} width={65} />
                  <Tooltip
                    contentStyle={chartStyle}
                    formatter={(v: number) => euros(Math.round(v * 100))}
                  />
                  <Area
                    name="Patrimoine net"
                    dataKey="net"
                    stroke={colors[0]}
                    fill="url(#wealthGradient)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>
        <Paper sx={{ p: 3, minWidth: 0 }}>
          <Typography variant="h6">Répartition des flux sortants</Typography>
          <Typography variant="body2" color="text.secondary">
            Montants nets positifs par enveloppe · épargne comprise
          </Typography>
          {!pie.length ? (
            <Stack
              sx={{
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                minHeight: 260,
              }}
            >
              <PiggyBank size={32} color={colors[1]} />
              <Typography color="text.secondary">
                Aucune sortie nette enregistrée pour ce mois.
              </Typography>
              <Button onClick={() => navigate(3)}>
                Importer des transactions
              </Button>
            </Stack>
          ) : (
            <>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pie}
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {pie.map((d, i) => (
                        <Cell key={d.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartStyle}
                      formatter={(v: number) => euros(Math.round(v * 100))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack sx={{ gap: 1 }}>
                {pie.map((d, i) => (
                  <Stack
                    key={d.name}
                    direction="row"
                    sx={{ gap: 1, alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: colors[i % colors.length],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" sx={{ flex: 1 }}>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {euros(Math.round(d.value * 100))}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      </Box>
      <Paper sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography variant="h6">Budget prévu et réalisé</Typography>
            <Typography variant="body2" color="text.secondary">
              Le réalisé reste incomplet tant que les opérations ne sont pas
              toutes saisies.
            </Typography>
          </Box>
          <Button onClick={() => navigate(1)}>Détail</Button>
        </Stack>
        <Box sx={{ height: 370, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart
              data={m.rows.map((r) => ({
                name: short[r.category] || r.category,
                planned: r.planned / 100,
                actual: r.actual / 100,
              }))}
              layout="vertical"
              margin={{ left: 0, right: 15 }}
            >
              <CartesianGrid
                stroke={theme.palette.divider}
                strokeDasharray="3 3"
              />
              <XAxis type="number" tick={axis} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={axis}
                interval={0}
              />
              <Tooltip
                contentStyle={chartStyle}
                formatter={(v: number) => euros(Math.round(v * 100))}
              />
              <Bar
                name="Prévu"
                dataKey="planned"
                fill="#64748b"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
              <Bar
                name="Réel net"
                dataKey="actual"
                fill={colors[0]}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Stack direction="row" sx={{ gap: 3, justifyContent: "center" }}>
          <Typography variant="caption" color="text.secondary">
            ■ Prévu
          </Typography>
          <Typography variant="caption" color="primary">
            ■ Réel net
          </Typography>
        </Stack>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6">Projets & cagnottes</Typography>
          <Button onClick={() => navigate(7)}>Gérer</Button>
        </Stack>
        {!goals.length ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            Ajoutez un projet pour suivre votre progression.
          </Typography>
        ) : (
          <Box sx={{ ...grid, mt: 2 }}>
            {goals.map((g) => {
              const pct =
                g.target > 0
                  ? Math.max(0, Math.min(100, (g.current / g.target) * 100))
                  : 0;
              return (
                <Box
                  key={g.id}
                  sx={{ p: 2, bgcolor: "action.hover", borderRadius: 3 }}
                >
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", gap: 1 }}
                  >
                    <Typography sx={{ fontWeight: 650 }}>{g.name}</Typography>
                    <Typography color="primary">
                      {g.target > 0 ? `${pct.toFixed(0)} %` : "Cible requise"}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ my: 2, height: 7, borderRadius: 4 }}
                  />
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="caption">
                      {euros(g.current)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      sur {euros(g.target)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Cotisation prévue : {euros(g.monthly)} / mois
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">
          Dernières opérations du mois budgétaire
        </Typography>
        <Stack
          divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}
        >
          {[...booked]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map((t) => (
              <Stack
                key={t.id}
                direction="row"
                sx={{ gap: 2, justifyContent: "space-between", py: 1.5 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ overflowWrap: "anywhere" }}>
                    {t.description || "Sans libellé"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.date} · {t.category}
                  </Typography>
                </Box>
                <Typography
                  color={t.amount > 0 ? "primary" : "text.primary"}
                  sx={{ fontWeight: 700, flexShrink: 0 }}
                >
                  {euros(t.amount)}
                </Typography>
              </Stack>
            ))}
        </Stack>
        {!booked.length && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Aucune opération comptabilisée.
          </Typography>
        )}
        <Button onClick={() => navigate(2)}>
          Voir toutes les transactions
        </Button>
      </Paper>
    </Stack>
  );
}
