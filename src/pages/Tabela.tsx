import { useEffect, useState } from 'react'
import { listarClubes, type Clube } from '../api/clubes'

export default function Tabela() {
  const [clubes, setClubes] = useState<Clube[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    listarClubes()
      .then((dados) => {
        if (ativo) setClubes(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
  }, [])

  if (erro) {
    return <p role="alert">{erro}</p>
  }

  if (!clubes) {
    return <p>Carregando clubes…</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Clube</th>
          <th className="numeric">Média casa</th>
          <th className="numeric">Média fora</th>
        </tr>
      </thead>
      <tbody>
        {clubes.map((clube) => (
          <tr key={clube.id}>
            <td>{clube.nome}</td>
            <td className="numeric" style={{ color: 'var(--accent-home)' }}>
              {clube.media_pontos_casa}
            </td>
            <td className="numeric" style={{ color: 'var(--accent-away)' }}>
              {clube.media_pontos_fora}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
