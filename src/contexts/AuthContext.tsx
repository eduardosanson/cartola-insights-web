import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { obterUsuarioAtual, logout as logoutRequest, type Usuario } from '../api/contas'

interface AuthContextValue {
  usuario: Usuario | null
  carregando: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const dados = await obterUsuarioAtual()
      setUsuario(dados)
    } catch {
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, carregando, refetch, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return contexto
}
