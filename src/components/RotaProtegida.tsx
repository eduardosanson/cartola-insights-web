import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <p>Carregando…</p>
  if (!usuario) return <Navigate to="/entrar" replace />
  return <>{children}</>
}
