import { toast } from 'react-toastify';
import InputDinero from './InputDinero';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label>Adicionales</label>
        <button type="button" onClick={agregar}>+ Agregar Adicional</button>
      </div>
      {adicionales.map((a, i) => (
        <div key={i} className="adicional-item" style={{ border: '1px solid #ccc', padding: 8, marginBottom: 10 }}>
          <InputDinero
            value={a.monto}
            onChange={(val) => actualizar(i, 'monto', val)}
          />
          <input
            type="date"
            value={a.fecha_pago}
            onChange={e => actualizar(i, 'fecha_pago', e.target.value)}
            style={{ marginTop: 6 }}
          />
          <input
            type="text"
            placeholder="Descripción"
            value={a.descripcion}
            onChange={e => actualizar(i, 'descripcion', e.target.value)}
            style={{ marginTop: 6 }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={() => guardar(i)}
              disabled={a.guardado}
              title={a.guardado ? 'Ya guardado' : 'Guardar en base de datos'}
            >
              💾 Guardar
            </button>
            <button type="button" onClick={() => eliminar(i)}>🗑️ Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdicionalesForm;
