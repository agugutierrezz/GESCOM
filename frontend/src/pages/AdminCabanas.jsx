import { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BotonVolver from '../components/BotonVolver';
import '../styles/pages/admin.css';

const API = import.meta.env.VITE_API_URL;

export default function AdminCabanas(){
  const [cabanas, setCabanas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nuevo, setNuevo] = useState({ nombre:'', capacidad:'', descripcion:'', usuario_id:'' });

  const ownersById = useMemo(
    () => Object.fromEntries((users||[]).map(u => [u.id, u.username])),
    [users]
  );

  const cargar = async ()=>{
    setLoading(true);
    try{
      const [rCabs, rUsers] = await Promise.all([
        fetch(`${API}/api/cabanas`, { credentials:'include' }),
        fetch(`${API}/api/usuarios`, { credentials:'include' })
      ]);
      const cabs = await rCabs.json();
      const usrs = await rUsers.json();

      setUsers(Array.isArray(usrs)?usrs:[]);
      setCabanas(
        (Array.isArray(cabs)?cabs:[]).map(c=>({
          ...c,
          ownerUsername: ownersById[c.usuario_id] ?? '',
          _edit:false, _nombre:c.nombre, _capacidad:String(c.capacidad), _descripcion:c.descripcion||''
        }))
      );
    }catch{
      toast.error('Error cargando datos');
      setCabanas([]); setUsers([]);
    }finally{ setLoading(false); }
  };

  useEffect(()=>{ cargar(); }, []);
  // relleno ownerUsername cuando cambian usuarios
  useEffect(()=>{
    if (!users.length) return;
    setCabanas(prev => prev.map(c => ({...c, ownerUsername: ownersById[c.usuario_id] ?? ''})));
  }, [users, ownersById]);

  const crear = async ()=>{
    if(!nuevo.nombre || !nuevo.capacidad || !nuevo.usuario_id){
      return toast.warn('Completá nombre, capacidad y dueño');
    }
    try{
      const r = await fetch(`${API}/api/cabanas`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({
          nombre: nuevo.nombre,
          capacidad: Number(nuevo.capacidad),
          descripcion: nuevo.descripcion || null,
          usuario_id: Number(nuevo.usuario_id)
        })
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.message || 'No se pudo crear la cabaña');
      }
      toast.success('Cabaña creada');
      setNuevo({ nombre:'', capacidad:'', descripcion:'', usuario_id:'' });
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  const toggleEdit = (id, v)=> setCabanas(prev=> prev.map(c=> c.id===id ? {...c, _edit:v} : c));
  const updateField = (id, field, value)=> setCabanas(prev=> prev.map(c=> c.id===id ? {...c, [field]:value} : c));

  const guardar = async (cab)=>{
    try{
      const payload = {
        nombre: cab._nombre,
        capacidad: Number(cab._capacidad),
        descripcion: cab._descripcion || null
      };
      const r = await fetch(`${API}/api/cabanas/${cab.id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(payload)
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.message || 'No se pudo guardar');
      }
      toast.success('Cabaña actualizada');
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  const eliminar = async (cab)=>{
    if(!confirm(`¿Eliminar "${cab.nombre}"?`)) return;
    try{
      const r = await fetch(`${API}/api/cabanas/${cab.id}`,{
        method:'DELETE',
        credentials:'include'
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.message || 'No se pudo eliminar');
      }
      toast.success('Cabaña eliminada');
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  return (
    <div className="admin__wrap">
      <div className="listar__back"><BotonVolver/></div>
      <ToastContainer position="top-center" autoClose={1500}/>
      <h1 className="admin__title">Gestionar Cabañas</h1>

      <div className="card card--lg admin__card admin__card--narrow">

        {/* ===== Crear ===== */}
        <h3 className="admin__sectionTitle">Crear cabaña</h3>
        <div className="admin__row admin__row--create">
          <input className="input" placeholder="Nombre"
                 value={nuevo.nombre} onChange={e=>setNuevo({...nuevo, nombre:e.target.value})}/>
          <input className="input" placeholder="Capacidad" type="number" min="0"
                 value={nuevo.capacidad} onChange={e=>setNuevo({...nuevo, capacidad:e.target.value})}/>
          <input className="input" placeholder="Descripción (opcional)"
                 value={nuevo.descripcion} onChange={e=>setNuevo({...nuevo, descripcion:e.target.value})}/>
          <select className="select" value={nuevo.usuario_id}
                  onChange={e=>setNuevo({...nuevo, usuario_id:e.target.value})}>
            <option value="">Dueño…</option>
            {users.map(u=> <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
          <button className="btn btn--primary" onClick={crear}>Crear</button>
        </div>

        {/* ===== Listado ===== */}
        <h3 className="admin__sectionTitle">Listado de cabañas</h3>

        {/* Encabezado de columnas */}
        <div className="admin__row admin__row--head">
          <div className="admin__headCell">Nombre</div>
          <div className="admin__headCell">Capacidad</div>
          <div className="admin__headCell">Descripción</div>
          <div className="admin__headCell">Dueño</div>
          <div className="admin__headCell admin__headCell--actions">Acciones</div>
        </div>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <div className="admin__list">
            {cabanas.map(c=>(
              <div key={c.id} className="admin__row admin__row--list">
                {!c._edit ? (
                  <>
                    <div className="admin__cell">{c.nombre}</div>
                    <div className="admin__cell">{c.capacidad}</div>
                    <div className="admin__cell">{c.descripcion || '—'}</div>
                    <div className="admin__cell">{c.ownerUsername || ('id '+c.usuario_id)}</div>
                    <div className="admin__actions admin__cell--actions">
                      <button className="btn btn--primary" onClick={()=>toggleEdit(c.id, true)}>Editar</button>
                      <button className="btn btn--danger" onClick={()=>eliminar(c)}>Eliminar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input className="input" value={c._nombre}
                           onChange={e=>updateField(c.id, '_nombre', e.target.value)}/>
                    <input className="input" type="number" min="0" value={c._capacidad}
                           onChange={e=>updateField(c.id, '_capacidad', e.target.value)}/>
                    <input className="input" value={c._descripcion}
                           onChange={e=>updateField(c.id, '_descripcion', e.target.value)}/>
                    <div className="admin__cell admin__cell--muted">{c.ownerUsername || ('id '+c.usuario_id)}</div>
                    <div className="admin__actions admin__cell--actions">
                      <button className="btn btn--primary" onClick={()=>guardar(c)}>Guardar</button>
                      <button className="btn btn--ghost" onClick={()=>toggleEdit(c.id, false)}>Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {cabanas.length===0 && <p className="muted">No hay cabañas.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
