import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

function Home() {
  const navigate = useNavigate();

  const irA = (opcion) => {
    switch (opcion) {
      case 'crear':
        navigate('/reservas/create');
        break;
      case 'ver':
        navigate('/reservas/view');
        break;
      case 'disponibilidad':
        navigate('/reservas/consulta');
        break;
      case 'salir':
        localStorage.removeItem('usuario');
        navigate('/');
        break;
      default:
        break;
    }
  };

  return (
    <div className="home-container">
      <h1>Menú Principal</h1>
      <button onClick={() => irA('crear')}>Agregar Reserva</button>
      <button onClick={() => irA('ver')}>Ver Reservas</button>
      <button onClick={() => irA('disponibilidad')}>Consultar Disponibilidad</button>
      <button onClick={() => irA('salir')}>Cerrar sesión</button>
    </div>
  );
}

export default Home;
