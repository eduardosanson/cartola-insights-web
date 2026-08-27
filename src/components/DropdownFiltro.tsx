import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface OpcaoFiltro {
  valor: string
  label: string
  badge?: ReactNode
}

interface Props {
  label: string
  opcoes: OpcaoFiltro[]
  selecionados: string[]
  onToggle: (valor: string) => void
  onLimpar?: () => void
  ariaLabel?: string
}

export default function DropdownFiltro({
  label,
  opcoes,
  selecionados,
  onToggle,
  onLimpar,
  ariaLabel,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [aberto])

  const totalSelecionados = selecionados.length

  return (
    <div ref={containerRef} className="dropdown-filtro-container">
      <button
        type="button"
        className={`dropdown-filtro-gatilho ${totalSelecionados > 0 ? 'ativo' : ''}`.trim()}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? `${label}: ${totalSelecionados} selecionados`}
        onClick={() => setAberto((prev) => !prev)}
      >
        <span>{label}</span>
        {totalSelecionados > 0 && (
          <span className="dropdown-filtro-count">{totalSelecionados}</span>
        )}
        <svg
          aria-hidden="true"
          className={`dropdown-filtro-chevron ${aberto ? 'aberto' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {aberto && (
        <div className="dropdown-filtro-menu" role="listbox" tabIndex={-1}>
          <div className="dropdown-filtro-opcoes">
            {opcoes.map((opcao) => {
              const selecionado = selecionados.includes(opcao.valor)
              return (
                <div
                  key={opcao.valor}
                  role="option"
                  aria-selected={selecionado}
                  tabIndex={0}
                  className={`dropdown-filtro-opcao ${selecionado ? 'selecionada' : ''}`.trim()}
                  onClick={() => onToggle(opcao.valor)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggle(opcao.valor)
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selecionado}
                    readOnly
                    tabIndex={-1}
                    className="dropdown-filtro-checkbox"
                  />
                  {opcao.badge && <span className="dropdown-filtro-badge">{opcao.badge}</span>}
                  <span className="dropdown-filtro-label">{opcao.label}</span>
                </div>
              )
            })}
          </div>

          {onLimpar && totalSelecionados > 0 && (
            <div className="dropdown-filtro-rodape">
              <button
                type="button"
                className="dropdown-filtro-btn-limpar"
                onClick={() => {
                  onLimpar()
                  setAberto(false)
                }}
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
