import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrar } from '../api/contas'

const SENHA_MINIMA = 8

export default function Registro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await registrar(email, senha)
      navigate('/entrar', { state: { mensagem: 'Conta criada! Faça login.' } })
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h2>Criar conta</h2>
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
            minLength={SENHA_MINIMA}
            required
          />
        </label>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      {erro && (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {erro}
        </p>
      )}
    </div>
  )
}
