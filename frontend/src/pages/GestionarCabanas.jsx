import { useContext, useState, useEffect } from 'react';
import { CabanasContext, useCabanasMeta } from '../context/CabanasContext';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BotonVolver from '../components/BotonVolver';
import '../styles/pages/cabanas.css'

const API = import.meta.env.VITE_API_URL;

function CabanaRow({ cab, onSaved }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    nombre: cab.nombre || '',
    descripcion: cab.descripcion || '',
    capacidad: cab.capacidad || 0,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/cabanas/${cab.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion,
          capacidad: Number(form.capacidad)
        })
      });
      if (!res.ok) throw new Error('No se pudo guardar');
      const updated = await res.json().catch(()=>({ ...cab, ...form }));
      onSaved(updated);
      setEdit(false);
      toast.success("Cabaña guardada correctamente");
    } catch(e) {
      console.error(e);
      setMsg('Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <div className="card cab__card">
      {!edit ? (
        <>
          <h4 style={{margin:'0 0 8px'}}>{cab.nombre}</h4>
          <p style={{margin:0, color:'var(--text-dim)'}}>Descripcion: {cab.descripcion || '—'}</p>
          <p style={{margin:'6px 0 10px'}}>Capacidad: {cab.capacidad}</p>
          <div style={{display:'flex', gap:8}}>
            <button className="btn btn--primary" onClick={()=>setEdit(true)}>Editar</button>
          </div>
          {msg && <small style={{color:'var(--text-dim)'}}>{msg}</small>}
        </>
      ) : (
        <>
          <div style={{display:'grid', gap:8}}>
            <input className="input" value={form.nombre}
                   onChange={e=>setForm({...form, nombre: e.target.value})} placeholder="Nombre"/>
            <input className="input" value={form.descripcion}
                   onChange={e=>setForm({...form, descripcion: e.target.value})} placeholder="Descripción"/>
            <input className="input" type="number" min="0" value={form.capacidad}
                   onChange={e=>setForm({...form, capacidad: e.target.value})} placeholder="Capacidad"/>
          </div>
          <div style={{display:'flex', gap:8, marginTop:10}}>
            <button className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button className="btn btn--ghost" onClick={()=>{ setEdit(false); setForm({nombre:cab.nombre, descripcion:cab.descripcion, capacidad:cab.capacidad}); }}>
              Cancelar
            </button>
          </div>
          {msg && <small style={{color:'var(--text-dim)'}}>{msg}</small>}
        </>
      )}
    </div>
  );
}

export default function GestionarCabanas() {
  const cabanas = useContext(CabanasContext);
  const { refresh } = useCabanasMeta();
  const [items, setItems] = useState(cabanas || []);
  useEffect(() => {
    setItems(cabanas || []);
  }, [cabanas]);

  const upsert = (updated) => {
    setItems(prev => prev.map(c => c.id === updated.id ? updated : c));
    refresh();
  };

  return (
    <>
      <div className="cabs__back"><BotonVolver/></div>
      <div className="cabs__wrap">
        <ToastContainer position="top-center" autoClose={1500}/>
        <h2 className="cabs__title">Editar Cabañas</h2>
        <div className="cabs__grid">
          {(items && items.length > 0) ? (
            items.map(c => <CabanaRow key={c.id} cab={c} onSaved={upsert}/>)
          ) : (
            <p className="cabs__empty">No hay cabañas para mostrar.</p>
          )}
        </div>
      </div>
    </>
  );
}
