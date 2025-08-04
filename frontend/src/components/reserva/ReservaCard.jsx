import { FaEdit, FaTrash, FaEye } from 'react-icons/fa'
import './ReservaCard.css';

function ReservaCard({ reserva, onEdit, onDelete, onView }) {
  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-AR');

  const formatearNumero = (n) =>
    Number(n).toLocaleString('es-AR');

  return (
    <div className="reserva-card">
      <div className="reserva-info">
        <p><strong>Cliente:</strong> {reserva.cliente}</p>
        <p><strong>Descripcion:</strong> {reserva.descripcion}</p>
        <p><strong>Cabaña:</strong> {reserva.cabana?.nombre || reserva.cabana || '...'}</p>
        <p><strong>Ingreso:</strong> {formatearFecha(reserva.fecha_inicio)} - 14:00</p>
        <p><strong>Egreso:</strong> {formatearFecha(reserva.fecha_fin)} - 10:00</p>
        <p>
          <strong>Costo Total:</strong> ${formatearNumero(reserva.costo_total)}
          {' '}<strong>- Seña:</strong> ${formatearNumero(reserva.sena)}
        </p>
        <p><strong>Faltante:</strong> ${formatearNumero(reserva.costo_total - reserva.sena)}</p>
      </div>
      <div className="reserva-acciones">
        <button onClick={() => onEdit(reserva)} title="Editar">
          <FaEdit />
        </button>
        <button onClick={() => onDelete(reserva)} title="Eliminar">
          <FaTrash />
        </button>
        <button onClick={() => onView(reserva)} title="Ver detalles">
          <FaEye />
        </button>
      </div>
    </div>
  );
}

export default ReservaCard;

