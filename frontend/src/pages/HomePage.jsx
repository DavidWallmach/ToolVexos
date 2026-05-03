import { Link } from 'react-router-dom'
import { Zap, Bot, Palette, Code2, FileInput, ArrowRight } from 'lucide-react'

const features = [
  { icon: Bot, label: 'IA Generator', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Palette, label: 'Colores', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { icon: Code2, label: 'Código', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { icon: FileInput, label: 'Archivos', color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      {/* Badge */}
      <span className="tool-tag bg-brand-500/10 text-brand-400 mb-6">
        Producción-ready ⚡
      </span>

      {/* Logo + título */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Zap size={24} className="text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight">ToolVexos</h1>
      </div>

      <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed">
        Todas las herramientas que necesitas en un solo lugar. IA, colores, código y archivos.
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        {features.map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${bg} border border-slate-700/50`}>
            <Icon size={16} className={color} />
            <span className="text-sm text-slate-300 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Link to="/register" className="btn-primary text-base px-6 py-2.5">
          Empezar gratis <ArrowRight size={16} />
        </Link>
        <Link to="/login" className="btn-secondary text-base px-6 py-2.5">
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
}
