import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";
import { useFinance } from "./context";
import {
  applySuggestions,
  parseCSV,
  parsePages,
  reconciliation,
  commitImport,
  undoImport,
  ImportResult,
  PdfPage,
  Mapping,
} from "./imports";

import { categories, euros, uid } from "./model";
export function ImportView() {
  const { state, change } = useFinance();
  const [account, setAccount] = useState(state.accounts[0]?.id || ""),
    [results, setResults] = useState<
      { name: string; hash: string; result: ImportResult; pages?: PdfPage[] }[]
    >([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [force, setForce] = useState(false),
    [map, setMap] = useState<Mapping>({
      debit: 0.75,
      credit: 0.9,
      year: new Date().getFullYear(),
    }),
    [showMap, setShowMap] = useState(false);
  async function read(files: FileList | null) {
    if (!files || !account) return;
    setBusy(true);
    setError("");
    const out: typeof results = [];
    try {
      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        const pages = /\.pdf$/i.test(file.name)
          ? await (await import("./pdf")).extractPDF(file)
          : undefined;
        const remembered = localStorage.getItem(`finflow-columns-${account}`);
        const mapping = remembered
          ? (JSON.parse(remembered) as Mapping)
          : undefined;
        const result = pages
          ? parsePages(pages, account, mapping)
          : parseCSV(await file.text(), account);
        out.push({
          name: file.name,
          hash,
          pages,
          result: applySuggestions(
            result,
            {
              ...state,
              transactions: [
                ...state.transactions,
                ...out.flatMap((o) => o.result.rows.filter((r) => r.keep)),
              ],
            },
            hash,
          ),
        });
      }
      setResults(out);
      setForce(false);
    } catch (e) {
      setError(`Lecture impossible : ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  const update = (i: number, id: string, patch: object) =>
    setResults((r) =>
      r.map((f, j) =>
        j === i
          ? {
              ...f,
              result: {
                ...f.result,
                rows: f.result.rows.map((t) =>
                  t.id === id ? { ...t, ...patch } : t,
                ),
              },
            }
          : f,
      ),
    );
  const needsReview = results.some(
    (f) =>
      f.result.warnings.length ||
      (reconciliation(f.result).checked && !reconciliation(f.result).ok),
  );
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Importer mes relevés</Typography>
      <Typography color="text.secondary">
        Les fichiers sont lus sur cet appareil. Vérifiez les lignes avant de les
        ajouter. Les PDF scannés nécessitent un export texte ou CSV.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            label="Compte du relevé"
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              setResults([]);
            }}
            sx={{ minWidth: 220 }}
          >
            {state.accounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            component="label"
            variant="contained"
            disabled={!account || busy}
          >
            Choisir PDF ou CSV
            <input
              hidden
              type="file"
              multiple
              accept=".pdf,.csv"
              onChange={(e) => {
                void read(e.target.files);
                e.target.value = "";
              }}
            />
          </Button>
          <Button onClick={() => setShowMap(!showMap)}>
            Ajuster les colonnes PDF
          </Button>
        </Stack>
        {!account && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Créez un compte ou chargez votre import initial dans Sauvegardes.
          </Alert>
        )}
        {showMap && (
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Typography>
              Position horizontale des colonnes, en % de la largeur de page.
              Ajustez uniquement si la détection automatique échoue.
            </Typography>
            <Stack direction="row" spacing={2}>
              {(["debit", "credit", "balance"] as const).map((k) => (
                <TextField
                  key={k}
                  type="number"
                  label={
                    k === "debit"
                      ? "Débit %"
                      : k === "credit"
                        ? "Crédit %"
                        : "Solde % (facultatif)"
                  }
                  value={map[k] === undefined ? "" : Math.round(map[k]! * 100)}
                  onChange={(e) =>
                    setMap({
                      ...map,
                      [k]:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value) / 100,
                    })
                  }
                />
              ))}
              <TextField
                type="number"
                label="Année"
                value={map.year}
                onChange={(e) => setMap({ ...map, year: +e.target.value })}
              />
            </Stack>
            <Button
              onClick={() => {
                if (!(
                  map.debit >= 0 &&
                  map.credit > map.debit &&
                  map.credit <= 1
                )) {
                  setError("Positions invalides");
                  return;
                }
                localStorage.setItem(
                  `finflow-columns-${account}`,
                  JSON.stringify(map),
                );
                setResults(
                  results.map((f) =>
                    f.pages
                      ? {
                          ...f,
                          result: applySuggestions(
                            parsePages(f.pages, account, map),
                            state,
                            f.hash,
                          ),
                        }
                      : f,
                  ),
                );
              }}
            >
              Appliquer et mémoriser
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem(`finflow-columns-${account}`);
                setResults(
                  results.map((f) =>
                    f.pages
                      ? {
                          ...f,
                          result: applySuggestions(
                            parsePages(f.pages, account),
                            state,
                            f.hash,
                          ),
                        }
                      : f,
                  ),
                );
              }}
            >
              Rétablir la détection automatique
            </Button>
          </Stack>
        )}
      </Paper>
      {busy && <Alert severity="info">Lecture des documents…</Alert>}
      {results.map((f, i) => {
        const c = reconciliation(f.result);
        return (
          <Paper key={f.hash + i} sx={{ p: 2 }}>
            <Typography variant="h6">{f.name}</Typography>
            <Typography>
              {f.result.rows.length} opérations détectées · Débits{" "}
              {euros(c.debits)} · Crédits {euros(c.credits)}
            </Typography>
            <Alert
              severity={c.checked ? (c.ok ? "success" : "warning") : "info"}
              sx={{ my: 2 }}
            >
              {c.checked
                ? c.ok
                  ? "Totaux et/ou soldes rapprochés avant sélection."
                  : "Écart avec les totaux ou soldes du document : vérifiez les lignes."
                : "Contrôle automatique des soldes indisponible. Vérifiez les montants avec le PDF."}
            </Alert>
            {f.result.warnings.map((w, n) => (
              <Alert key={n} severity="warning">
                {w}
              </Alert>
            ))}
            <Stack direction="row" spacing={1} sx={{ my: 2 }}>
              <Button
                onClick={() =>
                  setResults(
                    results.map((r, j) =>
                      j === i
                        ? {
                            ...r,
                            result: {
                              ...r.result,
                              rows: r.result.rows.map((t) => ({
                                ...t,
                                keep: t.status === "booked",
                              })),
                            },
                          }
                        : r,
                    ),
                  )
                }
              >
                Garder les opérations comptabilisées
              </Button>
              <Button
                onClick={() =>
                  setResults(
                    results.map((r, j) =>
                      j === i
                        ? {
                            ...r,
                            result: {
                              ...r.result,
                              rows: r.result.rows.map((t) => ({
                                ...t,
                                keep: false,
                              })),
                            },
                          }
                        : r,
                    ),
                  )
                }
              >
                Tout ignorer
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 1050 }}>
                <TableHead>
                  <TableRow>
                    {[
                      "Garder",
                      "Date",
                      "Libellé",
                      "Montant €",
                      "Type",
                      "Catégorie",
                      "Mois budget",
                      "Vérification",
                    ].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {f.result.rows.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Checkbox
                          checked={t.keep}
                          onChange={(e) =>
                            update(i, t.id, { keep: e.target.checked })
                          }
                          slotProps={{
                            input: { "aria-label": `Garder ${t.description}` },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={t.date}
                          onChange={(e) =>
                            update(i, t.id, { date: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          multiline
                          value={t.description}
                          onChange={(e) =>
                            update(i, t.id, { description: e.target.value })
                          }
                          sx={{ minWidth: 240 }}
                        />
                        <Typography variant="caption">Page {t.page}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={t.amount / 100}
                          slotProps={{ htmlInput: { step: 0.01 } }}
                          onChange={(e) =>
                            update(i, t.id, {
                              amount: Math.round(+e.target.value * 100),
                            })
                          }
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          select
                          value={t.kind}
                          onChange={(e) =>
                            update(i, t.id, {
                              kind: e.target.value,
                              ...(e.target.value === "transfer"
                                ? { category: "Hors budget / transfert" }
                                : {}),
                            })
                          }
                        >
                          {Object.entries({
                            income: "Revenu",
                            expense: "Dépense",
                            refund: "Remboursement",
                            transfer: "Transfert interne",
                            saving: "Épargne",
                            investment: "Investissement",
                          }).map(([v, l]) => (
                            <MenuItem key={v} value={v}>
                              {l}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          select
                          value={t.category}
                          onChange={(e) =>
                            update(i, t.id, { category: e.target.value })
                          }
                        >
                          {[
                            "Revenus",
                            ...categories,
                            "Hors budget / transfert",
                          ].map((c) => (
                            <MenuItem key={c} value={c}>
                              {c}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="month"
                          value={t.budgetMonth}
                          onChange={(e) =>
                            update(i, t.id, { budgetMonth: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            t.status === "pending"
                              ? "En attente"
                              : "Comptabilisée"
                          }
                        />
                        <Typography variant="caption" sx={{ display: "block" }}>
                          {t.warning || "À vérifier"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      })}
      {results.length > 0 && (
        <Stack spacing={1}>
          {needsReview && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                />
              }
              label="J’ai vérifié manuellement les avertissements et les écarts."
            />
          )}
          <Button
            variant="contained"
            disabled={
              busy ||
              (needsReview && !force) ||
              !results.some((f) => f.result.rows.length)
            }
            onClick={async () => {
              setBusy(true);
              try {
                await change((s) =>
                  results.reduce(
                    (a, f) => commitImport(a, f.result, f.name, force),
                    s,
                  ),
                );
                setResults([]);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Importer{" "}
            {results.reduce(
              (n, f) => n + f.result.rows.filter((t) => t.keep).length,
              0,
            )}{" "}
            opérations sélectionnées
          </Button>
        </Stack>
      )}
      <Typography variant="h6">Historique des imports</Typography>
      {state.batches.map((b) => (
        <Paper
          key={b.id}
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography>{b.name}</Typography>
            <Typography variant="caption">
              {b.transactionIds.length} opérations · {b.ignoredKeys.length}{" "}
              ignorées
            </Typography>
          </Box>
          <Button
            color="warning"
            onClick={() => {
              if (
                confirm(
                  "Annuler ce lot et retirer ses transactions, y compris celles modifiées depuis ?",
                )
              )
                void change((s) => undoImport(s, b.id)).catch(() => {});
            }}
          >
            Annuler ce lot
          </Button>
        </Paper>
      ))}
      <Button
        onClick={() => {
          if (
            confirm(
              "Réexaminer les lignes ignorées lors des prochains imports ?",
            )
          )
            void change((s) => ({ ...s, ignored: [] })).catch(() => {});
        }}
      >
        Réexaminer les lignes ignorées
      </Button>
      <Typography variant="h6">Règles de classement</Typography>
      <Typography variant="body2">
        Créez une règle dans les transactions pour mémoriser un libellé et sa
        catégorie.
      </Typography>
      {state.rules.map((r) => (
        <Stack key={r.id} direction="row" spacing={2}>
          <Typography>
            {r.contains} → {r.category}
          </Typography>
          <Button
            onClick={() =>
              void change((s) => ({
                ...s,
                rules: s.rules.filter((x) => x.id !== r.id),
              })).catch(() => {})
            }
          >
            Supprimer
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}
