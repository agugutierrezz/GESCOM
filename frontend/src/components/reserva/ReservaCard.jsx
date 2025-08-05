import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

function ReservaCard({ reserva, onEdit, onDelete, onView }) {
  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-AR');

  const formatearNumero = (n) =>
    Number(n).toLocaleString('es-AR');

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="body2"><strong>Cliente:</strong> {reserva.cliente}</Typography>
        <Typography variant="body2"><strong>Descripcion:</strong> {reserva.descripcion}</Typography>
        <Typography variant="body2"><strong>Cabaña:</strong> {reserva.cabana?.nombre || reserva.cabana || '...'}</Typography>
        <Typography variant="body2"><strong>Ingreso:</strong> {formatearFecha(reserva.fecha_inicio)} - 14:00</Typography>
        <Typography variant="body2"><strong>Egreso:</strong> {formatearFecha(reserva.fecha_fin)} - 10:00</Typography>
        <Typography variant="body2"><strong>Costo Total:</strong> ${formatearNumero(reserva.costo_total)}</Typography>
        <Typography variant="body2"><strong>Seña:</strong> ${formatearNumero(reserva.sena)}</Typography>
    </CardContent><CardActions>
        <IconButton onClick={() => onEdit(reserva)} title="Editar">
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(reserva)} title="Eliminar">
          <DeleteIcon />
        </IconButton>
        <IconButton onClick={() => onView(reserva)} title="Ver detalles">
          <VisibilityIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default ReservaCard;