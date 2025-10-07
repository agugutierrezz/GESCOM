import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BotonVolver from '../components/BotonVolver';
import ScreenLoader from '../components/ScreenLoader';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatearMonto } from '../utils/moneda';
import logo from '/images/logo.png';
import '../styles/pages/detalle-reserva.css';

function ReservaDetalle() {
  const { id } = useParams();
  const [reserva, setReserva] = useState(null);
  const [adicionales, setAdicionales] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [API, id]);

  // Usuario actual
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
      } catch {
        setUserId(null);
      }
    })();
    return () => ac.abort();
  }, [API]);

  // Helpers UI
  const fdate = (d) => {
    if (!d) return '—';

    // "YYYY-MM-DD" (date-only, sin zona)
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, dd] = d.split('-');
      return `${dd}/${m}/${y}`; // es-AR
    }

    // "YYYY-MM-DDTHH:mm[:ss]" sin 'Z' ni offset → usar tu parser local
    if (typeof d === 'string' && /T/.test(d) && !/Z|[+-]\d{2}:\d{2}$/.test(d)) {
      const dt = parseLocalDateTime(d);       // la función que ya tenés
      return dt.toLocaleDateString('es-AR');
    }

    // Si viene con zona (Z u offset) o ya es Date
    return new Date(d).toLocaleDateString('es-AR');
  };


  // Acumuladores por moneda (evita leer de `reserva` si aún es null)
  const totalARS =
    (reserva?.tipo_moneda === 'ARS' ? Number(reserva?.sena) || 0 : 0) +
    adicionales
      .filter(a => (a?.tipo_moneda || 'ARS').toUpperCase() === 'ARS')
      .reduce((s, a) => s + (Number(a?.monto) || 0), 0);

  const totalUSD =
    (reserva?.tipo_moneda === 'USD' ? Number(reserva?.sena) || 0 : 0) +
    adicionales
      .filter(a => (a?.tipo_moneda || 'ARS').toUpperCase() === 'USD')
      .reduce((s, a) => s + (Number(a?.monto) || 0), 0);

  // PDF
  const descargarPDF = () => {
    if (userId !== 1 || !reserva) return;

    const doc = new jsPDF();

    // Logo
    doc.addImage(logo, 'PNG', 80, 10, 50, 40);

    // Título
    doc.setFontSize(22);
    doc.text('COMPROBANTE DE PAGO', 105, 60, { align: 'center' });

    // Metadatos
    doc.setFontSize(12);
    doc.text(`Comprobante #${reserva.id}`, 200, 20, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 200, 26, { align: 'right' });

    let y = 75;

    // Datos del Complejo
    doc.setFontSize(14);
    doc.text('Datos del Complejo', 15, y);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    doc.setFontSize(12);
    doc.text('Calle: Mar del Plata e/ 38 y 39', 15, y); y += 8;
    doc.text('Ciudad: Mar Azul, Partido de Villa Gessell, Provincia de Buenos Aires', 15, y); y += 8;
    doc.text('CP: B7165', 15, y); y += 10;

    // Datos de la Reserva
    doc.setFontSize(14);
    doc.text('Datos de la Reserva', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Cliente: ${reserva.cliente}`, 15, y); y += 8;
    doc.text(`Cabaña: ${reserva.cabana?.nombre || '---'}`, 15, y); y += 8;
    doc.text(`Fecha de Ingreso: ${fdate(reserva.fecha_inicio)}`, 15, y); y += 8;
    doc.text(`Fecha de Egreso: ${fdate(reserva.fecha_fin)}`, 15, y); y += 8;
    doc.text(`Costo de Reserva: ${formatearMonto(reserva.costo_total, reserva.tipo_moneda)}`, 15, y); y += 12;

    // Pagos
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
    doc.text(formatearMonto(reserva.sena, reserva.tipo_moneda), 150, y, { align: 'right' });
    y += 8;

    // Adicionales (cada uno tiene su propia moneda)
    adicionales.forEach(a => {
      const descripcion = a?.descripcion || '—';
      const monto = Number(a?.monto) || 0;
      const fechaLinea = a?.fecha_pago ? fdate(a.fecha_pago) : '—';
      const linea = `${descripcion} (${fechaLinea})`;

      doc.text(linea, 15, y);
      doc.text(formatearMonto(monto, a?.tipo_moneda), 150, y, { align: 'right' });
      y += 8;
    });

    y += 6;
    doc.line(15, y, 195, y);
    y += 8;

    // Totales por moneda (solo si son > 0)
    doc.setFont(undefined, 'bold');
    if (totalARS > 0) {
      doc.text('Total Pagado (AR$):', 120, y);
      doc.text(formatearMonto(totalARS, 'ARS'), 195, y, { align: 'right' });
      y += 8;
    }
    if (totalUSD > 0) {
      doc.text('Total Pagado (U$D):', 120, y);
      doc.text(formatearMonto(totalUSD, 'USD'), 195, y, { align: 'right' });
      y += 8;
    }

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
              <p style={{ color: '#ffb4b4' }}>No se pudo cargar la reserva.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

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
              <p className="detalle__row"><strong>Costo Total:</strong> {formatearMonto(reserva.costo_total, reserva.tipo_moneda)}</p>
              <p className="detalle__row"><strong>Seña:</strong> {formatearMonto(reserva.sena, reserva.tipo_moneda)}</p>
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid rgba(255,255,255,.08)',
                margin: '14px 0'
              }}
            />

            <h3 style={{ margin: '0 0 4px' }}>Adicionales</h3>
            {adicionales.length === 0 ? (
              <p className="detalle__row" style={{ color: 'var(--text-dim)' }}>No hay adicionales.</p>
            ) : (
              <ul className="detalle__adics">
                {adicionales.map((a, i) => (
                  <li key={i} className="detalle__row">
                    {formatearMonto(a?.monto, a?.tipo_moneda)} — {fdate(a?.fecha_pago)} — {a?.descripcion || '—'}
                  </li>
                ))}
              </ul>
            )}

            {(totalARS > 0 || totalUSD > 0) && (
              <>
                <hr
                  style={{
                    border: 'none',
                    borderTop: '1px solid rgba(255,255,255,.08)',
                    margin: '10px 0'
                  }}
                />
                <h3 style={{ margin: '0 0 8px' }}>Totales Pagados</h3>
                {totalARS > 0 && (
                  <p className="detalle__row"><strong>Total (AR$):</strong> {formatearMonto(totalARS, 'ARS')}</p>
                )}
                {totalUSD > 0 && (
                  <p className="detalle__row"><strong>Total (U$D):</strong> {formatearMonto(totalUSD, 'USD')}</p>
                )}
              </>
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
