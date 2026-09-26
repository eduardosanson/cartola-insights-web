import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarTodosAtletas, type Atleta, type Posicao, type StatusAtletaNome } from '../api/atletas'
import { useMultiSort } from '../hooks/useMultiSort'
import { formatNumber } from '../utils/formatNumber'
import { sanitizeSearchInput } from '../utils/sanitizeSearchInput'
import DropdownFiltro from './DropdownFiltro'
import SortableHeader from './SortableHeader'
import StatusBadge from './StatusBadge'

const PAGE_SIZE = 15
const DEBOUNCE_MS = 300

const sortAccessors = {
  preco_atual: (atleta: Atleta) => atleta.preco_atual,
  media_casa: (atleta: Atleta) => atleta.media_casa,
  media_fora: (atleta: Atleta) => atleta.media_fora,
  overall_score: (atleta: Atleta) => atleta.overall_score,
}

type SortKey = keyof typeof sortAccessors

interface Props {
  atletaOrigem: Atleta
  aberto: boolean
  onFechar: () => void
}

export default function ModalCompararJogador({ atletaOrigem, aberto, onFechar }: Props) {
  const navigate = useNavigate()
  const [nomeInput, setNomeInput] = useState('')
  const [nomeDebounced, setNomeDebounced] = useState('')
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [statusFiltros, setStatusFiltros] = useState<StatusAtletaNome[]>([])
  const [page, setPage] = useState(1)
  const [todosAtletas, setTodosAtletas] = useState<Atleta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setNomeDebounced(nomeInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [nomeInput])

  useEffect(() => {
    if (!aberto) return

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
  }, [aberto])

  useEffect(() => {
    if (!aberto) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onFechar()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aberto, onFechar])

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
      // Exclui o atleta de origem para não comparar consigo mesmo
      if (atleta.id === atletaOrigem.id) return false
      if (nomeBusca && !atleta.nome.toLowerCase().includes(nomeBusca)) return false
      if (posicoes.length > 0 && !posicoes.includes(atleta.posicao)) return false
      if (
        statusFiltros.length > 0 &&
        (!atleta.status_nome || !statusFiltros.includes(atleta.status_nome))
      ) {
        return false
      }
      return true
    })
  }, [todosAtletas, atletaOrigem.id, nomeDebounced, posicoes, statusFiltros])

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
  const casa = sortState('media_casa')
  const fora = sortState('media_fora')
  const overall = sortState('overall_score')

  function selecionarAtleta(atletaEscolhido: Atleta) {
    navigate(`/comparar?a=${atletaOrigem.id}&b=${atletaEscolhido.id}`)
    onFechar()
  }

  if (!aberto) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-comparar-titulo"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-comparar-titulo">Comparar com outro jogador</h2>
            <p className="modal-subtitulo">
              Comparando com <strong>{atletaOrigem.nome}</strong> ({atletaOrigem.clube_nome} · {atletaOrigem.posicao})
            </p>
          </div>
          <button
            type="button"
            className="modal-btn-fechar"
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </header>

        <div className="modal-toolbar">
          <label className="search-field modal-search">
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
          </div>
        </div>

        {erro && <p role="alert">{erro}</p>}
        {!erro && !todosAtletas && <p>Carregando jogadores…</p>}
        {!erro && todosAtletas && sortedItems.length === 0 && (
          <p className="modal-empty">Nenhum jogador encontrado.</p>
        )}

        {!erro && todosAtletas && sortedItems.length > 0 && (
          <div className="modal-list-wrapper">
            <div className="modal-table-header" role="row">
              <div>Jogador</div>
              <div title="Status no mercado" style={{ textAlign: 'center' }}>
                St
              </div>
              <div>Posição</div>
              <SortableHeader
                as="div"
                label="Preço"
                {...preco}
                onToggle={() => toggleSort('preco_atual')}
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
            </div>

            <div className="modal-table-body" role="list">
              {atletasDaPagina.map((atleta) => (
                <div
                  key={atleta.id}
                  className="modal-table-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => selecionarAtleta(atleta)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selecionarAtleta(atleta)
                    }
                  }}
                >
                  <div className="name-cell">
                    <strong>{atleta.nome}</strong>
                    <span className="club-cell-text">{atleta.clube_nome}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <StatusBadge
                      statusNome={atleta.status_nome}
                      statusId={atleta.status_id}
                      iconeApenas
                    />
                  </div>
                  <div>
                    <span className="pos-pill">{atleta.posicao}</span>
                  </div>
                  <div className="num">{formatNumber(atleta.preco_atual)}</div>
                  <div className="num home">{formatNumber(atleta.media_casa)}</div>
                  <div className="num away">{formatNumber(atleta.media_fora)}</div>
                  <div className="num">{formatNumber(atleta.overall_score)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="modal-footer">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))}
          </span>
          <button
            type="button"
            disabled={page * PAGE_SIZE >= sortedItems.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </footer>
      </div>
    </div>
  )
}
