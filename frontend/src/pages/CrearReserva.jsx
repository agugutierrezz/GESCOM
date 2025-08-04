import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { CabanasContext } from '../context/CabanasContext';
import 'react-toastify/dist/ReactToastify.css';
import SelectorCabana from '../components/consultar-reserva/SelectorCabana';
import CalendarioReserva from '../components/consultar-reserva/CalendarioReserva';
import BotonVolver from '../components/BotonVolver';
import '../styles/reserva.css';

function CrearReserva() {
  const [cliente, setCliente] = useState('');
  const [cabana, setCabana] = useState('');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [costoTotal, setCostoTotal] = useState('');
  const [sena, setSena] = useState(0);
  const [reservasExistentes, setReservasExistentes] = useState([]);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [diasEstado, setDiasEstado] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [reservaId, setReservaId] = useState(null);


  const cabanas = useContext(CabanasContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const r = location.state;
      if (r.id) {
        setEditando(true);
        setReservaId(r.id);
      }

      if (r.cabana?.id) {
        setCabana(String(r.cabana.id));
      } else if (r.cabana_id) {
        setCabana(String(r.cabana_id));
      } else if (typeof r.cabana === 'string' && cabanas.length > 0) {
        const encontrada = cabanas.find(c => c.nombre === r.cabana);
        if (encontrada) {
          setCabana(String(encontrada.id));
        }
      }

      setCliente(r.cliente || '');
      setFechaInicio(r.fecha_inicio ? new Date(r.fecha_inicio) : null);
      setFechaFin(r.fecha_fin ? new Date(r.fecha_fin) : null);
      setCostoTotal(r.costo_total || '');
      setSena(r.sena || 0);
    }
  }, [location.state]);

  useEffect(() => {
    if (!cabana) return;
    fetch(`http://localhost:3001/api/reservas?cabana_id=${cabana}`)
      .then(res => res.json())
      .then(data => {
        setReservasExistentes(data);
        const estado = {};

      data
        .filter(r => !editando || r.id !== reservaId)
        .forEach(r => {
          const inicio = new Date(r.fecha_inicio);
          const fin = new Date(r.fecha_fin);
          const rInicio = new Date(inicio);
          const rFin = new Date(fin);
          rInicio.setHours(14, 0, 0, 0);
          rFin.setHours(10, 0, 0, 0);

          const keyInicio = rInicio.toISOString().split('T')[0];
          const keyFin = rFin.toISOString().split('T')[0];

          estado[keyInicio] = estado[keyInicio] === 'libre-egreso' ? 'ocupado'
            : estado[keyInicio] === 'ocupado' ? 'ocupado'
            : 'libre-ingreso';

          estado[keyFin] = estado[keyFin] === 'libre-ingreso' ? 'ocupado'
            : estado[keyFin] === 'ocupado' ? 'ocupado'
            : 'libre-egreso';

          let actual = new Date(rInicio);
          actual.setDate(actual.getDate() + 1);
          while (actual < rFin) {
            const key = actual.toISOString().split('T')[0];
            estado[key] = 'ocupado';
            actual.setDate(actual.getDate() + 1);
          }
        });


        setDiasEstado(estado);
        const ocupadas = Object.entries(estado)
          .filter(([_, e]) => e === 'ocupado')
          .map(([fecha]) => new Date(fecha));
        setFechasOcupadas(ocupadas);
      });
  }, [cabana]);

  function validarReserva() {
    if (!fechaInicio || !fechaFin) {
      setMensaje('❌ Seleccioná ambas fechas');
      return false;
    }

    const ingreso = new Date(fechaInicio);
    ingreso.setHours(14, 0, 0, 0);
    const egreso = new Date(fechaFin);
    egreso.setHours(10, 0, 0, 0);

    for (const r of reservasExistentes.filter(r => !editando || r.id !== reservaId)) {
      const rIngreso = new Date(r.fecha_inicio);
      rIngreso.setHours(14, 0, 0, 0);
      const rEgreso = new Date(r.fecha_fin);
      rEgreso.setHours(10, 0, 0, 0);

      if (
        (ingreso >= rIngreso && ingreso < rEgreso) ||
        (egreso > rIngreso && egreso <= rEgreso) ||
        (ingreso <= rIngreso && egreso >= rEgreso)
      ) {
        setMensaje(`❌ Conflicto con reserva de ${r.cliente}`);
        return false;
      }
    }

    setMensaje('✅ Reserva disponible');
    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return;
    if (!validarReserva()) return;

    setGuardando(true);
    setMensaje('Cargando reserva...');

    const body = {
      cliente,
      cabana_id: cabana,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      hora_inicio: '14',
      hora_fin: '10',
      costo_total: parseFloat(costoTotal),
      sena: parseFloat(sena),
    };

    try {
      const url = editando
        ? `http://localhost:3001/api/reservas/${reservaId}`
        : 'http://localhost:3001/api/reservas';
      const metodo = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Reserva guardada correctamente');
        setTimeout(() => navigate('/home'), 2000);
      } else {
        const error = await res.json();
        toast.error(`${error.message}`);
        setMensaje('');
        setGuardando(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la reserva');
      setMensaje('');
      setGuardando(false);
    }
  };

  return (
    <>
      <div><BotonVolver /></div>
      <div className="reserva-container">
        <h2>{editando ? 'Editar Reserva' : 'Agregar Nueva Reserva'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Cliente</label>
          <input value={cliente} onChange={e => setCliente(e.target.value)} required />

          <SelectorCabana
            cabanas={cabanas}
            cabanaSeleccionada={cabana}
            onChange={value => {
              setCabana(value);
              setFechaInicio(null);
              setFechaFin(null);
              setMensaje('');
            }}
          />

          <CalendarioReserva
            label="Fecha Ingreso"
            value={fechaInicio}
            onChange={setFechaInicio}
            fechasOcupadas={fechasOcupadas}
            diasEstado={diasEstado}
          />

          <CalendarioReserva
            label="Fecha Egreso"
            value={fechaFin}
            onChange={setFechaFin}
            fechasOcupadas={fechasOcupadas}
            diasEstado={diasEstado}
          />

          <label>Costo Total</label>
          <input type="number" value={costoTotal} onChange={e => setCostoTotal(e.target.value)} required />

          <label>Seña</label>
          <input type="number" value={sena} onChange={e => setSena(e.target.value)} />

          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar Reserva'}
          </button>
        </form>

        <div className="mensaje">{mensaje}</div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}

export default CrearReserva;
