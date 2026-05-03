import { useState } from 'react'
import { Bot, Sparkles, Copy, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const tones = ['neutral', 'profesional', 'casual', 'persuasivo', 'técnico']
const lengths = [
  { value: 'short', label: 'Corto (~100 palabras)' },
  { value: 'medium', label: 'Medio (~250 palabras)' },
  { value: 'long', label: 'Largo (~500 palabras)' },
]

export default function AiGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('neutral')
  const [length, setLength] = useState('medium')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!prompt.trim()) return toast.error('Escribe un prompt primero.')
    setLoading(true)
    try {
      const { data } = await api.post('/tools/ai/generate', { prompt, tone, length })
      setResult(data.result)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error generando texto.')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    toast.success('Copiado al portapapeles')
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-violet-500/10">
          <Bot size={22} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Generador de Texto con IA</h1>
          <p className="text-slate-400 text-sm">Genera cualquier tipo de contenido al instante</p>
        </div>
      </div>

      {/* Config */}
      <div className="card mb-4 space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Prompt</label>
          <textarea
            className="input resize-none h-28"
            placeholder="Ej: Escribe un email de bienvenida para nuevos clientes de una startup tech..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Tono</label>
            <select
              className="input"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {tones.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Longitud</label>
            <select
              className="input"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              {lengths.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          <Sparkles size={16} />
          {loading ? 'Generando...' : 'Generar texto'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Resultado</span>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-secondary text-xs px-3 py-1.5">
                <Copy size={13} /> Copiar
              </button>
            </div>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  )
}
