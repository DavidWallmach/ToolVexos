import { useState } from 'react'
import { Palette, Copy, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const generatePalette = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  const { h, s } = rgbToHsl(r, g, b)
  return [10, 30, 50, 70, 90].map((l) => `hsl(${h}, ${s}%, ${l}%)`)
}

export default function ColorToolsPage() {
  const [hex, setHex] = useState('#0ea5e9')
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const palette = generatePalette(hex)

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado')
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-pink-500/10">
          <Palette size={22} className="text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Utilidades de Colores</h1>
          <p className="text-slate-400 text-sm">Convierte y explora colores al instante</p>
        </div>
      </div>

      {/* Picker */}
      <div className="card mb-4">
        <label className="text-sm text-slate-400 mb-3 block">Selecciona un color</label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-14 h-12 rounded-xl cursor-pointer border-0 bg-transparent"
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="input font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Conversiones */}
      <div className="card mb-4">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Conversiones</h3>
        <div className="space-y-3">
          {[
            { label: 'HEX', value: hex },
            { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
            { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between bg-surface rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-500 font-medium w-10">{label}</span>
              <span className="text-sm font-mono text-slate-200 flex-1 ml-3">{value}</span>
              <button onClick={() => copy(value)} className="text-slate-500 hover:text-slate-200 transition">
                <Copy size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Paleta */}
      <div className="card">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Paleta generada</h3>
        <div className="flex gap-2">
          {palette.map((color, i) => (
            <button
              key={i}
              onClick={() => copy(color)}
              title={color}
              className="flex-1 h-16 rounded-xl transition hover:scale-105"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">Haz clic en un color para copiarlo</p>
      </div>
    </div>
  )
}
