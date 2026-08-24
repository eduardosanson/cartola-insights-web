import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarAtletas, type Atleta, type Posicao } from '../api/atletas'
import PositionChips from '../components/PositionChips'
import MandoRodada from '../components/MandoRodada'
import SortableHeader from '../components/SortableHeader'
import { useMultiSort } from '../hooks/useMultiSort'
import { formatNumber } from '../utils/formatNumber'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 300
const sortAccessors = {
  preco_atual: (atleta: Atleta) => atleta.preco_atual,
  media_geral: (atleta: Atleta) => atleta.media_geral,
  media_casa: (atleta: Atleta) => atleta.media_casa,
  media_fora: (atleta: Atleta) => atleta.media_fora,
}

type SortKey = keyof typeof sortAccessors

export default function Jogadores() {
  const [nomeInput, setNomeInput] = useState('')
  const [nomeDebounced, setNomeDebounced] = useState('')
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [mando, setMando] = useState<'' | 'casa' | 'fora' | 'sem_jogo'>('')
  const [page, setPage] = useState(1)
  const [atletas, setAtletas] = useState<Atleta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const { criteria, sortedItems, toggleSort } = useMultiSort(atletas ?? [], sortAccessors)

  useEffect(() => {
    const timer = setTimeout(() => setNomeDebounced(nomeInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [nomeInput])

  useEffect(() => {
    let ativo = true
    listarAtletas({
      nome: nomeDebounced || undefined,
      posicao: posicoes.length > 0 ? posicoes : undefined,
      mando: mando || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((dados) => {
        if (ativo) setAtletas(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
  }, [nomeDebounced, posicoes, mando, page])

  function togglePosicao(posicao: Posicao) {
    setPage(1)
    setPosicoes((atual) =>
      atual.includes(posicao) ? atual.filter((p) => p !== posicao) : [...atual, posicao],
    )
  }

  function sortState(key: SortKey) {
    const index = criteria.findIndex((criterion) => criterion.key === key)
    return { criterion: criteria[index], priority: index >= 0 ? index + 1 : undefined }
  }

  const preco = sortState('preco_atual')
  const geral = sortState('media_geral')
  const casa = sortState('media_casa')
  const fora = sortState('media_fora')

  return (
    <div>
      <input
        type="search"
        placeholder="Buscar por nome…"
        value={nomeInput}
        onChange={(e) => {
          setPage(1)
          setNomeInput(e.target.value)
        }}
      />
      <PositionChips selecionadas={posicoes} onToggle={togglePosicao} />
      <div role="group" aria-label="Filtrar por mando do próximo jogo">
        {(['', 'casa', 'fora'] as const).map((valor) => (
          <button
            key={valor || 'todos'}
            type="button"
            aria-pressed={mando === valor}
            onClick={() => {
              setPage(1)
              setMando(valor)
            }}
          >
            {valor === '' ? 'Todos' : valor === 'casa' ? 'Casa' : 'Fora'}
          </button>
        ))}
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!erro && !atletas && <p>Carregando jogadores…</p>}
      {!erro && atletas && atletas.length === 0 && <p>Nenhum jogador encontrado.</p>}

      {!erro && atletas && atletas.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Clube</th>
              <th>Posição</th>
              <th>Mando</th>
              <SortableHeader
                label="Preço"
                {...preco}
                onToggle={() => toggleSort('preco_atual')}
              />
              <SortableHeader
                label="Média geral"
                {...geral}
                onToggle={() => toggleSort('media_geral')}
              />
              <SortableHeader
                label="Média casa"
                {...casa}
                onToggle={() => toggleSort('media_casa')}
              />
              <SortableHeader
                label="Média fora"
                {...fora}
                onToggle={() => toggleSort('media_fora')}
              />
              <th>Chance de pontuar</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((atleta) => (
              <tr key={atleta.id}>
                <td>
                  <Link to={`/jogadores/${atleta.id}`} state={{ atleta }}>
                    {atleta.nome}
                  </Link>
                </td>
                <td>{atleta.clube_nome}</td>
                <td>{atleta.posicao}</td>
                <td>
                  <MandoRodada mando={atleta.mando_rodada} rodada={atleta.rodada_atual} />
                </td>
                <td className="numeric">{formatNumber(atleta.preco_atual)}</td>
                <td className="numeric">{formatNumber(atleta.media_geral)}</td>
                <td className="numeric">{formatNumber(atleta.media_casa)}</td>
                <td className="numeric">{formatNumber(atleta.media_fora)}</td>
                <td>
                  {atleta.chance_pontuar_classificacao === null
                    ? '—'
                    : { baixa: 'Baixa', media: 'Média', alta: 'Alta' }[
                        atleta.chance_pontuar_classificacao
                      ]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div>
        <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </button>
        <span> Página {page} </span>
        <button
          type="button"
          disabled={!atletas || atletas.length < PAGE_SIZE}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
