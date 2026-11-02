import { useCallback, useEffect, useRef, useState } from 'react'

// Carga datos con estado de error; una respuesta lenta anterior no pisa la más reciente
export default function useCarga(cargar, deps = []) {
  const [loading, setLoading] = useState(true)
  const [fallo, setFallo] = useState(false)
  const ultima = useRef(0)

  const recargar = useCallback(async () => {
    const id = ++ultima.current
    setLoading(true)
    setFallo(false)
    try {
      const aplicar = await cargar()
      if (id === ultima.current) aplicar()
    } catch {
      if (id === ultima.current) setFallo(true)
    }
    if (id === ultima.current) setLoading(false)
  }, deps)

  useEffect(() => { recargar() }, [recargar])

  return { loading, fallo, recargar }
}
