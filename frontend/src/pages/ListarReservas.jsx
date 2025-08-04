import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservaCard from '../components/reserva/ReservaCard';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import BotonVolver from '../components/BotonVolver';
import '../styles/reserva.css';

const MySwal = withReactContent(Swal);

function ListarReservas() {
  const [reservas, setReservas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reservas`)
      .then(res => res.json())
      .then(data => setReservas(data));
  }, []);

  const handleEdit = (reserva) => {
    navigate('/reservas/create', { state: reserva });
  };

  const handleDelete = async (reserva) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `¿Eliminar la reserva de <strong>${reserva.cliente}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/reservas/${reserva.id}`, {
        method: 'DELETE',
      });

      setReservas(prev => prev.filter(r => r.id !== reserva.id));

      MySwal.fire({
        title: 'Eliminada',
        text: 'La reserva fue eliminada correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <><div>
      <BotonVolver />
      </div><div className="reserva-container">
        <h2>Reservas</h2>

        {reservas.map(reserva => (
          console.log(reserva),
          <ReservaCard
            key={reserva.id}
            reserva={reserva}
            onEdit={handleEdit}
            onDelete={() => handleDelete(reserva)} />
        ))}
      </div></>
  );
}

export default ListarReservas;