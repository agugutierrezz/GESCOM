import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { CabanasContext } from '../context/CabanasContext';
import { usePrefs } from '../context/PrefsContext';
import 'react-toastify/dist/ReactToastify.css';
import SelectorCabana from '../components/consultar-reserva/SelectorCabana';
import CalendarioReserva from '../components/consultar-reserva/CalendarioReserva';
import BotonVolver from '../components/BotonVolver';
import InputDinero from '../components/reserva/InputDinero';
import AdicionalesForm from '../components/reserva/AdicionalesForm';
import Backdrop from '@mui/material/Backdrop';           
import CircularProgress from '@mui/material/CircularProgress'; 
import '../styles/pages/crear-reservas.css';             

const API = import.meta.env.VITE_API_URL;

function CrearReserva() {
  const [cliente, setCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cabana, setCabana] = useState('');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [costoTotal, setCostoTotal] = useState('');
  const [tipoMoneda, setTipoMoneda] = useState('');
  const [sena, setSena] = useState(0);
  const [reservasExistentes, setReservasExistentes] = useState([]);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [diasEstado, setDiasEstado] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [reservaId, setReservaId] = useState(null);
  const [adicionales, setAdicionales] = useState([]);
  const [cotizaciones, setCotizaciones] = useState(null);
  const [dolares, setDolares] = useState({ montoUSD: '', tipoCambio: 'blue_venta' });
  const prefs = usePrefs();

  const [horaIngresoLibre, setHoraIngresoLibre] = useState(prefs.horaIngreso);
  const [horaEgresoLibre , setHoraEgresoLibre ] = useState(prefs.horaEgreso);
  useEffect(()=> setHoraIngresoLibre(prefs.horaIngreso), [prefs.horaIngreso]);
  useEffect(()=> setHoraEgresoLibre (prefs.horaEgreso ), [prefs.horaEgreso ]);
  const HORA_INGRESO = prefs.fijoIngreso ? prefs.horaIngreso : horaIngresoLibre;
  const HORA_EGRESO  = prefs.fijoEgreso  ? prefs.horaEgreso  : horaEgresoLibre;
  const horaToHour = (hhmm) => parseInt(String(hhmm).split(':')[0], 10) || 0;
  const H_IN  = horaToHour(HORA_INGRESO);
  const H_OUT = horaToHour(HORA_EGRESO);

  const cabanas = useContext(CabanasContext);
  const navigate = useNavigate();
  const location = useLocation();

  function parseLocalDateTime(s) {
    if (!(typeof s === 'string')) return new Date(s);
    if (/Z|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s); // ya trae zona
    const [datePart, timePart] = s.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    if (timePart) {
      const [hh, mm = 0] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, hh, mm, 0, 0);
    }
    return new Date(y, m - 1, d, 0, 0, 0, 0); // solo fecha, local
  }

  // Prefill al entrar con state (editar o crear desde otra pantalla)
  useEffect(() => {
    if (!location.state) return;
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
      if (encontrada) setCabana(String(encontrada.id));
    }

    function parsearFechaLocal(fechaStr) {
      const soloFecha = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
      const [año, mes, dia] = soloFecha.split('-');
      return new Date(Number(año), Number(mes) - 1, Number(dia));
    }

    setCliente(r.cliente || '');
    setDescripcion(r.descripcion || '');
    setFechaInicio(r.fecha_inicio ? parsearFechaLocal(r.fecha_inicio) : null);
    setFechaFin(r.fecha_fin ? parsearFechaLocal(r.fecha_fin) : null);
    setCostoTotal(r.costo_total || '');
    setTipoMoneda((r.tipo_moneda || 'ARS').toUpperCase());
    setSena(r.sena || 0);
    setAdicionales(r.adicionales || []);
  }, [location.state, cabanas]);

  // Traer reservas de la cabaña seleccionada (para disponibilidad)
  useEffect(() => {
    if (!cabana) return;
    const ac = new AbortController();

    fetch(`${API}/api/reservas?cabana_id=${cabana}`, {
      credentials: 'include',            
      signal: ac.signal,
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `Error ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setReservasExistentes(Array.isArray(data) ? data : []);
        const estado = {};

        (Array.isArray(data) ? data : [])
          .filter(r => !editando || r.id !== reservaId)
          .forEach(r => {
            const rInicio = parseLocalDateTime(r.fecha_inicio);
            const rFin    = parseLocalDateTime(r.fecha_fin);

            rInicio.setHours(H_IN,  0, 0, 0);
            rFin.setHours(H_OUT, 0, 0, 0);

            const keyLocal = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

            const keyInicio = keyLocal(rInicio);
            const keyFin    = keyLocal(rFin);

            estado[keyInicio] =
              estado[keyInicio] === 'libre-egreso' ? 'ocupado'
              : estado[keyInicio] === 'ocupado'    ? 'ocupado'
              : 'libre-ingreso';

            estado[keyFin] =
              estado[keyFin] === 'libre-ingreso' ? 'ocupado'
              : estado[keyFin] === 'ocupado'     ? 'ocupado'
              : 'libre-egreso';

            const actual = new Date(rInicio);
            actual.setDate(actual.getDate() + 1);
            while (actual < rFin) {
              const key = keyLocal(actual);
              estado[key] = 'ocupado';
              actual.setDate(actual.getDate() + 1);
            }
          });

        setDiasEstado(estado);

        const ocupadas = Object.entries(estado)
          .filter(([, e]) => e === 'ocupado')
          .map(([ymd]) => { const [y,m,d]=ymd.split('-').map(Number); return new Date(y,m-1,d); });

        setFechasOcupadas(ocupadas);
      }).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('❌ Error obteniendo reservas:', err);
          setReservasExistentes([]);
          setDiasEstado({});
          setFechasOcupadas([]);
        }
      });

    return () => ac.abort();
  }, [cabana, editando, reservaId, H_IN, H_OUT]);

  // Cargar adicionales si estoy editando (endpoint correcto)
  useEffect(() => {
    if (!editando || !reservaId) return;
    const ac = new AbortController();

    fetch(`${API}/api/adicionales/${reservaId}`, {
      credentials: 'include',            // ← también autenticado
      signal: ac.signal,
    })
      .then(res => res.json())
      .then(data => {
        const adicionalesConFlag = (Array.isArray(data) ? data : []).map(a => ({
          ...a,
          fecha_pago: a.fecha_pago?.split('T')[0],
          guardado: true,
        }));
        setAdicionales(adicionalesConFlag);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('❌ Error al obtener adicionales:', err);
        }
      });

    return () => ac.abort();
  }, [editando, reservaId]);

  // Cotizaciones dólar
  useEffect(() => {
    async function obtenerDolares() {
      try {
        const [oficialRes, blueRes] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares/oficial'),
          fetch('https://dolarapi.com/v1/dolares/blue'),
        ]);
        const oficial = await oficialRes.json();
        const blue = await blueRes.json();
        setCotizaciones({
          oficial_compra: oficial.compra,
          oficial_venta: oficial.venta,
          blue_compra: blue.compra,
          blue_venta: blue.venta,
        });
      } catch (err) {
        console.error('❌ Error al obtener cotizaciones:', err);
      }
    }
    obtenerDolares();
  }, []);

  useEffect(() => {
    if (!cotizaciones) return;
    const valorUSD = parseFloat(dolares.montoUSD);
    if (!isNaN(valorUSD)) {
      const cotizacion = cotizaciones[dolares.tipoCambio];
      const enPesos = valorUSD * cotizacion;
      setCostoTotal(enPesos.toFixed(2));
    }
  }, [dolares, cotizaciones]);

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
    ingreso.setHours(H_IN, 0, 0, 0);
    const egreso  = new Date(fechaFin);    
    egreso.setHours(H_OUT, 0, 0, 0);

    for (const r of reservasExistentes.filter(r => !editando || r.id !== reservaId)) {
      const rIngreso = new Date(r.fecha_inicio); 
      rIngreso.setHours(H_IN, 0, 0, 0);
      const rEgreso  = new Date(r.fecha_fin);    
      rEgreso.setHours(H_OUT, 0, 0, 0);

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

    if (tipoMoneda !== 'ARS' && tipoMoneda !== 'USD') {
      toast.error('Seleccioná la moneda de la reserva.');
      return;
    }

    setGuardando(true);

    function formatearFechaLocal(d) {
      const y = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();
      return new Date(Date.UTC(y, m, day)).toISOString().slice(0, 10);
    }

    const body = {
      cliente,
      descripcion,
      cabana_id: Number(cabana),
      fecha_inicio: formatearFechaLocal(fechaInicio),
      fecha_fin: formatearFechaLocal(fechaFin),
      hora_inicio: Number(H_IN),
      hora_fin: Number(H_OUT),
      costo_total: parseFloat(costoTotal),
      sena: parseFloat(sena),
      tipo_moneda: tipoMoneda,
      adicionales,
    };

    try {
      const url = editando ? `${API}/api/reservas/${reservaId}` : `${API}/api/reservas`;
      const metodo = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',         
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Reserva guardada correctamente');
        setTimeout(() => navigate('/home'), 1500);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || 'Error al guardar la reserva');
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
      <div className="reserva__wrap">
        <div className="reserva__header">
          <BotonVolver />
        </div>

        <div className="card card--lg reserva__card">
          <h2 className="reserva__title">{editando ? 'Editar Reserva' : 'Agregar Nueva Reserva'}</h2>

          <form className="reserva__form" onSubmit={handleSubmit}>
            {/* Cliente */}
            <div className="form-row">
              <label>Cliente</label>
              <input className="input" value={cliente} onChange={e => setCliente(e.target.value)} required />
            </div>

            {/* Descripción */}
            <div className="form-row">
              <label>Descripción (opcional)</label>
              <input className="input" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>

            {/* Cabaña */}
            <div className="form-row">
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
            </div>

            {/* Ingreso: fecha + hora fija */}
            <div className="form-row form-row--2">
              <div>
                <CalendarioReserva
                  label="Fecha Ingreso"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  fechasOcupadas={fechasOcupadas}
                  diasEstado={diasEstado}
                />
              </div>
              <div>
                <label>Hora Ingreso</label>
                  <input   
                    className="input"
                    type="time"
                    step="60"
                    value={HORA_INGRESO}
                    onChange={e => setHoraIngresoLibre(e.target.value)}
                    disabled={prefs.fijoIngreso}
                  />
              </div>
            </div>

            {/* Egreso: fecha + hora fija */}
            <div className="form-row form-row--2">
              <div>
                <CalendarioReserva
                  label="Fecha Egreso"
                  value={fechaFin}
                  onChange={setFechaFin}
                  fechasOcupadas={fechasOcupadas}
                  diasEstado={diasEstado}
                />
              </div>
              <div>
                <label>Hora Ingreso</label>
                  <input   
                    className="input"
                    type="time"
                    step="60"
                    value={HORA_EGRESO}
                    onChange={e => setHoraEgresoLibre(e.target.value)}
                    disabled={prefs.fijoEgreso}
                  />
              </div>
            </div>

            {/* Reserva en USD */}
            {cotizaciones && tipoMoneda === 'ARS' && (
              <div className="form-row">
                <label>Reserva en Dólares (opcional)</label>
                <div className="form-row--2">
                  <input
                    className="input"
                    type="number"
                    placeholder="Monto en USD"
                    value={dolares.montoUSD}
                    onChange={e => setDolares({ ...dolares, montoUSD: e.target.value })}
                  />
                  <select
                    className="select"
                    value={dolares.tipoCambio}
                    onChange={e => setDolares({ ...dolares, tipoCambio: e.target.value })}
                  >
                    <option value="blue_venta">Blue Venta (${cotizaciones.blue_venta.toLocaleString('es-AR')})</option>
                    <option value="blue_compra">Blue Compra (${cotizaciones.blue_compra.toLocaleString('es-AR')})</option>
                    <option value="oficial_venta">Oficial Venta (${cotizaciones.oficial_venta.toLocaleString('es-AR')})</option>
                    <option value="oficial_compra">Oficial Compra (${cotizaciones.oficial_compra.toLocaleString('es-AR')})</option>
                  </select>
                </div>
                <p className="muted" style={{margin: '4px 0 0'}}>Se actualizará el Costo Total automáticamente</p>
              </div>
            )}

            {/* Moneda de la reserva */}
            <div className="form-row">
              <label>Moneda</label>
              <select
                className="select"
                value={tipoMoneda}
                onChange={(e) => setTipoMoneda(e.target.value)}
                disabled={editando}
                required
                aria-invalid={tipoMoneda === ''}
              >
                <option value="" disabled>Seleccioná una opción...</option>
                <option value="ARS">Pesos (AR$)</option>
                <option value="USD">Dólares (U$D)</option>
              </select>
              {editando && <p className="muted" style={{marginTop:4}}>La moneda no puede modificarse al editar.</p>}
            </div>

            {/* Costo total + Seña */}
            <div className="form-row form-row--2">
              <div>
                <label>Costo Total</label>
                <InputDinero value={costoTotal} onChange={setCostoTotal} required />
              </div>
              <div>
                <label>Seña</label>
                <InputDinero value={sena} onChange={setSena} />
              </div>
            </div>

            {/* Adicionales */}
            <AdicionalesForm
              reservaId={editando ? reservaId : null}
              adicionales={adicionales}
              setAdicionales={setAdicionales}
              monedaReserva={tipoMoneda} 
            />

            {/* Guardar */}
            <div className="reserva__actions">
              <button className="btn btn--primary btn--block" type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar Reserva'}
              </button>
            </div>

            {/* Mensajes (si querés mantenerlos) */}
            {mensaje && <div className="mensaje">{mensaje}</div>}
          </form>
        </div>
      </div>

      {/* Loader global mientras guardás */}
      <Backdrop
        sx={{ color: '#fff', zIndex: 2000, backdropFilter: 'blur(2px)' }} 
        open={guardando}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}

export default CrearReserva;
