const API = import.meta.env.VITE_API_URL;

export async function fetchJSON(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (res.status === 401) {
    return { ok: false, status: 401 };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const getMe = () => fetchJSON('/api/usuarios/me');
export const postLogin = (body) => fetchJSON('/api/usuarios/login', { method: 'POST', body: JSON.stringify(body) });
export const postLogout = () => fetchJSON('/api/usuarios/logout', { method: 'POST' });
