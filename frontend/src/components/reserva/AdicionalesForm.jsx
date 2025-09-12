import { toast } from 'react-toastify';
import InputDinero from './InputDinero';
import { Button, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

function AdicionalesForm({ reservaId, adicionales, setAdicionales }) {
  const agregar = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setAdicionales([
      ...adicionales,
      { monto: 0, fecha_pago: hoy, descripcion: '', guardado: false }
    ]);
  };

  const eliminar = async (i) => {
    const adicional = adicionales[i];

    // Si no está guardado, solo lo eliminamos del array local
    if (!adicional.guardado) {
      const copia = [...adicionales];
      copia.splice(i, 1);
      setAdicionales(copia);
      return;
    }

    // Si está guardado, lo borramos del backend
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/adicionales/${adicional.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error();

      toast.success('Adicional eliminado correctamente');

      const copia = [...adicionales];
      copia.splice(i, 1);
      setAdicionales(copia);
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar adicional');
    }
  };

  const actualizar = (i, campo, valor) => {
    const copia = [...adicionales];
    copia[i][campo] = valor;
    setAdicionales(copia);
  };

  const guardar = async (i) => {
    const adicional = adicionales[i];

    if (!reservaId) {
      toast.error('Primero debés guardar la reserva.');
      return;
    }

    const montoNum = parseFloat(adicional.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('El monto debe ser un número válido mayor a 0');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/adicionales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserva_id: reservaId,
          monto: montoNum,
          fecha_pago: adicional.fecha_pago,
          descripcion: adicional.descripcion || null
        })
      });

      if (!res.ok) throw new Error();

      const nuevo = await res.json(); // opcional, si backend devuelve el adicional creado con id

      toast.success('Adicional guardado correctamente');

      const copia = [...adicionales];
      copia[i] = {
        ...copia[i],
        id: nuevo.id || copia[i].id, // opcional si backend devuelve el id
        guardado: true
      };
      setAdicionales(copia);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar adicional');
    }
  };

  return (
    <div className="adicionales">
      <div className="adicionales__head">
        <h4>Adicionales</h4>
        <button
          type="button"
          className="btn btn--primary"
          onClick={agregar}
        >
          + Agregar adicional
        </button>
      </div>

      {adicionales.map((a, i) => (
        <div key={i} className="adicional-item">
          <div className="adicional-grid">
            <InputDinero
              placeholder="Monto"
              value={a.monto}
              onChange={(val) => actualizar(i, 'monto', val)}
            />

            <input
              className="input"
              type="date"
              value={a.fecha_pago}
              onChange={e => actualizar(i, 'fecha_pago', e.target.value)}
            />

            <input
              className="input"
              type="text"
              placeholder="Descripción"
              value={a.descripcion}
              onChange={e => actualizar(i, 'descripcion', e.target.value)}
            />
          </div>

          <div className="adicional-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => guardar(i)}
              disabled={a.guardado}
              title={a.guardado ? 'Ya guardado' : 'Guardar en base de datos'}
            >
              Guardar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => eliminar(i)}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdicionalesForm;
