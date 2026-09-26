import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarTodosAtletas, type Atleta, type Posicao, type StatusAtletaNome } from '../api/atletas'
import DropdownFiltro from '../components/DropdownFiltro'
import IndicadorSincronizacao from '../components/IndicadorSincronizacao'
import MandoRodada from '../components/MandoRodada'
import SortableHeader from '../components/SortableHeader'
import StatusBadge from '../components/StatusBadge'
import { useMultiSort } from '../hooks/useMultiSort'
import { formatNumber } from '../utils/formatNumber'
import { sanitizeSearchInput } from '../utils/sanitizeSearchInput'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 300
const sortAccessors = {
  preco_atual: (atleta: Atleta) => atleta.preco_atual,
  media_geral: (atleta: Atleta) => atleta.media_geral,
  media_basica: (atleta: Atleta) => atleta.media_basica,
  media_casa: (atleta: Atleta) => atleta.media_casa,
  media_fora: (atleta: Atleta) => atleta.media_fora,
  // null fica sempre por último, tanto em ordem crescente quanto decrescente
  // — useMultiSort trata null como "sem dado" e nunca o deixa vencer um
  // valor real, em nenhuma das duas direções (issues #5 e #35).
  chance_pontuar_percentual: (atleta: Atleta) => atleta.chance_pontuar_percentual,
  overall_score: (atleta: Atleta) => atleta.overall_score,
}

type SortKey = keyof typeof sortAccessors

