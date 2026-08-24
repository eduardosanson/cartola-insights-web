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
  media_basica: (atleta: Atleta) => atleta.media_basica,
  media_casa: (atleta: Atleta) => atleta.media_casa,
  media_fora: (atleta: Atleta) => atleta.media_fora,
  // sem dado (null) fica sempre por ultimo, tanto em ordem crescente quanto
  // decrescente — -1 nunca colide com um percentual real (0-100).
  chance_pontuar_percentual: (atleta: Atleta) => atleta.chance_pontuar_percentual ?? -1,
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
  const basica = sortState('media_basica')
  const casa = sortState('media_casa')
  const fora = sortState('media_fora')
  const chance = sortState('chance_pontuar_percentual')

  return (
    <div>
      <div className="players-toolbar">
        <label className="search-field">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nome…"
            value={nomeInput}
            onChange={(e) => {
              setPage(1)
              setNomeInput(e.target.value)
            }}
          />
        </label>
        <div className="filter-group">
          <PositionChips selecionadas={posicoes} onToggle={togglePosicao} />
        </div>
        <div
          className="filter-group"
          role="group"
          aria-label="Filtrar por mando do próximo jogo"
        >
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
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!erro && !atletas && <p>Carregando jogadores…</p>}
      {!erro && atletas && atletas.length === 0 && <p>Nenhum jogador encontrado.</p>}

      {!erro && atletas && atletas.length > 0 && (
        <div className="players-list-card" role="table">
          <div className="players-list-inner">
            <div className="player-row-header" role="row">
              <div role="columnheader">Nome</div>
              <div role="columnheader">Clube</div>
              <div role="columnheader">Posição</div>
              <div role="columnheader">Mando</div>
              <SortableHeader
                as="div"
                label="Preço"
                {...preco}
                onToggle={() => toggleSort('preco_atual')}
              />
              <SortableHeader
                as="div"
                label="Média geral"
                {...geral}
                onToggle={() => toggleSort('media_geral')}
              />
              <SortableHeader
                as="div"
                label="Média básica"
                {...basica}
                onToggle={() => toggleSort('media_basica')}
              />
              <SortableHeader
                as="div"
                label="Média casa"
                {...casa}
                onToggle={() => toggleSort('media_casa')}
              />
              <SortableHeader
                as="div"
                label="Média fora"
                {...fora}
                onToggle={() => toggleSort('media_fora')}
              />
              <SortableHeader
                as="div"
                label="Chance de pontuar"
                {...chance}
                onToggle={() => toggleSort('chance_pontuar_percentual')}
              />
            </div>
            <div role="rowgroup">
              {sortedItems.map((atleta) => (
                <Link
                  key={atleta.id}
                  to={`/jogadores/${atleta.id}`}
                  state={{ atleta }}
                  className="player-row"
                  role="row"
                >
                  <span role="cell" className="name-cell">
                    <strong>{atleta.nome}</strong>
                  </span>
                  <span role="cell" className="club-cell-text">
                    {atleta.clube_nome}
                  </span>
                  <span role="cell" className="pos-pill">
                    {atleta.posicao}
                  </span>
                  <span role="cell">
                    <MandoRodada mando={atleta.mando_rodada} rodada={atleta.rodada_atual} />
                  </span>
                  <span role="cell" className="num">
                    {formatNumber(atleta.preco_atual)}
                  </span>
                  <span role="cell" className="num">
                    {formatNumber(atleta.media_geral)}
                  </span>
                  <span role="cell" className="num base" title="Média sem pontos ponderados de gol/assistência">
                    {formatNumber(atleta.media_basica)}
                  </span>
                  <span role="cell" className="num home">
                    {formatNumber(atleta.media_casa)}
                  </span>
                  <span role="cell" className="num away">
                    {formatNumber(atleta.media_fora)}
                  </span>
                  <span role="cell">
                    {atleta.chance_pontuar_classificacao === null ? (
                      '—'
                    ) : (
                      <span className={`chance-badge chance-${atleta.chance_pontuar_classificacao}`}>
                        {
                          { baixa: 'Baixa', media: 'Média', alta: 'Alta' }[
                            atleta.chance_pontuar_classificacao
                          ]
                        }
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
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
