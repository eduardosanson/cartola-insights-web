import { useEffect, useMemo, useState } from 'react'
import { listarTodosAtletas, type Atleta, type Posicao } from '../api/atletas'
import { sanitizeSearchInput } from '../utils/sanitizeSearchInput'

const DEBOUNCE_MS = 300

interface Props {
  /** Chamado com o `Atleta` completo quando uma opção é selecionada. */
  onSelecionar: (atleta: Atleta) => void
  /** Quando presente, atletas dessa posição aparecem primeiro na lista
   * (outras posições continuam listadas depois — RF04 permite comparar
   * posições diferentes, então nada é removido). */
  posicaoPrioritaria?: Posicao
}

export default function AtletaAutocomplete({ onSelecionar, posicaoPrioritaria }: Props) {
  const [nomeInput, setNomeInput] = useState('')
  const [nomeDebounced, setNomeDebounced] = useState('')
  const [aberto, setAberto] = useState(false)
  // Cache local — todos os atletas buscados uma única vez ao montar (mesmo
  // padrão de Jogadores.tsx). Filtro e ordenação rodam no cliente.
  const [todosAtletas, setTodosAtletas] = useState<Atleta[] | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setNomeDebounced(nomeInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [nomeInput])

  useEffect(() => {
    let ativo = true
    listarTodosAtletas().then((dados) => {
      if (ativo) setTodosAtletas(dados)
    })
    return () => {
      ativo = false
    }
  }, [])

  const resultados = useMemo(() => {
    if (!todosAtletas) return []
    const nomeBusca = nomeDebounced.trim().toLowerCase()
    if (!nomeBusca) return []
    const encontrados = todosAtletas.filter((atleta) =>
      atleta.nome.toLowerCase().includes(nomeBusca),
    )
    if (!posicaoPrioritaria) return encontrados
    // Sort estável: atletas da posição prioritária primeiro, sem remover
    // os demais (RF04).
    return [...encontrados].sort((a, b) => {
      const aPrioritario = a.posicao === posicaoPrioritaria
      const bPrioritario = b.posicao === posicaoPrioritaria
      if (aPrioritario === bPrioritario) return 0
      return aPrioritario ? -1 : 1
    })
  }, [todosAtletas, nomeDebounced, posicaoPrioritaria])

  const mostrarLista = aberto && resultados.length > 0

  function selecionar(atleta: Atleta) {
    onSelecionar(atleta)
    setNomeInput(atleta.nome)
    setAberto(false)
  }

  return (
    <div style={{ position: 'relative' }}>
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
          placeholder="Buscar atleta…"
          value={nomeInput}
          onChange={(e) => {
            setNomeInput(sanitizeSearchInput(e.target.value))
            setAberto(true)
          }}
        />
      </label>
      {mostrarLista && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 10,
            top: '100%',
            left: 0,
            right: 0,
            margin: '0.25rem 0 0',
            padding: '0.25rem',
            listStyle: 'none',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '9px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {resultados.map((atleta) => (
            <li
              key={atleta.id}
              role="option"
              aria-selected="false"
              onClick={() => selecionar(atleta)}
              style={{
                padding: '0.4rem 0.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              <span>{atleta.nome}</span> — <span>{atleta.posicao}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
