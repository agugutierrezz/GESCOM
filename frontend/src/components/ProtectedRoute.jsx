import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API}/api/usuarios/me`, {
          credentials: 'include',
          signal: ac.signal,
        });
        setState({ loading: false, ok: r.ok });
      } catch {
        setState({ loading: false, ok: false });
      }
    })();
    return () => ac.abort();
  }, []);

  if (state.loading) return null;
  if (!state.ok) return <Navigate to="/" replace />;
  return children;
}
