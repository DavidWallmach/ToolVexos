import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/api'
import useAuthStore from './useAuth'
import toast from 'react-hot-toast'

export default function useNotificaciones() {
  const user = useAuthStore(s => s.user)
  const [pendientes, setPendientes] = useState(0)
  const prevPendientes = useRef(null)
  const audioRef = useRef(null)
  const isEncargado = ['ADMIN', 'TOOLCRIP'].includes(user?.role)

  // Crear sonido de notificación con Web Audio API
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch {}
  }, [])

  const checkTickets = useCallback(async () => {
    if (!isEncargado) return
    try {
      const { data } = await api.get('/tickets?status=PENDIENTE')
      const count = data.tickets.length
      
      // Si hay más tickets que antes → notificar
      if (prevPendientes.current !== null && count > prevPendientes.current) {
        const nuevos = count - prevPendientes.current
        playSound()
        toast.custom((t) => (
          <div
            onClick={() => { window.location.href = '/app/tickets'; toast.dismiss(t.id) }}
            className={`cursor-pointer flex items-center gap-3 px-4 py-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}
            style={{
              background: '#1a1a1a',
              border: '1px solid #f5a623',
              borderLeft: '4px solid #f5a623',
              maxWidth: '320px',
              cursor: 'pointer'
            }}
          >
            <div style={{fontSize:'20px'}}>🔔</div>
            <div>
              <div style={{color:'#f5a623', fontFamily:'Bebas Neue', fontSize:'16px', letterSpacing:'0.05em'}}>
                {nuevos === 1 ? 'NUEVO TICKET' : `${nuevos} TICKETS NUEVOS`}
              </div>
              <div style={{color:'#888', fontFamily:'IBM Plex Mono', fontSize:'11px'}}>
                Toca para ver la solicitud
              </div>
            </div>
          </div>
        ), { duration: 8000, position: 'top-right' })

        // Notificación del navegador si tiene permiso
        if (Notification.permission === 'granted') {
          new Notification('🔔 TOOLCRIP — Nuevo ticket', {
            body: `${nuevos} solicitud(es) pendiente(s) de aprobación`,
            icon: '/vite.svg'
          })
        }
      }
      
      prevPendientes.current = count
      setPendientes(count)
    } catch {}
  }, [isEncargado, playSound])

  useEffect(() => {
    if (!isEncargado) return

    // Pedir permiso para notificaciones del navegador
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Chequeo inmediato y luego cada 30 segundos
    checkTickets()
    const interval = setInterval(checkTickets, 30000)
    return () => clearInterval(interval)
  }, [isEncargado, checkTickets])

  return { pendientes }
}
