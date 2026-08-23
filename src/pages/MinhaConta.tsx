import { useEffect, useState } from 'react'
import { gerarToken, listarTokens, revogarToken, type ApiToken } from '../api/contas'
import { useAuth } from '../contexts/AuthContext'

export default function MinhaConta() {
  const { usuario } = useAuth()
  const [tokens, setTokens] = useState<ApiToken[] | null>(null)
  const [tokenGerado, setTokenGerado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)

  function carregarTokens() {
    listarTokens()
      .then(setTokens)
      .catch((err: Error) => setErro(err.message))
  }

  useEffect(() => {
    carregarTokens()
  }, [])

  async function handleGerarToken() {
    setErro(null)
    setGerando(true)
    try {
      const criado = await gerarToken()
      setTokenGerado(criado.token)
      carregarTokens()
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setGerando(false)
    }
  }

  async function handleRevogar(id: number) {
    setErro(null)
    try {
      await revogarToken(id)
      carregarTokens()
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  function handleCopiar() {
    if (tokenGerado && navigator.clipboard) {
      navigator.clipboard.writeText(tokenGerado)
    }
  }

  return (
    <div>
      <h2>Minha conta</h2>
      {usuario && (
        <p>
          {usuario.email} · {usuario.role}
        </p>
      )}

      {erro && (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {erro}
        </p>
      )}

      <button onClick={handleGerarToken} disabled={gerando}>
        {gerando ? 'Gerando…' : 'Gerar token'}
      </button>

      {tokenGerado && (
        <div role="status">
          <p>Copie agora — este valor não será mostrado de novo:</p>
          <code>{tokenGerado}</code>
          <button onClick={handleCopiar}>Copiar</button>
        </div>
      )}

      {tokens === null && <p>Carregando tokens…</p>}
      {tokens && tokens.length === 0 && <p>Nenhum token gerado ainda.</p>}
      {tokens && tokens.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Criado em</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td>{new Date(token.criado_em).toLocaleString('pt-BR')}</td>
                <td>{token.revogado_em ? 'Revogado' : 'Ativo'}</td>
                <td>
                  {!token.revogado_em && (
                    <button onClick={() => handleRevogar(token.id)}>Revogar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
