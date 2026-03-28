import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AppState } from '../models';
import type { Intent } from '../intents/types';
import { reducer } from '../intents/reducer';
import { initialState } from './initialState';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: (intent: Intent) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Persistence helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'finflow_state_v1';

function loadPersistedState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

function persistState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded – silently skip
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => loadPersistedState() ?? initialState
  );

  // Sync to localStorage on every state change
  useEffect(() => {
    persistState(state);
  }, [state]);

  // Apply theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  // Apply dir for RTL (Arabic)
  useEffect(() => {
    document.documentElement.dir = state.settings.locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.settings.locale;
  }, [state.settings.locale]);

  const stableDispatch = useCallback(dispatch, []);

  return (
    <AppContext.Provider value={{ state, dispatch: stableDispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppProvider>');
  return ctx;
}
