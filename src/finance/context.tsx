import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { State, validateState } from "./model";
import { loadState, saveState } from "./storage";
interface Store {
  state: State;
  change: (fn: (s: State) => State) => Promise<void>;
  busy: boolean;
  error: string;
  clearError: () => void;
}
const Context = createContext<Store | null>(null);
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const current = useRef<State | null>(null),
    queue = useRef(Promise.resolve());
  const load = () =>
    loadState()
      .then((s) => {
        current.current = s;
        setState(s);
        setError("");
      })
      .catch((e) =>
        setError(
          `Impossible de lire vos données : ${e.message}. Rien n’a été effacé.`,
        ),
      );
  useEffect(() => {
    void load();
  }, []);
  async function change(fn: (s: State) => State) {
    const operation = queue.current.then(async () => {
      if (!current.current) return;
      setBusy(true);
      try {
        const next = validateState(fn(current.current));
        const saved = await saveState(next, current.current.revision ?? 0);
        current.current = saved;
        setState(saved);
        setError("");
      } catch (e) {
        setError(`Modification non enregistrée : ${(e as Error).message}`);
        throw e;
      } finally {
        setBusy(false);
      }
    });
    queue.current = operation.catch(() => {});
    return operation;
  }
  if (!state)
    return (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        {error || "Ouverture de votre budget…"}
        {error && <button onClick={() => void load()}>Réessayer</button>}
      </main>
    );
  return (
    <Context.Provider
      value={{ state, change, busy, error, clearError: () => setError("") }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFinance() {
  const s = useContext(Context);
  if (!s) throw Error("Provider absent");
  return s;
}
