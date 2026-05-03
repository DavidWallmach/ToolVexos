import { useState } from 'react'
import { Code2, Copy, Minimize2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const tabs = ['Minificar', 'Base64']

export default function CodeToolsPage() {
  const [tab, setTab] = useState('Minificar')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('encode')
  const [loading, setLoading] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(output)
    toast.success('Copiado')
  }

  const run = async () => {
    if (!input.trim()) return toast.error('Introduce texto primero.')
    setLoading(true)
    try {
      if (tab === 'Minificar') {
        const { data } = await api.post('/tools/code/minify', { code: input })
        setOutput(data.result)
        toast.success(`Reducido: ${data.originalSize} → ${data.minifiedSize} caracteres`)
      } else {
        const { data } = await api.post('/tools/code/base64', { text: input, mode })
        setOutput(data.result)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error procesando.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-cyan-500/10">
          <Code2 size={22} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Herramientas de Código</h1>
          <p className="text-slate-400 text-sm">Minifica, convierte y procesa código</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-surface-card p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setOutput('') }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card mb-4 space-y-4">
        {tab === 'Base64' && (
          <div className="flex gap-2">
            {['encode', 'decode'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  mode === m ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'encode' ? 'Texto → Base64' : 'Base64 → Texto'}
              </button>
            ))}
          </div>
        )}

        <textarea
          className="input font-mono h-36 resize-none"
          placeholder={tab === 'Minificar' ? 'Pega tu código aquí...' : 'Pega el texto aquí...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button onClick={run} disabled={loading} className="btn-primary w-full justify-center">
          <Minimize2 size={16} />
          {loading ? 'Procesando...' : 'Procesar'}
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
          <pre className="text-slate-200 text-xs font-mono bg-surface rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
