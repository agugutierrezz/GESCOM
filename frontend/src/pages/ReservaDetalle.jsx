import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BotonVolver from '../components/BotonVolver';
import jsPDF from 'jspdf/dist/jspdf.umd';
import 'jspdf-autotable';
import logo from '/images/logo.png';

function ReservaDetalle() {
  const { id } = useParams();
  const [reserva, setReserva] = useState(null);
  const [adicionales, setAdicionales] = useState([]);
  

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reservas/${id}`)
      .then(res => res.json())
      .then(data => setReserva(data));

    fetch(`${import.meta.env.VITE_API_URL}/api/adicionales/${id}`)
      .then(res => res.json())
      .then(data => setAdicionales(data));
  }, [id]);

    const descargarPDF = async () => {
    if (!reserva) return;

    const doc = new jsPDF();

    // Logo más grande y centrado
    doc.addImage(logo, 'PNG', 80, 10, 50, 40); // x=80 para centrar en A4 (210mm)

    // Título
    doc.setFontSize(22);
    doc.text('FACTURA DE RESERVA', 105, 60, { align: 'center' });

    // Metadatos (derecha)
    doc.setFontSize(12);
    doc.text(`Factura #${reserva.id}`, 200, 20, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 200, 26, { align: 'right' });

    // Datos principales de reserva
    let y = 75;
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
    doc.text(`Descripción: ${reserva.descripcion || '---'}`, 15, y); y += 10;
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
    y += 6;

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
    const faltante = Number(reserva.costo_total) - totalPagado;
    doc.setFont(undefined, 'bold');
    doc.text('Total Pagado:', 120, y);
    doc.text(`$${totalPagado.toLocaleString('es-AR')}`, 195, y, { align: 'right' });
    y += 8;

    doc.save(`Reserva_${reserva.cliente}.pdf`);
    };


  if (!reserva) return <p>Cargando reserva...</p>;

  return (
    <div className="reserva-container">
      <BotonVolver />
      <h2>Detalle de Reserva</h2>
      <p><strong>Cliente:</strong> {reserva.cliente}</p>
      <p><strong>Descripción:</strong> {reserva.descripcion || '---'}</p>
      <p><strong>Cabaña:</strong> {reserva.cabana?.nombre}</p>
      <p><strong>Desde:</strong> {new Date(reserva.fecha_inicio).toLocaleDateString('es-AR')}</p>
      <p><strong>Hasta:</strong> {new Date(reserva.fecha_fin).toLocaleDateString('es-AR')}</p>
      <p><strong>Costo Total:</strong> ${Number(reserva.costo_total).toLocaleString('es-AR')}</p>
      <p><strong>Seña:</strong> ${Number(reserva.sena).toLocaleString('es-AR')}</p>

      <h3>Adicionales</h3>
      {adicionales.length === 0
        ? <p>No hay adicionales.</p>
        : <ul>{adicionales.map((a, i) => (
            <li key={i}>
              ${Number(a.monto).toLocaleString('es-AR')} - {new Date(a.fecha_pago).toLocaleDateString('es-AR')} - {a.descripcion}
            </li>
          ))}</ul>
      }

      <button onClick={descargarPDF}>📄 Descargar PDF</button>
    </div>
  );
}

export default ReservaDetalle;
