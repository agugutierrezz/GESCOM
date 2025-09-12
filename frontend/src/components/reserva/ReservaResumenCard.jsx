import { Card, CardContent, Typography } from '@mui/material';

function ReservaResumenCard({ reserva }) {
  const fechaYMDaLocal = (v) => {
    const ymd = String(v).split('T')[0];
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) return v || '';
    return new Date(y, m - 1, d).toLocaleDateString('es-AR');
  };

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent>
        <Typography variant="body2">
          <strong>Cliente:</strong> {reserva.cliente}
        </Typography>
        <Typography variant="body2">
          <strong>Desde:</strong> {fechaYMDaLocal(reserva.fecha_inicio)} a las {(reserva.hora_inicio)}
        </Typography>
        <Typography variant="body2">
          <strong>Hasta:</strong> {fechaYMDaLocal(reserva.fecha_fin)} a las {(reserva.hora_fin)}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ReservaResumenCard;
