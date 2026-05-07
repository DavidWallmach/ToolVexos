import { useEffect, useState } from 'react'
import { Plus, UserCheck, UserX } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const roleColor = {
  ADMIN:'text-[#f5a623]',
  TOOLCRIP:'text-green-400',
  SUPERVISOR:'text-blue-400',
  JEFE_GRUPO:'text-purple-400',
  OPERADOR:'text-[#555]'
}

export default function UsuariosPage() {
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ empleado:'', nombre:'', email:'', password:'', role:'OPERADOR' })

  const load = () => api.get('/users').then(r => setUsers(r.data.users))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try {
      await api.post('/users', form)
      toast.success('Usuario creado')
      setModal(false); setForm({ empleado:'', nombre:'', email:'', password:'', role:'OPERADOR' }); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const toggleActivo = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { activo: !u.activo })
      toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado')
      load()
    } catch { toast.error('Error') }
  }

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>USUARIOS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>{users.length} REGISTRADOS</div>
        </div>
        <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
          <Plus size={14} /> NUEVO USUARIO
        </button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['N° EMPLEADO','NOMBRE','EMAIL','ROL','STATUS',''].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#f5a623'}}>{u.empleado}</td>
                <td className="td text-sm" style={{color:'#e8e8e8'}}>{u.nombre}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{u.email || '—'}</td>
                <td className="td"><span className={`mono text-xs font-semibold ${roleColor[u.role]}`}>{u.role}</span></td>
                <td className="td">{u.activo ? <span className="badge-ok">ACTIVO</span> : <span className="badge-danger">INACTIVO</span>}</td>
                <td className="td">
                  <button onClick={() => toggleActivo(u)} className="btn-ghost text-xs py-1 px-2">
                    {u.activo ? <><UserX size={11}/> DESACTIVAR</> : <><UserCheck size={11}/> ACTIVAR</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.88)'}}>
          <div className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="display text-xl" style={{color:'#f5a623'}}>NUEVO USUARIO</div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              {[['N° EMPLEADO','empleado','EMP-001'],['NOMBRE COMPLETO','nombre','Juan Pérez'],['EMAIL (opcional)','email','correo@empresa.com'],['CONTRASEÑA','password','']].map(([label,key,ph]) => (
                <div key={key}>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>{label}</label>
                  <input type={key==='password'?'password':'text'} className="input-field mono" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>ROL</label>
                <select className="input-field" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="TOOLCRIP">TOOLCRIP — Encargado del almacén (sin gestión de usuarios)</option>
                  <option value="SUPERVISOR">SUPERVISOR — Solo solicitar material y ver inventario</option>
                  <option value="JEFE_GRUPO">JEFE DE GRUPO — Solo solicitar material y ver inventario</option>
                  <option value="OPERADOR">OPERADOR — Solo ver inventario disponible</option>
                </select>
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">CREAR USUARIO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
