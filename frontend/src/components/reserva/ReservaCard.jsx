import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

function ReservaCard({ reserva, onEdit, onDelete, onView }) {
  const fechaYMDaLocal = (v) => {
    const ymd = String(v).split('T')[0];
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) return v || '';
    return new Date(y, m - 1, d).toLocaleDateString('es-AR');
  };

  const formatearNumero = (n) =>
    Number(n).toLocaleString('es-AR');

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        backgroundColor: 'var(--bg-elev-1)',
        color: 'var(--text)',
        border: 'var(--border)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-low)',
        transition: 'box-shadow .2s, transform .06s',
        '&:hover': { boxShadow: 'var(--shadow-mid)', transform: 'translateY(-1px)' },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 110px' },
        alignItems: 'stretch',                   // ← permite que la columna derecha estire
        pr: {md: 1.5}
      }}
    >
      <CardContent sx={{ p: 2.2, pr: { md: 3 } }}>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Cliente:</strong> {reserva.cliente}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Descripcion:</strong> {reserva.descripcion}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Cabaña:</strong> {reserva.cabana?.nombre || reserva.cabana || '...'}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Ingreso:</strong> {fechaYMDaLocal(reserva.fecha_inicio)} a las {(reserva.hora_inicio)}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Egreso:</strong> {fechaYMDaLocal(reserva.fecha_fin)} a las {(reserva.hora_fin)}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Costo Total:</strong> ${formatearNumero(reserva.costo_total)}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
          <strong>Seña:</strong> ${formatearNumero(reserva.sena)}
        </Typography>
      </CardContent>

      {/* Acciones en columna a la derecha (abajo en mobile) */}
      <CardActions
        sx={{
          gridColumn: { xs: '1 / -1', md: '2' },
          alignSelf: 'stretch',
          p: 2,
          pt: { md: 2 },
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' }, // fila en mobile, columna en desktop
          gap: { xs: 1.25, md: 1.4 },                 // ← más separación
          alignItems: 'center',                        // ← ya no “stretch”
          justifyContent: { xs: 'flex-start', md: 'flex-start' }
        }}
      >
        <IconButton
          onClick={() => onEdit(reserva)}
          title="Editar"
          sx={{
            color: 'var(--text)',
            width: 55, height: 55, p: 0, borderRadius: '50%',
            transition: 'transform .06s, box-shadow .15s, background .15s',
            '&:hover': {
              transform: 'translateY(-1px)',
              backgroundColor: 'rgba(255,255,255,.06)',   // ← halo suave
              boxShadow: '0 0 0 2px rgba(255,255,255,.10)'
            },
            '&:active': { transform: 'translateY(0)' }
          }}
        >
          <EditIcon />
        </IconButton>

        <IconButton
          onClick={() => onDelete(reserva)}
          title="Eliminar"
          sx={{
            color: 'var(--text)',
            width: 55, height: 55, p: 0, borderRadius: '50%',
            transition: 'transform .06s, box-shadow .15s, background .15s',
            '&:hover': {
              transform: 'translateY(-1px)',
              backgroundColor: 'rgba(255,255,255,.06)',
              boxShadow: '0 0 0 2px rgba(255,255,255,.10)'
            },
            '&:active': { transform: 'translateY(0)' }
          }}
        >
          <DeleteIcon />
        </IconButton>

        <IconButton
          onClick={() => onView(reserva)}
          title="Ver detalles"
          sx={{
            color: 'var(--text)',
            width: 55, height: 55, p: 0, borderRadius: '50%',
            transition: 'transform .06s, box-shadow .15s, background .15s',
            '&:hover': {
              transform: 'translateY(-1px)',
              backgroundColor: 'rgba(255,255,255,.06)',
              boxShadow: '0 0 0 2px rgba(255,255,255,.10)'
            },
            '&:active': { transform: 'translateY(0)' }
          }}
        >
          <VisibilityIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default ReservaCard;