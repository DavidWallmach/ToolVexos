import { useState } from 'react'
import { FileInput, Copy, ArrowRightLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const converters = [
  { id: 'json-csv', label: 'JSON → CSV', endpoint: '/tools/file/json-to-csv', inputKey: 'json', placeholder: '[{"nombre":"Ana","edad":25}]' },
  { id: 'csv-json', label: 'CSV → JSON', endpoint: '/tools/file/csv-to-json', inputKey: 'csv', placeholder: 'nombre,edad\nAna,25' },
]

export default function FileToolsPage() {
  const [active, setActive] = useState(converters[0])
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!input.trim()) return toast.error('Introduce contenido primero.')
    setLoading(true)
    try {
      const { data } = await api.post(active.endpoint, { [active.inputKey]: input })
      const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)
      setOutput(result)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error convirtiendo.')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    toast.success('Copiado')
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <FileInput size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Convertidor de Archivos</h1>
          <p className="text-slate-400 text-sm">Convierte entre formatos de datos populares</p>
        </div>
      </div>

      {/* Converter tabs */}
      <div className="flex gap-1 mb-4 bg-surface-card p-1 rounded-xl w-fit">
        {converters.map(c => (
          <button
            key={c.id}
            onClick={() => { setActive(c); setInput(''); setOutput('') }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              active.id === c.id ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="card mb-4 space-y-4">
        <textarea
          className="input font-mono h-40 resize-none"
          placeholder={active.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={run} disabled={loading} className="btn-primary w-full justify-center">
          <ArrowRightLeft size={16} />
          {loading ? 'Convirtiendo...' : `Convertir ${active.label}`}
        </button>
      </div>

      {output && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-300">Resultado</span>
            <button onClick={copy} className="btn-secondary text-xs px-3 py-1.5">
              <Copy size={13} /> Copiar
            </button>
          </div>
          <pre className="text-slate-200 text-xs font-mono bg-surface rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
