import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservaCard from '../components/reserva/ReservaCard';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import BotonVolver from '../components/BotonVolver';
import ScreenLoader from '../components/ScreenLoader';
import '../styles/pages/listar-reservas.css';

const MySwal = withReactContent(Swal);
const API = import.meta.env.VITE_API_URL;

function ListarReservas() {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API}/api/reservas`, {
          credentials: 'include',
          signal: ac.signal,
        });
        if (!res.ok) {
          // si hay 401, ProtectedRoute debería sacarte; acá prevenimos romper el render
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `Error ${res.status}`);
        }
        const data = await res.json();
        setReservas(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Error cargando reservas:', e);
          setErrMsg(e.message || 'No se pudieron cargar las reservas');
          setReservas([]); // 👈 evitá .filter sobre objeto
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  if (loading) return <ScreenLoader />;

  const handleEdit = (reserva) => {
    navigate('/reservas/create', { state: reserva });
  };

  const handleView = (reserva) => {
    navigate(`/reservas/${reserva.id}`);
  };

  const handleDelete = async (reserva) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `¿Eliminar la reserva de <strong>${reserva.cliente}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        const r = await fetch(`${API}/api/reservas/${reserva.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err?.message || `Error ${r.status}`);
        }
        setReservas(prev => (Array.isArray(prev) ? prev.filter(r => r.id !== reserva.id) : []));
        MySwal.fire({
          title: 'Eliminada',
          text: 'La reserva fue eliminada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (e) {
        console.error('❌ Error al eliminar:', e);
        MySwal.fire({
          title: 'Error',
          text: e.message || 'No se pudo eliminar la reserva.',
          icon: 'error',
        });
      }
    }
  };

  return (
    <div className="listar__wrap">
      <div className="back-fixed"><BotonVolver /></div>
      <div className="listar__container">
        <div className="listar__header">
          <h2 className="listar__title">Reservas Próximas</h2>
        </div>

        <div className="listar__controls">
          <input
            type="text"
            placeholder="Buscar por nombre, fecha o cabaña..."
            onChange={(e) => setFiltro(e.target.value.toLowerCase())}
            className="input listar__search"
          />

          <label className="listar__checkbox">
            <input
              type="checkbox"
              checked={mostrarInactivas}
              onChange={() => setMostrarInactivas(prev => !prev)}
            />
            <span>Mostrar también reservas pasadas</span>
          </label>
        </div>

        {errMsg && <div className="listar__error">{errMsg}</div>}

        <div className="listar__list">
          {(Array.isArray(reservas) ? reservas : [])
            .filter(r => {
              const texto = (filtro || '').trim();
              if (!mostrarInactivas && !r.esactiva) return false;

              const fechaYMDaLocal = (v) => {
                const ymd = String(v).split('T')[0];
                const [y, m, d] = ymd.split('-').map(Number);
                if (!y || !m || !d) return v || '';
                return new Date(y, m - 1, d).toLocaleDateString('es-AR');
              };

              const cliente = (r.cliente || '').toLowerCase();
              const fechaInicio = fechaYMDaLocal(r.fecha_inicio);
              const fechaFin    = fechaYMDaLocal(r.fecha_fin);
              const nombreCabana =
                typeof r.cabana === 'object'
                  ? (r.cabana?.nombre || '').toLowerCase()
                  : String(r.cabana || '').toLowerCase();

              return (
                cliente.includes(texto) ||
                nombreCabana.includes(texto) ||
                fechaInicio.includes(texto) ||
                fechaFin.includes(texto)
              );
            })
            .map(reserva => (
              <ReservaCard
                key={reserva.id}
                reserva={reserva}
                onEdit={handleEdit}
                onDelete={() => handleDelete(reserva)}
                onView={handleView}
              />
            ))
          }

          {(!reservas || reservas.length === 0) && (
            <p className="listar__empty">No hay reservas para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListarReservas;
