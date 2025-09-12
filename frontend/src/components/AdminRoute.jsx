import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminUser } from '../utils/isAdminUser';

const API = import.meta.env.VITE_API_URL;

export default function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, allow: false });

  useEffect(() => {
    const ac = new AbortController();
    (async ()=>{
      try {
        const r = await fetch(`${API}/api/usuarios/me`, { credentials: 'include', signal: ac.signal });
        if (!r.ok) return setState({ loading:false, allow:false });
        const u = await r.json();
        setState({ loading:false, allow: isAdminUser(u) });
      } catch {
        setState({ loading:false, allow:false });
      }
    })();
    return () => ac.abort();
  }, []);

  if (state.loading) return null;
  if (!state.allow) return <Navigate to="/home" replace />;
  return children;
}
