import { FaEdit, FaTrash } from 'react-icons/fa'
import './ReservaCard.css';

function ReservaCard({ reserva, onEdit, onDelete }) {
  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-AR');

  return (
    <div className="reserva-card">
      <div className="reserva-info">
        <p><strong>Cliente:</strong> {reserva.cliente}</p>
        <p><strong>Cabaña:</strong> {reserva.cabana?.nombre || reserva.cabana || '...'}</p>
        <p><strong>Ingreso:</strong> {formatearFecha(reserva.fecha_inicio)} - 14:00</p>
        <p><strong>Egreso:</strong> {formatearFecha(reserva.fecha_fin)} - 10:00</p>
        <p><strong>Costo:</strong> ${reserva.costo_total}</p>
      </div>
      <div className="reserva-acciones">
        <button onClick={() => onEdit(reserva)} title="Editar">
          <FaEdit />
        </button>
        <button onClick={() => onDelete(reserva)} title="Eliminar">
          <FaTrash />
        </button>
      </div>
    </div>
  );
}

export default ReservaCard;

