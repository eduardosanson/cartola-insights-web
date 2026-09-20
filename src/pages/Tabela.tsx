import { useEffect, useState } from 'react'
import { listarClubes, type Clube } from '../api/clubes'
import SortableHeader from '../components/SortableHeader'
import { useMultiSort } from '../hooks/useMultiSort'
import { formatNumber } from '../utils/formatNumber'

const sortAccessors = {
  media_pontos_casa: (clube: Clube) => clube.media_pontos_casa,
  media_pontos_fora: (clube: Clube) => clube.media_pontos_fora,
}

type SortKey = keyof typeof sortAccessors

export default function Tabela() {
  const [clubes, setClubes] = useState<Clube[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const { criteria, sortedItems, toggleSort } = useMultiSort(clubes ?? [], sortAccessors)

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
    return <p role="status">Carregando clubes…</p>
  }

  if (clubes.length === 0) {
    return <p role="status">Nenhum clube encontrado.</p>
  }

  function sortState(key: SortKey) {
    const index = criteria.findIndex((criterion) => criterion.key === key)
    return { criterion: criteria[index], priority: index >= 0 ? index + 1 : undefined }
  }

  const casa = sortState('media_pontos_casa')
  const fora = sortState('media_pontos_fora')

  return (
    <table>
      <thead>
        <tr>
          <th>Clube</th>
          <SortableHeader
            label="Média casa"
            {...casa}
            onToggle={() => toggleSort('media_pontos_casa')}
          />
          <SortableHeader
            label="Média fora"
            {...fora}
            onToggle={() => toggleSort('media_pontos_fora')}
          />
        </tr>
      </thead>
      <tbody>
        {sortedItems.map((clube) => (
          <tr key={clube.id}>
            <td>{clube.nome}</td>
            <td className="numeric" style={{ color: 'var(--accent-home)' }}>
              {formatNumber(clube.media_pontos_casa)}
            </td>
            <td className="numeric" style={{ color: 'var(--accent-away)' }}>
              {formatNumber(clube.media_pontos_fora)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
