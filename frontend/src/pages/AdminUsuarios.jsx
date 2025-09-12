import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/pages/admin.css';
import BotonVolver from '../components/BotonVolver';

const API = import.meta.env.VITE_API_URL;

export default function AdminUsuarios(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({ username:'', password:'' });

  const cargar = async ()=>{
    setLoading(true);
    try{
      const r = await fetch(`${API}/api/usuarios`, { credentials:'include' });
      const data = await r.json();
      setItems((Array.isArray(data)?data:[]).map(u=>({ ...u, _edit:false, _username:u.username, _chgPass:false, _newPass:'' })));
    }catch(e){
      toast.error('Error cargando usuarios');
      setItems([]);
    }finally{ setLoading(false); }
  };
  useEffect(()=>{ cargar(); }, []);

  const crear = async ()=>{
    if(!nuevo.username || !nuevo.password) return toast.warn('Completá usuario y password');
    try{
      const r = await fetch(`${API}/api/usuarios`,{
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify(nuevo)
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.message || 'No se pudo crear');
      }
      toast.success('Usuario creado');
      setNuevo({ username:'', password:'' });
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  const toggleEdit = (id,v)=> setItems(prev=> prev.map(u=> u.id===id ? {...u, _edit:v} : u));
  const updateField = (id, field, value)=> setItems(prev=> prev.map(u=> u.id===id ? {...u, [field]:value} : u));
  const togglePass = id => setItems(prev=> prev.map(u=> u.id===id ? {...u, _chgPass:!u._chgPass, _newPass:''} : u));

  const renombrar = async (u)=>{
    try{
      const r = await fetch(`${API}/api/usuarios/${u.id}`,{
        method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ username: u._username })
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.message || 'No se pudo actualizar');
      }
      toast.success('Usuario actualizado');
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  const resetPass = async (u)=>{
    if(!u._newPass) return toast.warn('Ingresá la nueva contraseña');
    try{
      const r = await fetch(`${API}/api/usuarios/${u.id}/password`,{
        method:'PATCH', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ password: u._newPass })
      });
      if(!r.ok) throw new Error('No se pudo resetear el password');
      toast.success('Password actualizado');
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  const eliminar = async (u)=>{
    if(!confirm(`¿Eliminar usuario "${u.username}"?`)) return;
    try{
      const r = await fetch(`${API}/api/usuarios/${u.id}`,{
        method:'DELETE', credentials:'include'
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.message || 'No se pudo eliminar');
      }
      toast.success('Usuario eliminado');
      cargar();
    }catch(e){ toast.error(e.message); }
  };

  return (
    <div className="admin__wrap">
      <div className="listar__back"><BotonVolver/></div>
      <ToastContainer position="top-center" autoClose={1500}/>
      <h1 className="admin__title">Gestionar Usuarios</h1>

      <div className="card card--lg admin__card admin__card--narrow">
        {/* Crear */}
        <div className="admin__row admin__row--create">
          <input className="input" placeholder="Username"
                 value={nuevo.username} onChange={e=>setNuevo({...nuevo, username:e.target.value})}/>
          <input className="input" placeholder="Password"
                 value={nuevo.password} onChange={e=>setNuevo({...nuevo, password:e.target.value})}/>
          <button className="btn btn--primary" onClick={crear}>Crear</button>
        </div>

        {/* Lista */}
        {loading ? <p className="muted">Cargando…</p> : (
          <div className="admin__list">
            {items.map(u=>(
              <div key={u.id} className="admin__row">
                {!u._edit ? (
                  <>
                    <div className="admin__col"><div className="admin__label">Usuario</div>{u.username}</div>
                    <div className="admin__actions">
                      <button className="btn btn--primary" onClick={()=>toggleEdit(u.id,true)}>Editar</button>
                      <button className="btn btn--danger" onClick={()=>eliminar(u)}>Eliminar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input className="input" value={u._username}
                      onChange={e=>updateField(u.id, '_username', e.target.value)}/>
                    <div className="admin__actions">
                      <button className="btn btn--primary" onClick={()=>renombrar(u)}>Guardar</button>
                      <button className="btn btn--ghost" onClick={()=>toggleEdit(u.id,false)}>Cancelar</button>
                    </div>
                    <div className="admin__row admin__row--password">
                      {!u._chgPass ? (
                        <button className="btn btn--primary" onClick={()=>togglePass(u.id)}>Cambiar contraseña</button>
                      ) : (
                        <>
                          <input className="input" type="password" placeholder="Nueva contraseña"
                            value={u._newPass} onChange={e=>updateField(u.id, '_newPass', e.target.value)}/>
                          <div className="admin__actions">
                            <button className="btn btn--primary" onClick={()=>resetPass(u)}>Actualizar</button>
                            <button className="btn btn--ghost" onClick={()=>togglePass(u.id)}>Cancelar</button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {items.length===0 && <p className="muted">No hay usuarios.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
