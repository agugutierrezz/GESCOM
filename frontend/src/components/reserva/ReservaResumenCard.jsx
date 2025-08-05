import { Card, CardContent, Typography } from '@mui/material';

function ReservaResumenCard({ reserva }) {
  return (
    <Card sx={{ mb: 1 }}>
      <CardContent>
        <Typography variant="body2">
          <strong>Cliente:</strong> {reserva.cliente}
        </Typography>
        <Typography variant="body2">
          <strong>Desde:</strong> {new Date(reserva.fecha_inicio).toLocaleDateString()} - 14:00
        </Typography>
        <Typography variant="body2">
          <strong>Hasta:</strong> {new Date(reserva.fecha_fin).toLocaleDateString()} - 10:00
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ReservaResumenCard;