export default function Jogadores() {
  const [nomeInput, setNomeInput] = useState('')
  const [nomeDebounced, setNomeDebounced] = useState('')
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [statusFiltros, setStatusFiltros] = useState<StatusAtletaNome[]>([])
  const [mando, setMando] = useState<'' | 'casa' | 'fora' | 'sem_jogo'>('')
  const [page, setPage] = useState(1)
  // Cache local — todos os atletas buscados uma única vez ao montar.
  // Filtro, ordenação e paginação rodam 100% no cliente sobre esse
  // array, sem round-trip ao backend a cada interação (dataset medido
  // em ~857 atletas / ~285KB, carrega em <0.5s — ver docs/decisions).
  const [todosAtletas, setTodosAtletas] = useState<Atleta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setNomeDebounced(nomeInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [nomeInput])

  useEffect(() => {
    let ativo = true
    listarTodosAtletas()
      .then((dados) => {
        if (ativo) setTodosAtletas(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
  }, [])

  function togglePosicao(posicao: string) {
    setPage(1)
    const pos = posicao as Posicao
    setPosicoes((atual) =>
      atual.includes(pos) ? atual.filter((p) => p !== pos) : [...atual, pos],
    )
  }

  function toggleStatus(status: string) {
    setPage(1)
    const st = status as StatusAtletaNome
    setStatusFiltros((atual) =>
      atual.includes(st) ? atual.filter((s) => s !== st) : [...atual, st],
    )
  }

  const filtrados = useMemo(() => {
    if (!todosAtletas) return []
    const nomeBusca = nomeDebounced.trim().toLowerCase()
    return todosAtletas.filter((atleta) => {
      if (nomeBusca && !atleta.nome.toLowerCase().includes(nomeBusca)) return false
      if (posicoes.length > 0 && !posicoes.includes(atleta.posicao)) return false
      if (
        statusFiltros.length > 0 &&
        (!atleta.status_nome || !statusFiltros.includes(atleta.status_nome))
      ) {
        return false
      }
      if (mando && atleta.mando_rodada !== mando) return false
      return true
    })
  }, [todosAtletas, nomeDebounced, posicoes, statusFiltros, mando])

  const { criteria, sortedItems, toggleSort } = useMultiSort(filtrados, sortAccessors)

  const atletasDaPagina = useMemo(
    () => sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedItems, page],
  )

  function sortState(key: SortKey) {
    const index = criteria.findIndex((criterion) => criterion.key === key)
    return { criterion: criteria[index], priority: index >= 0 ? index + 1 : undefined }
  }

  const preco = sortState('preco_atual')
  const geral = sortState('media_geral')
  const basica = sortState('media_basica')
  const casa = sortState('media_casa')
  const fora = sortState('media_fora')
  const overall = sortState('overall_score')
  const chance = sortState('chance_pontuar_percentual')

  return (
    <div>
      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <IndicadorSincronizacao />
      </div>
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
              setNomeInput(sanitizeSearchInput(e.target.value))
            }}
          />
        </label>
        <div className="filter-dropdowns">
          <DropdownFiltro
            label="Status"
            opcoes={[
              {
                valor: 'provavel',
                label: 'Provável',
                badge: <StatusBadge statusNome="provavel" iconeApenas />,
              },
              {
                valor: 'duvida',
                label: 'Dúvida',
                badge: <StatusBadge statusNome="duvida" iconeApenas />,
              },
              {
                valor: 'suspenso',
                label: 'Suspenso',
                badge: <StatusBadge statusNome="suspenso" iconeApenas />,
              },
              {
                valor: 'contundido',
                label: 'Contundido',
                badge: <StatusBadge statusNome="contundido" iconeApenas />,
              },
              {
                valor: 'nulo',
                label: 'Nulo',
                badge: <StatusBadge statusNome="nulo" iconeApenas />,
              },
            ]}
            selecionados={statusFiltros}
            onToggle={toggleStatus}
            onLimpar={() => {
              setPage(1)
              setStatusFiltros([])
            }}
          />
          <DropdownFiltro
            label="Posição"
            opcoes={[
              { valor: 'GOL', label: 'Goleiro (GOL)' },
              { valor: 'ZAG', label: 'Zagueiro (ZAG)' },
              { valor: 'LAT', label: 'Lateral (LAT)' },
              { valor: 'MEI', label: 'Meia (MEI)' },
              { valor: 'ATA', label: 'Atacante (ATA)' },
              { valor: 'TEC', label: 'Técnico (TEC)' },
            ]}
            selecionados={posicoes}
            onToggle={togglePosicao}
            onLimpar={() => {
              setPage(1)
              setPosicoes([])
            }}
          />
          <DropdownFiltro
            label="Mando"
            opcoes={[
              { valor: 'casa', label: 'Casa' },
              { valor: 'fora', label: 'Fora' },
            ]}
            selecionados={mando ? [mando] : []}
            onToggle={(v) => {
              setPage(1)
              setMando((atual) => (atual === v ? '' : (v as 'casa' | 'fora')))
            }}
            onLimpar={() => {
              setPage(1)
              setMando('')
            }}
          />
        </div>
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!erro && !todosAtletas && <p role="status">Carregando jogadores…</p>}
      {!erro && todosAtletas && sortedItems.length === 0 && <p role="status">Nenhum jogador encontrado.</p>}

      {!erro && todosAtletas && sortedItems.length > 0 && (
        <div className="players-list-card" role="table">
          <div className="players-list-inner">
            <div className="player-row-header" role="row">
              <div role="columnheader">Nome</div>
              <div role="columnheader" title="Status no mercado" style={{ textAlign: 'center' }}>
                St
              </div>
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
                label="Overall"
                {...overall}
                onToggle={() => toggleSort('overall_score')}
              />
              <SortableHeader
                as="div"
                label="Chance de pontuar"
                {...chance}
                onToggle={() => toggleSort('chance_pontuar_percentual')}
              />
            </div>
            <div role="rowgroup">
              {atletasDaPagina.map((atleta) => (
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
                  <span role="cell" style={{ display: 'flex', justifyContent: 'center' }}>
                    <StatusBadge
                      statusNome={atleta.status_nome}
                      statusId={atleta.status_id}
                      iconeApenas
                    />
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
                  <span role="cell" className="num">
                    {formatNumber(atleta.overall_score)}
                  </span>
                  <span role="cell" className="num">
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
          disabled={page * PAGE_SIZE >= sortedItems.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
