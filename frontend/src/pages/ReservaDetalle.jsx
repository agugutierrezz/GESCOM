import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BotonVolver from '../components/BotonVolver';
import ScreenLoader from '../components/ScreenLoader';
import { saveAs } from 'file-saver';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun
} from 'docx';
import logo from '/images/logo.png';
import '../styles/pages/detalle-reserva.css';
import { formatearMonto, etiquetaMoneda } from '../utils/moneda';

function ReservaDetalle() {
  const { id } = useParams();
  const [reserva, setReserva] = useState(null);
  const [adicionales, setAdicionales] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);   // ← nuevo
  const API = import.meta.env.VITE_API_URL;

  async function imgToArrayBuffer(src) {
    const res = await fetch(src);
    const blob = await res.blob();
    return await blob.arrayBuffer();
  }

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

  const descargarDOCX = async () => {
    if (userId !== 1 || !reserva) return;

    const logoBuf = await imgToArrayBuffer(logo);

    // Helpers
    const P = (text, opts = {}) => new Paragraph({ children: [new TextRun(text)], ...opts });
    const Right = (text) => P(text, { alignment: AlignmentType.RIGHT });
    const Bold = (text) => new TextRun({ text, bold: true });
    const fdate = (d) => new Date(d).toLocaleDateString('es-AR');

    // ── Encabezado
    const header = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: logoBuf,
            transformation: { width: 160, height: 160 },
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [new TextRun('COMPROBANTE DE PAGO')],
      }),
      Right(`Comprobante #${reserva.id}`),
      Right(`Fecha: ${new Date().toLocaleDateString('es-AR')}`),
      P(' ', { spacing: { after: 200 } }), // evita párrafo completamente vacío
    ];

    // ── Datos del Complejo
    const datosComplejo = [
      new Paragraph({ children: [Bold('Datos del Complejo')], spacing: { after: 100 } }),
      P('Calle: Mar del Plata e/ 38 y 39'),
      P('Ciudad: Mar Azul, Partido de Villa Gessell, Provincia de Buenos Aires'),
      P('CP: B7165'),
      P(' '),
    ];

    // ── Datos de la Reserva
    const datosReserva = [
      new Paragraph({ children: [Bold('Datos de la Reserva')], spacing: { after: 100 } }),
      P(`Cliente: ${reserva.cliente}`),
      P(`Cabaña: ${reserva.cabana?.nombre || '---'}`),
      P(`Fecha de Ingreso: ${fdate(reserva.fecha_inicio)}`),
      P(`Fecha de Egreso: ${fdate(reserva.fecha_fin)}`),
      P(`Costo de Reserva: ${formatearMonto(reserva.costo_total, reserva.tipo_moneda)}`),
      P(' '),
    ];

    // ── Pagos (tabla)
    const monedaReserva = (reserva?.tipo_moneda || 'ARS').toUpperCase();
    const cotiz = Number(reserva?.sena_cotizacion) || 0; // pesos por dólar
    const etiqueta = (reserva?.sena_cotizacion_nombre || '').replace('_', ' ');

    // 1) Detectar seña principal y moneda
    // Campos posibles en tu backend que ya se vieron en el FE:
    // - reserva.sena (monto de seña en moneda típica de la reserva)
    // - reserva.sena_ars (monto de seña en ARS, si la reserva es USD)
    // - opcional: reserva.sena_usd (si existiera)
    let senaMonto = 0;
    let senaMoneda = 'ARS';

    if (monedaReserva === 'ARS') {
      // Prefiere un campo explícito en ARS; si no, usa sena en la misma moneda de la reserva
      senaMonto = Number(reserva?.sena_ars ?? reserva?.sena) || 0;
      senaMoneda = 'ARS';
    } else {
      // Reserva en USD
      const senaUsdDirecta = Number(reserva?.sena_usd ?? reserva?.sena) || 0;
      const senaArs = Number(reserva?.sena_ars) || 0;

      if (senaUsdDirecta > 0) {
        senaMonto = senaUsdDirecta;
        senaMoneda = 'USD';
      } else if (senaArs > 0 && cotiz > 0) {
        // Convertir ARS a USD si solo hay seña en ARS
        senaMonto = senaArs / cotiz;
        senaMoneda = 'USD';
      } else if (senaArs > 0) {
        // Sin cotización: al menos mostrá el valor que sí tenés (en ARS)
        senaMonto = senaArs;
        senaMoneda = 'ARS';
      } else {
        senaMonto = 0;
        senaMoneda = 'USD';
      }
    }

    // 2) Encabezado de la tabla
    const rows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Descripción', bold: true })] })],
            width: { size: 65, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Monto', bold: true })] })],
            width: { size: 35, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ];

    // 3) Fila Seña (si hay)
    const senaTexto = senaMonto > 0 ? formatearMonto(senaMonto, senaMoneda) : '—';
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('Seña')],
            width: { size: 65, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(senaTexto)] })],
            width: { size: 35, type: WidthType.PERCENTAGE },
          }),
        ],
      })
    );

    // 4) Fila de equivalencia (si hay cotización y la seña es no-cero)
    if (senaMonto > 0 && cotiz > 0) {
      let eqTxt = '';
      if (senaMoneda === 'ARS') {
        const eqUSD = senaMonto / cotiz;
        eqTxt = `Equiv. U$D ${eqUSD.toLocaleString('es-AR', { maximumFractionDigits: 2 })}${
          etiqueta ? ` (al ${etiqueta})` : ''
        }`;
      } else {
        const eqARS = senaMonto * cotiz;
        eqTxt = `Equiv. AR$ ${eqARS.toLocaleString('es-AR', { maximumFractionDigits: 2 })}${
          etiqueta ? ` (al ${etiqueta})` : ''
        }`;
      }

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: eqTxt })] })],
              width: { size: 65, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun('\u00A0')] })], // evita celda vacía real
              width: { size: 35, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    }

    // 5) Adicionales
    const adics = Array.isArray(adicionales) ? adicionales : [];
    adics.forEach((a) => {
      const monto = Number(a.monto) || 0;
      const fechaTxt = a.fecha_pago ? new Date(a.fecha_pago).toLocaleDateString('es-AR') : '—';
      const desc = (a.descripcion ? `${a.descripcion}` : '—') + ` (${fechaTxt})`;

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(desc)],
              width: { size: 65, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun(formatearMonto(monto, a.tipo_moneda))],
                }),
              ],
              width: { size: 35, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    });

    const tablaPagos = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
      },
    });

    // 6) Totales por moneda (incluye la seña en su moneda)
    const totalAdicARS = adics
      .filter((a) => (a?.tipo_moneda || 'ARS').toUpperCase() === 'ARS')
      .reduce((s, a) => s + (Number(a.monto) || 0), 0);

    const totalAdicUSD = adics
      .filter((a) => (a?.tipo_moneda || 'ARS').toUpperCase() === 'USD')
      .reduce((s, a) => s + (Number(a.monto) || 0), 0);

    const totalARS = (senaMoneda === 'ARS' ? senaMonto : 0) + totalAdicARS;
    const totalUSD = (senaMoneda === 'USD' ? senaMonto : 0) + totalAdicUSD;

    const totales = [];
    if (totalARS > 0) {
      totales.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [Bold(`Total (AR$): ${formatearMonto(totalARS, 'ARS')}`)],
          spacing: { before: 100 },
        })
      );
    }
    if (totalUSD > 0) {
      totales.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [Bold(`Total (U$D): ${formatearMonto(totalUSD, 'USD')}`)],
        })
      );
    }

    // ── Documento
    const doc = new Document({
      sections: [
        {
          children: [
            ...header,
            ...datosComplejo,
            ...datosReserva,
            new Paragraph({ children: [Bold('Pagos')], spacing: { after: 100 } }),
            tablaPagos,
            ...totales,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Reserva_${reserva.cliente}.docx`);
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

            <h3 style={{margin:'0 0 4px'}}>Adicionales</h3>
            {adicionales.length === 0 ? (
              <p className="detalle__row" style={{color:'var(--text-dim)'}}>No hay adicionales.</p>
            ) : (
              <ul className="detalle__adics">
                {adicionales.map((a,i)=>(
                  <li key={i} className="detalle__row">
                    {formatearMonto(a.monto, a.tipo_moneda)} - {a.descripcion}
                  </li>
                ))}
              </ul>
            )}

            {userId === 1 && (
              <div className="detalle__actions" style={{ display:'flex', gap:8 }}>
                <button className="btn btn--ghost" onClick={descargarDOCX}>📝 Descargar Comprobante de Pago</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ReservaDetalle;