// src/context/CabanasContext.jsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

/** Contexto principal: EXPONE SOLO el array de cabañas */
export const CabanasContext = createContext([]);

/** Contexto meta: loading/error/refresh/userId (userId queda null aquí) */
export const CabanasMetaContext = createContext({
  loading: true,
  error: null,
  refresh: () => {},
  userId: null,
});

export function CabanasProvider({ children }) {
  const [cabanas, setCabanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // No resolvemos userId acá (lo puede proveer ProtectedRoute/otro contexto si lo necesitás)
  const userId = null;

  const loadCabanas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/cabanas`, { credentials: 'include' });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.message || `Error ${r.status} al cargar cabañas`);
      }
      const data = await r.json();
      setCabanas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Error cargando cabañas');
      setCabanas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Evita doble llamada en dev por StrictMode
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    loadCabanas();
  }, [loadCabanas]);

  const refresh = useCallback(() => { loadCabanas(); }, [loadCabanas]);

  return (
    <CabanasMetaContext.Provider value={{ loading, error, refresh, userId }}>
      <CabanasContext.Provider value={cabanas}>
        {children}
      </CabanasContext.Provider>
    </CabanasMetaContext.Provider>
  );
}

export function useCabanasMeta() {
  return useContext(CabanasMetaContext);
}
