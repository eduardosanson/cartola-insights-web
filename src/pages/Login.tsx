import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/contas'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { refetch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { mensagem?: string } }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email, senha)
      await refetch()
      navigate('/')
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h2>Entrar</h2>
      {location.state?.mensagem && <p role="status">{location.state.mensagem}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      {erro && (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {erro}
        </p>
      )}
      <p>
        Não tem conta? <Link to="/registrar">Criar conta</Link>
      </p>
    </div>
  )
}
