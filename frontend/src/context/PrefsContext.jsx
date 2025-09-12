import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LS_KEY = "prefs.v1";
const PrefsCtx = createContext(null);

export function PrefsProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return {
      fijoIngreso: saved.fijoIngreso ?? true,
      fijoEgreso : saved.fijoEgreso ?? true,
      horaIngreso: saved.horaIngreso || "14:00",
      horaEgreso : saved.horaEgreso  || "10:00",
    };
  });

  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(state)), [state]);

  const api = useMemo(() => ({
    ...state,
    setFijoIngreso: (v) => setState(s => ({...s, fijoIngreso: v})),
    setFijoEgreso : (v) => setState(s => ({...s, fijoEgreso : v})),
    setHoraIngreso: (hhmm) => setState(s => ({...s, horaIngreso: hhmm})),
    setHoraEgreso : (hhmm) => setState(s => ({...s, horaEgreso : hhmm})),
  }), [state]);

  return <PrefsCtx.Provider value={api}>{children}</PrefsCtx.Provider>;
}

export const usePrefs = () => useContext(PrefsCtx);
