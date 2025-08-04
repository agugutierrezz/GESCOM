import { useNavigate } from 'react-router-dom';
import '../styles/botonVolver.css';

function BotonVolver() {
  const navigate = useNavigate();

  return (
    <button className="boton-volver" onClick={() => navigate(-1)}>
      ←
    </button>
  );
}

export default BotonVolver;
