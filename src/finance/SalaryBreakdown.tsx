import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useFinance } from "./context";
import { monthly } from "./calculations";
import { euros } from "./model";

export function SalaryBreakdown({ editBudget }: { editBudget: () => void }) {
  const { state } = useFinance();
  const budget = monthly(state, state.settings.month);
  // Both columns use the selected month's regular income, not exceptional
  // receipts, total allocations, another month, or the account balance.
  const salary = budget.reference;
  const percent = (amount: number) =>
    salary != null && salary > 0
      ? new Intl.NumberFormat("fr-FR", {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format((amount || 0) / salary)
      : "À renseigner";
  const [year, month] = state.settings.month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", gap: 1, mb: 2 }}
      >
        <Box>
          <Typography variant="h6">Découpage du salaire · {label}</Typography>
          <Typography variant="body2" color="text.secondary">
            Salaire de référence du mois :{" "}
            {salary == null ? "À renseigner" : euros(salary)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Base : revenu régulier prévu dans Budget mensuel. Renseignez le
            salaire net qui finance ce mois ; les entrées exceptionnelles sont
            exclues.
          </Typography>
        </Box>
        <Button
          onClick={editBudget}
          sx={{ alignSelf: "flex-start", flexShrink: 0 }}
        >
          Modifier le budget
        </Button>
      </Stack>
      {(salary == null || salary <= 0) && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Renseignez un salaire de référence supérieur à zéro pour calculer les
          pourcentages de ce mois.
        </Typography>
      )}
      <TableContainer>
        <Table
          size="small"
          aria-label="Découpage du salaire du mois"
          sx={{ minWidth: 600 }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Enveloppe</TableCell>
              <TableCell align="right">Prévu</TableCell>
              <TableCell align="right">Prévu / salaire</TableCell>
              <TableCell align="right">Réalisé net</TableCell>
              <TableCell align="right">Réalisé / salaire</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budget.rows.map((row) => (
              <TableRow key={row.category}>
                <TableCell component="th" scope="row">
                  {row.category}
                </TableCell>
                <TableCell align="right">{euros(row.planned)}</TableCell>
                <TableCell align="right">{percent(row.planned)}</TableCell>
                <TableCell align="right">{euros(row.actual || 0)}</TableCell>
                <TableCell align="right">{percent(row.actual)}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ "& > *": { fontWeight: 750 } }}>
              <TableCell component="th" scope="row">
                Total affecté
              </TableCell>
              <TableCell align="right">{euros(budget.plannedOut)}</TableCell>
              <TableCell align="right">{percent(budget.plannedOut)}</TableCell>
              <TableCell align="right">{euros(budget.actualOut)}</TableCell>
              <TableCell align="right">{percent(budget.actualOut)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        Chaque montant est divisé par le même salaire de référence du mois
        sélectionné. Le total peut dépasser 100 %. Le réalisé dépend des
        opérations comptabilisées affectées à ce mois budgétaire et reste
        incomplet sans vos transactions.
      </Typography>
    </Paper>
  );
}
