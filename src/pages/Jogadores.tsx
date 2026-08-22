import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarAtletas, type Atleta, type Posicao } from '../api/atletas'
import PositionChips from '../components/PositionChips'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 300

export default function Jogadores() {
  const [nomeInput, setNomeInput] = useState('')
  const [nomeDebounced, setNomeDebounced] = useState('')
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [page, setPage] = useState(1)
  const [atletas, setAtletas] = useState<Atleta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setNomeDebounced(nomeInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [nomeInput])

  useEffect(() => {
    let ativo = true
    listarAtletas({
      nome: nomeDebounced || undefined,
      posicao: posicoes.length > 0 ? posicoes : undefined,
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
  }, [nomeDebounced, posicoes, page])

  function togglePosicao(posicao: Posicao) {
    setPage(1)
    setPosicoes((atual) =>
      atual.includes(posicao) ? atual.filter((p) => p !== posicao) : [...atual, posicao],
    )
  }

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
              <th className="numeric">Preço</th>
              <th className="numeric">Média geral</th>
              <th className="numeric">Média casa</th>
              <th className="numeric">Média fora</th>
            </tr>
          </thead>
          <tbody>
            {atletas.map((atleta) => (
              <tr key={atleta.id}>
                <td>
                  <Link to={`/jogadores/${atleta.id}`}>{atleta.nome}</Link>
                </td>
                <td>{atleta.clube_nome}</td>
                <td>{atleta.posicao}</td>
                <td className="numeric">{atleta.preco_atual}</td>
                <td className="numeric">{atleta.media_geral}</td>
                <td className="numeric">{atleta.media_casa}</td>
                <td className="numeric">{atleta.media_fora}</td>
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
