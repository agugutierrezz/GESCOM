import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/login.css';

const API = import.meta.env.VITE_API_URL;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Al montar: si ya hay sesión, me manda a /home. Si 401, lo ignoro.
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API}/api/usuarios/me`, {
          credentials: 'include',
          signal: ac.signal,
        });
        if (r.ok) navigate('/home');
      } catch {
        // ignoramos errores de red aquí
      }
    })();
    return () => ac.abort();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      // Intentamos parsear json si lo hay
      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok) {
        navigate('/home');
      } else {
        setMensaje(`Error: ${data?.message || 'Credenciales inválidas'}`);
      }
    } catch (err) {
      console.error(err);
      setMensaje('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login__wrap">
      <h1 className="login__title">Iniciar Sesión</h1>
      <div className="card card--lg login__card">
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <input
            className="input"  
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            className="input"  
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="login__actions">
            <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </div>
        </form>

        {mensaje && <div className="mensaje" role="alert">{mensaje}</div>}
      </div>
    </div>
  );
}

export default Login;
