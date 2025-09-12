import { useEffect, useState, useRef, useContext, useMemo } from 'react';
import SelectorCabana from '../components/consultar-reserva/SelectorCabana';
import ReservaResumenCard from '../components/reserva/ReservaResumenCard';
import BotonVolver from '../components/BotonVolver';
import CalendarioReserva from '../components/consultar-reserva/CalendarioReserva';
import { CabanasContext } from '../context/CabanasContext';
import html2pdf from 'html2pdf.js';
import '../styles/pages/disponibilidad.css';

const API = import.meta.env.VITE_API_URL;
const capitalizar = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

function parseLocalDateTime(s) {
   if (!(typeof s === 'string')) return new Date(s);
   // Si viene con Z o con offset (+hh:mm / -hh:mm), dejalo a Date normal
   if (/Z|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
   const [datePart, timePart] = s.split('T');
   const [y, m, d] = datePart.split('-').map(Number);
   if (timePart) {
     const [hh, mm = 0] = timePart.split(':').map(Number);
     return new Date(y, m - 1, d, hh, mm, 0, 0);
   }
   return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export default function ConsultarDisponibilidad(){
  const cabanas = useContext(CabanasContext);

  const [cabana, setCabana] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [diasEstado, setDiasEstado] = useState({});
  const [fechasOcupadas, setFechasOcupadas] = useState([]);

  const hoy = useMemo(() => new Date(), []);
  const [baseMonth, setBaseMonth] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [monthsToShow, setMonthsToShow] = useState(4);

  const pdfRef = useRef(null);

  useEffect(() => {
    if (!cabana?.id) return;
    const ac = new AbortController();
    fetch(`${API}/api/reservas?cabana_id=${cabana.id}`, { credentials: 'include', signal: ac.signal })
      .then(async r => {
        if (!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e?.message || `Error ${r.status}`); }
        return r.json();
      })
      .then(data => {
        if (!Array.isArray(data)){ setReservas([]); setDiasEstado({}); setFechasOcupadas([]); return; }
        setReservas(data);

        // armar estados ocupados / parciales
        const estado = {};
        const keyLocal = (d) => {
          const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
          return `${y}-${m}-${day}`;
        };
        data.forEach(r=>{
          const rIngreso = parseLocalDateTime(r.fecha_inicio); rIngreso.setHours(14,0,0,0);
          const rEgreso  = parseLocalDateTime(r.fecha_fin);    rEgreso.setHours(10,0,0,0);

          const kIn  = keyLocal(rIngreso);
          const kOut = keyLocal(rEgreso);

          estado[kIn]  = estado[kIn]==='libre-egreso' ? 'ocupado' : (estado[kIn]==='ocupado'?'ocupado':'libre-ingreso');
          estado[kOut] = estado[kOut]==='libre-ingreso'? 'ocupado' : (estado[kOut]==='ocupado'?'ocupado':'libre-egreso');

          const cur = new Date(rIngreso); cur.setDate(cur.getDate()+1);
          while(cur < rEgreso){ estado[keyLocal(cur)]='ocupado'; cur.setDate(cur.getDate()+1); }
        });
        setDiasEstado(estado);
        setFechasOcupadas(Object.entries(estado).filter(([,v])=>v==='ocupado').map(([k])=>new Date(k)));
      })
      .catch(e => { if (e.name!=='AbortError'){ console.error(e); setReservas([]); setDiasEstado({}); setFechasOcupadas([]);} });
    return () => ac.abort();
  }, [cabana]);

  // helpers de UI
  const labelMes = (d) => capitalizar(d.toLocaleDateString('es-AR', { month:'long', year:'numeric' }));
  const meses = useMemo(
    () => Array.from({length: monthsToShow}, (_,i)=> new Date(baseMonth.getFullYear(), baseMonth.getMonth()+i, 1)),
    [baseMonth, monthsToShow]
  );

  const descargarPDF = () => {
    if (!pdfRef.current) return;
    const node = pdfRef.current;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f1220';

    html2pdf()
      .from(node)
      .set({
        margin: 0.4,
        filename: `Disponibilidad_${cabana?.nombre || 'cabana'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: bg,   
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .save();
  };

  return (
    <>
      <div className="listar__back"><BotonVolver /></div>

      <div className="disp__wrap">
        <h2 className="disp__title">Consultar Disponibilidad</h2>

        {/* CONTROLES SUPERIORES */}
        <div className="disp__controls">
          <div className="disp__field">
            <label className="disp__label">Seleccionar cabaña</label>
            <SelectorCabana
              cabanas={cabanas}
              cabanaSeleccionada={cabana?.id || ''}
              onChange={(id) => {
                const seleccionada = cabanas.find(c => c.id === parseInt(id, 10));
                setCabana(seleccionada || null);
                setDiasEstado({});
                setReservas([]);
              }}
            />
          </div>

          <div className="disp__field">
            <label className="disp__label">Meses a mostrar</label>
            <select
              className="select"
              value={monthsToShow}
              onChange={(e) => setMonthsToShow(Number(e.target.value))}
            >
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* MES INICIAL + NAVEGACIÓN */}
        {cabana && (
          <>
            <div className="disp__sublabel">Mes inicial</div>
            <div className="disp__nav">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setBaseMonth(
                  new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1)
                )}
                aria-label="Mes anterior"
              >
                ◀
              </button>

              <div className="disp__nav-current">
                {baseMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </div>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setBaseMonth(
                  new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1)
                )}
                aria-label="Mes siguiente"
              >
                ▶
              </button>
            </div>
          </>
        )}

        {/* CALENDARIOS EN PANTALLA (2 columnas) */}
        {cabana && (
          <>
            <div className="disp__grid" ref={pdfRef}>
              {meses.map((fecha, i) => (
                <div key={`${fecha.getFullYear()}-${fecha.getMonth()}-${i}`} className="disp__month">
                  <CalendarioReserva
                    label={null}
                    value={null}
                    onChange={() => {}}
                    fechasOcupadas={fechasOcupadas}
                    diasEstado={diasEstado}
                    mesFijo={fecha}
                    soloLectura={true}
                  />
                </div>
              ))}
            </div>

            {/* CONTENEDOR OCULTO SOLO PARA PDF (mismo contenido) */}
            <div className="disp__pdf" id="pdf-calendarios" style={{ background: 'var(--bg)' }}>
              <div className="disp__grid disp__grid--pdf">
                {meses.map((fecha, i) => (
                  <div key={`pdf-${fecha.getFullYear()}-${fecha.getMonth()}-${i}`} className="disp__month">
                    <CalendarioReserva
                      label={null}
                      value={null}
                      onChange={() => {}}
                      fechasOcupadas={fechasOcupadas}
                      diasEstado={diasEstado}
                      mesFijo={fecha}
                      soloLectura={true}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn--primary disp__download" onClick={descargarPDF}>
              Descargar calendario en PDF
            </button>

            <h3 className="disp__subheading">Reservas existentes</h3>
            {reservas.length === 0 && <p className="disp__empty">No hay reservas para esta cabaña.</p>}
            {reservas.map(r => <ReservaResumenCard key={r.id} reserva={r} />)}
          </>
        )}
      </div>
    </>
  );
}
