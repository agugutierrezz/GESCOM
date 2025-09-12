import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function BotonVolver() {
  const navigate = useNavigate();

  return (
    <IconButton onClick={() => navigate(-1)} aria-label="volver" sx={{ color: 'var(--text)' }}  >
      <ArrowBackIcon />
    </IconButton>
  );
}

export default BotonVolver;
