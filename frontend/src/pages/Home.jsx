import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/home.css';
import { isAdminUser } from '../utils/isAdminUser';

const API = import.meta.env.VITE_API_URL;

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // logout igual que antes
  const logout = async () => {
    try {
      await fetch(`${API}/api/usuarios/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Error en logout:', e);
    } finally {
      navigate('/');
    }
  };

  useEffect(() => {
    let ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API}/api/usuarios/me`, { credentials: 'include', signal: ac.signal });
        if (r.ok) {
          const u = await r.json();
          setUser(u);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const irA = (opcion) => {
    switch (opcion) {
      case 'crear':           navigate('/reservas/create');   break;
      case 'ver':             navigate('/reservas/view');     break;
      case 'disponibilidad':  navigate('/reservas/consulta'); break;
      case 'prefs':           navigate('/preferencias');      break;
      case 'cabanas':         navigate('/cabanas');           break;
      case 'usuarios':        navigate('/admin/usuarios');    break;
      case 'adminCabanas':    navigate('/admin/cabanas');     break;
      case 'salir':           logout();                       break;
      default: break;
    }
  };

  if (loadingUser) return null;

  const esAdmin = isAdminUser(user);

  return (
    <div className="home__wrap">
      <h1 className="home__title">{esAdmin ? 'Panel de Administración' : 'Menú Principal'}</h1>

      <div className="card card--lg home__card">
        <div className="home__actions">
          {!esAdmin ? (
            <>
              <button className="btn btn--primary btn--block" onClick={() => irA('crear')}>Agregar Reserva</button>
              <button className="btn btn--primary btn--block" onClick={() => irA('ver')}>Ver Reservas</button>
              <button className="btn btn--primary btn--block" onClick={() => irA('disponibilidad')}>Consultar Disponibilidad</button>
              <button className="btn btn--primary btn--block" onClick={() => irA('cabanas')}>Editar Cabañas</button>
              <button className="btn btn--primary btn--block" onClick={() => irA('prefs')}>Preferencias</button>
            </>
          ) : (
            <>
              <button className="btn btn--primary btn--block" onClick={() => irA('usuarios')}>
                Gestionar Usuarios
              </button>
              <button className="btn btn--primary btn--block" onClick={() => irA('adminCabanas')}>
                Gestionar Cabañas
              </button>
            </>
          )}

          <button className="btn btn--danger btn--block" onClick={() => irA('salir')}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

export default Home;



