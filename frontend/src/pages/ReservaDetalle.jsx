import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BotonVolver from '../components/BotonVolver';
import ScreenLoader from '../components/ScreenLoader';
import jsPDF from 'jspdf/dist/jspdf.umd';
import 'jspdf-autotable';
import logo from '/images/logo.png';
import '../styles/pages/detalle-reserva.css';

function ReservaDetalle() {
  const { id } = useParams();
  const [reserva, setReserva] = useState(null);
  const [adicionales, setAdicionales] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);   // ← nuevo
  const API = import.meta.env.VITE_API_URL;

  // Reserva + adicionales
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const [rReserva, rAdic] = await Promise.all([
          fetch(`${API}/api/reservas/${id}`, { credentials: 'include', signal: ac.signal }),
          fetch(`${API}/api/adicionales/${id}`, { credentials: 'include', signal: ac.signal }),
        ]);

        if (!rReserva.ok) {
          const err = await rReserva.json().catch(() => ({}));
          throw new Error(err?.message || `Error ${rReserva.status} al cargar la reserva`);
        }
        const reservaData = await rReserva.json();
        setReserva(reservaData);

        if (rAdic.ok) {
          const adicData = await rAdic.json();
          setAdicionales(Array.isArray(adicData) ? adicData : []);
        } else {
          setAdicionales([]);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('❌ Error cargando detalle de reserva:', e);
          setReserva(null);
          setAdicionales([]);
        }
      } finally {
        setLoading(false);       // ← cierro loader
      }
    })();
    return () => ac.abort();
  }, [id]);

  // Usuario
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API}/api/usuarios/me`, { credentials: 'include', signal: ac.signal });
        if (r.ok) {
          const u = await r.json();
          setUserId(Number(u.id) || null);
        } else {
          setUserId(null);
        }
      } catch { setUserId(null); }
    })();
    return () => ac.abort();
  }, []);

  const descargarPDF = async () => {
    if (userId !== 1) return;
    if (!reserva) return;
    const doc = new jsPDF();

    // Logo más grande y centrado
    doc.addImage(logo, 'PNG', 80, 10, 50, 40); // x=80 para centrar en A4 (210mm)

    // Título
    doc.setFontSize(22);
    doc.text('COMPROBANTE DE PAGO', 105, 60, { align: 'center' });

    // Metadatos (derecha)
    doc.setFontSize(12);
    doc.text(`Comprobante #${reserva.id}`, 200, 20, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 200, 26, { align: 'right' });

    // Datos principales de reserva
    let y = 75;
    doc.setFontSize(14);
    doc.text('Datos del Complejo', 15, y);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    doc.setFontSize(12);
    doc.text('Calle: Mar del Plata e/ 38 y 39', 15, y); y += 8;
    doc.text('Ciudad: Mar Azul, Partido de Villa Gessell, Provincia de Buenos Aires', 15, y); y += 8;
    doc.text('CP: B7165', 15, y);
    y += 10;

    // Datos principales de reserva
    doc.setFontSize(14);
    doc.text('Datos de la Reserva', 15, y);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Cliente: ${reserva.cliente}`, 15, y); y += 8;
    doc.text(`Cabaña: ${reserva.cabana?.nombre || '---'}`, 15, y); y += 8;
    doc.text(`Fecha de Ingreso: ${new Date(reserva.fecha_inicio).toLocaleDateString('es-AR')}`, 15, y); y += 8;
    doc.text(`Fecha de Egreso: ${new Date(reserva.fecha_fin).toLocaleDateString('es-AR')}`, 15, y); y += 8;
    doc.text(`Costo de Reserva: $${Number(reserva.costo_total).toLocaleString('es-AR')}`, 15, y); y += 12;

    // Encabezado de tabla
    doc.setFontSize(14);
    doc.text('Pagos', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Descripción', 15, y);
    doc.text('Monto', 150, y, { align: 'right' });
    doc.setFont(undefined, 'normal');
    y += 8;

    // Seña
    doc.text('Seña', 15, y);
    doc.text(`$${Number(reserva.sena).toLocaleString('es-AR')}`, 150, y, { align: 'right' });
    y += 8;

    // Adicionales
    let totalPagado = Number(reserva.sena);
    adicionales.forEach(a => {
        const descripcion = a.descripcion || '---';
        const monto = Number(a.monto);
        const linea = `${descripcion} (${new Date(a.fecha_pago).toLocaleDateString('es-AR')})`;
        doc.text(linea, 15, y);
        doc.text(`$${monto.toLocaleString('es-AR')}`, 150, y, { align: 'right' });
        totalPagado += monto;
        y += 8;
    });

    y += 6;
    doc.line(15, y, 195, y);
    y += 8;

    // Totales (a la derecha)
    doc.setFont(undefined, 'bold');
    doc.text('Total Pagado:', 120, y);
    doc.text(`$${totalPagado.toLocaleString('es-AR')}`, 195, y, { align: 'right' });
    y += 8;

    doc.save(`Reserva_${reserva.cliente}.pdf`);
  };

  if (loading) return <ScreenLoader />;

  if (!reserva) {
    return (
      <>
        <div className="back-fixed"><BotonVolver /></div>
        <div className="detalle__wrap">
          <div className="detalle__container">
            <h2 className="detalle__title">Detalle de Reserva</h2>
            <div className="card card--lg detalle__card">
              <p style={{color:'#ffb4b4'}}>No se pudo cargar la reserva.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const fmt = (n) => Number(n).toLocaleString('es-AR');
  const fdate = (d) => new Date(d).toLocaleDateString('es-AR');

  return (
    <>
      <div className="back-fixed"><BotonVolver /></div>
      <div className="detalle__wrap">
        <div className="detalle__container">
          <h2 className="detalle__title">Detalle de Reserva</h2>

          <div className="card card--lg detalle__card">
            <div className="detalle__section">
              <p className="detalle__row"><strong>Cliente:</strong> {reserva.cliente}</p>
              <p className="detalle__row"><strong>Descripción:</strong> {reserva.descripcion || '---'}</p>
              <p className="detalle__row"><strong>Cabaña:</strong> {reserva.cabana?.nombre || '---'}</p>
              <p className="detalle__row"><strong>Desde:</strong> {fdate(reserva.fecha_inicio)}</p>
              <p className="detalle__row"><strong>Hasta:</strong> {fdate(reserva.fecha_fin)}</p>
              <p className="detalle__row"><strong>Costo Total:</strong> ${fmt(reserva.costo_total)}</p>
              <p className="detalle__row"><strong>Seña:</strong> ${fmt(reserva.sena)}</p>
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid rgba(255,255,255,.08)',
                margin: '14px 0'
              }}
            />

            <h3 style={{margin:'0 0 4px'}}>Adicionales</h3>
            {adicionales.length === 0 ? (
              <p className="detalle__row" style={{color:'var(--text-dim)'}}>No hay adicionales.</p>
            ) : (
              <ul className="detalle__adics">
                {adicionales.map((a,i)=>(
                  <li key={i} className="detalle__row">
                    ${fmt(a.monto)} — {fdate(a.fecha_pago)} — {a.descripcion || '—'}
                  </li>
                ))}
              </ul>
            )}

            {userId === 1 && (
              <div className="detalle__actions">
                <button className="btn btn--primary" onClick={descargarPDF}>📄 Descargar PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ReservaDetalle;