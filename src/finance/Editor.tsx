import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";
export interface Field {
  key: string;
  label: string;
  type?: "number" | "date" | "month" | "text" | "money";
  options?: { value: string; label: string }[];
  optional?: boolean;
  min?: number;
  max?: number;
}
export function Editor({
  title,
  fields,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  fields: Field[];
  initial: Record<string, unknown>;
  onSave: (v: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [values, set] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.key,
        initial[f.key] == null
          ? ""
          : f.type === "money"
            ? String(Number(initial[f.key]) / 100)
            : String(initial[f.key]),
      ]),
    ),
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const next = { ...initial };
            for (const f of fields)
              next[f.key] =
                values[f.key] === "" && f.optional
                  ? null
                  : f.type === "money"
                    ? Math.round(Number(values[f.key]) * 100)
                    : f.type === "number"
                      ? Number(values[f.key])
                      : values[f.key];
            await onSave(next);
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {fields.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                value={values[f.key]}
                required={!f.optional}
                select={!!f.options}
                type={
                  f.options
                    ? "text"
                    : f.type === "money"
                      ? "number"
                      : f.type || "text"
                }
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    step: f.type === "money" ? "0.01" : 1,
                    min: f.min,
                    max: f.max,
                  },
                }}
                onChange={(e) => set({ ...values, [f.key]: e.target.value })}
              >
                {f.options?.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
