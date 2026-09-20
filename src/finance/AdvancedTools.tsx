import { useState } from "react";
import { Alert, Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { AppProvider } from "../store/AppContext";
import { emptyState as emptyLegacy } from "../store/initialState";
import { InvestmentsView } from "../views/Investments/InvestmentsView";
import { ShariahView } from "../views/Shariah/ShariahView";
import { reducer } from "../intents/reducer";
import { useFinance } from "./context";
import type { AppState, InvestmentAccount } from "../models";
import { State, today } from "./model";
function legacyState(s: State): AppState {
  const prior = s.legacy as AppState | undefined;
  const raw = prior?.settings ? prior : emptyLegacy;
  const accounts: InvestmentAccount[] = s.accounts
    .filter((a) => a.kind === "investment")
    .map((a) => {
      const old = raw.investmentAccounts?.find((i) => i.id === a.id);
      const holdings = old?.holdings || [];
      return {
        id: a.id,
        name: a.name,
        type: old?.type || "other",
        currency: "EUR",
        holdings,
        cashBalance:
          a.balance / 100 -
          holdings.reduce((n, h) => n + h.shares * h.pricePerShare, 0),
        notes: old?.notes || "",
      };
    });
  return {
    ...raw,
    settings: { ...raw.settings, locale: "fr", theme: s.settings.theme },
    investmentAccounts: [
      ...accounts,
      ...(raw.investmentAccounts || []).filter((a) => a.currency !== "EUR"),
    ],
  };
}
export function AdvancedTools() {
  const { state, change } = useFinance();
  const [tab, setTab] = useState(0);
  const value = legacyState(state);
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Placements & Shariah</Typography>
      <Alert severity="info">
        Les valorisations des placements en euros mettent à jour votre
        patrimoine. Les positions en autres devises restent conservées, mais ne
        sont pas additionnées sans conversion.
      </Alert>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Placements détaillés" />
        <Tab label="Shariah & Zakat" />
      </Tabs>
      <Box className={state.settings.theme === "dark" ? "dark" : ""}>
        <AppProvider
          external={{
            state: value,
            dispatch: (action) => {
              void change((s) => {
                const base = legacyState(s),
                  next = reducer(base, action);
                const removed = base.investmentAccounts
                  .filter(
                    (a) =>
                      a.currency === "EUR" &&
                      !next.investmentAccounts.some((n) => n.id === a.id),
                  )
                  .map((a) => a.id);
                if (
                  s.transactions.some(
                    (t) =>
                      removed.includes(t.accountId) ||
                      removed.includes(t.peerAccountId || ""),
                  )
                )
                  throw Error("Ce placement est utilisé par des transactions");
                const valuations = next.investmentAccounts
                  .filter((a) => a.currency === "EUR")
                  .map((a) => {
                    const prior = s.accounts.find((p) => p.id === a.id);
                    return {
                      id: a.id,
                      name: a.name,
                      institution: prior?.institution || "",
                      kind: "investment" as const,
                      currency: "EUR" as const,
                      asOf: today(),
                      balance: Math.round(
                        (a.cashBalance +
                          a.holdings.reduce(
                            (n, h) => n + h.shares * h.pricePerShare,
                            0,
                          )) *
                          100,
                      ),
                    };
                  });
                return {
                  ...s,
                  legacy: next,
                  accounts: [
                    ...s.accounts.filter(
                      (a) =>
                        !removed.includes(a.id) &&
                        !valuations.some((v) => v.id === a.id),
                    ),
                    ...valuations,
                  ],
                };
              }).catch(() => {});
            },
          }}
        >
          {tab === 0 ? <InvestmentsView /> : <ShariahView />}
        </AppProvider>
      </Box>
    </Stack>
  );
}
