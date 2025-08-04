import './ReservaResumenCard.css';

function ReservaResumenCard({ reserva }) {
  return (
    <div className="resumen-card">
      <p><strong>Cliente:</strong> {reserva.cliente}</p>
      <p><strong>Desde:</strong> {new Date(reserva.fecha_inicio).toLocaleDateString()} - 14:00</p>
      <p><strong>Hasta:</strong> {new Date(reserva.fecha_fin).toLocaleDateString()} - 10:00</p>
    </div>
  );
}

export default ReservaResumenCard;
