import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { CabanasContext } from '../context/CabanasContext';
import 'react-toastify/dist/ReactToastify.css';
import SelectorCabana from '../components/consultar-reserva/SelectorCabana';
import CalendarioReserva from '../components/consultar-reserva/CalendarioReserva';
import BotonVolver from '../components/BotonVolver';
import InputDinero from '../components/reserva/InputDinero';
import AdicionalesForm from '../components/reserva/AdicionalesForm'
import '../styles/reserva.css';

function CrearReserva() {
  const [cliente, setCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
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
  const [adicionales, setAdicionales] = useState([]);


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
      setDescripcion(r.descripcion || '');
      setFechaInicio(r.fecha_inicio ? new Date(r.fecha_inicio) : null);
      setFechaFin(r.fecha_fin ? new Date(r.fecha_fin) : null);
      setCostoTotal(r.costo_total || '');
      setSena(r.sena || 0);
      setAdicionales(r.adicionales || []);
    }
  }, [location.state]);

  useEffect(() => {
    if (!cabana) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/reservas?cabana_id=${cabana}`)
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

  useEffect(() => {
    if (!editando || !reservaId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/adicionales/${reservaId}`)
      .then(res => res.json())
      .then(data => {
            const adicionalesConFlag = data.map(a => ({
              ...a,
              fecha_pago: a.fecha_pago?.split('T')[0], 
              guardado: true
            }));
        setAdicionales(adicionalesConFlag);
      })
      .catch(err => {
        console.error('❌ Error al obtener adicionales:', err);
      });
  }, [editando, reservaId]);


  function validarReserva() {
    if (!fechaInicio || !fechaFin) {
      setMensaje('Seleccioná ambas fechas');
      return false;
    }

    if (fechaInicio > fechaFin) {
      setMensaje('La fecha de ingreso no puede ser posterior a la de egreso');
      return false;
    }

    if (parseFloat(costoTotal) <= 0) {
      setMensaje('El costo total debe ser mayor a cero');
      return false;
    }

    if (parseFloat(sena) > parseFloat(costoTotal)) {
      setMensaje('La seña no puede ser mayor al costo total');
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
        setMensaje(`Conflicto con reserva de ${r.cliente}`);
        return false;
      }
    }

    setMensaje('Reserva disponible');
    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return;
    if (!validarReserva()) return;

    setGuardando(true);
    setMensaje('Cargando reserva...');

    function formatearFechaLocal(fecha) {
      const corregida = new Date(fecha);
      corregida.setDate(corregida.getDate() + 1); // ⬅️ FIX aquí

      const año = corregida.getFullYear();
      const mes = String(corregida.getMonth() + 1).padStart(2, '0');
      const dia = String(corregida.getDate()).padStart(2, '0');

      return `${año}-${mes}-${dia}`;
    }

    const body = {
      cliente,
      descripcion,
      cabana_id: cabana,
      fecha_inicio: formatearFechaLocal(fechaInicio),
      fecha_fin: formatearFechaLocal(fechaFin),    
      hora_inicio: '14',
      hora_fin: '10',
      costo_total: parseFloat(costoTotal),
      sena: parseFloat(sena),
      adicionales
    };

    try {
      const url = editando
        ? `${import.meta.env.VITE_API_URL}/api/reservas/${reservaId}`
        : `${import.meta.env.VITE_API_URL}/api/reservas`;
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

          <label>Descripcion (opcional)</label>
          <input value={descripcion} onChange={e => setDescripcion(e.target.value)} />

          <label>Cabaña</label>
          <SelectorCabana
            cabanas={cabanas}
            cabanaSeleccionada={cabana}
            onChange={value => {
              setCabana(String(value));
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
          <InputDinero value={costoTotal} onChange={setCostoTotal} required/>

          <label>Seña</label>
          <InputDinero value={sena} onChange={setSena} />

          <AdicionalesForm
            reservaId={editando ? reservaId : null}
            adicionales={adicionales}
            setAdicionales={setAdicionales}
          />

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
