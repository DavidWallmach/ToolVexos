import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/api'
import useAuthStore from './useAuth'
import toast from 'react-hot-toast'

export default function useNotificaciones() {
  const user = useAuthStore(s => s.user)
  const [pendientes, setPendientes] = useState(0)
  const prevPendientes = useRef(null)
  const isEncargado = ['ADMIN', 'TOOLCRIP'].includes(user?.role)

  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }, [])

  const checkTickets = useCallback(async () => {
    if (!isEncargado) return
    try {
      const { data } = await api.get('/tickets?status=PENDIENTE')
      const count = data.tickets.length

      if (prevPendientes.current !== null && count > prevPendientes.current) {
        const nuevos = count - prevPendientes.current
        playSound()

        toast(
          nuevos === 1
            ? '🔔 Nuevo ticket pendiente — haz clic en TICKETS'
            : `🔔 ${nuevos} tickets nuevos — haz clic en TICKETS`,
          {
            duration: 8000,
            position: 'top-right',
            style: {
              background: '#1a1a1a',
              color: '#f5a623',
              border: '1px solid #f5a623',
              borderLeft: '4px solid #f5a623',
              fontFamily: 'IBM Plex Mono',
              fontSize: '12px',
            },
          }
        )

        if (Notification.permission === 'granted') {
          new Notification('TOOLCRIP — Nuevo ticket', {
            body: `${nuevos} solicitud(es) pendiente(s) de aprobacion`,
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
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    checkTickets()
    const interval = setInterval(checkTickets, 30000)
    return () => clearInterval(interval)
  }, [isEncargado, checkTickets])

  return { pendientes }
}