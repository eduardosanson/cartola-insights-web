import { Link } from 'react-router-dom'
import type { SubstitutoSugerido } from '../api/otimizador'
import { formatCurrency, formatNumber } from '../utils/formatNumber'
import type { DetalhesAtletaCampo } from './CampoTatico'

export type EstadoSubstituicao =
  | { atletaId: number; estado: 'carregando' }
  | { atletaId: number; estado: 'vazio' }
  | { atletaId: number; estado: 'erro'; mensagem: string }
  | {
      atletaId: number
      estado: 'pronto'
      substituto: SubstitutoSugerido
      detalhes: DetalhesAtletaCampo
    }

interface Props {
  estado: EstadoSubstituicao
  nomeAtual: string
  aviso?: string
  bloqueio?: string
  onConfirmar: () => void
  onCancelar: () => void
}

export default function PainelSubstituicao({
  estado,
  nomeAtual,
  aviso,
  bloqueio,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <section className="hud-painel painel-substituicao" aria-label="Substituição de atleta">
      <span className="hud-rotulo">Substituir {nomeAtual}</span>
      {estado.estado === 'carregando' && <p role="status">Buscando substituto…</p>}
      {estado.estado === 'vazio' && (
        <p role="status">Nenhum substituto direto encontrado nessa faixa de preço.</p>
      )}
      {estado.estado === 'erro' && <p role="alert">{estado.mensagem}</p>}
      {estado.estado === 'pronto' && (
        <>
          <Link to={`/jogadores/${estado.substituto.atleta_id}`} className="substituto-nome">
            {estado.detalhes.nome}
          </Link>
          <div className="hud-linha">
            <span>
              {estado.substituto.posicao} · {formatCurrency(estado.substituto.preco)}
            </span>
            <span className="numeric">Média {formatNumber(estado.substituto.media_geral)}</span>
          </div>
          <div className="hud-linha">
            <span>Chance de pontuar</span>
            <span className="numeric">
              {formatNumber(estado.substituto.chance_pontuar_percentual)}%
            </span>
          </div>
          <p className="estimativa-nota">A pontuação projetada usa a média geral do substituto.</p>
          {bloqueio && <p role="alert">{bloqueio}</p>}
          {aviso && (
            <p role="status" className="aviso-orcamento">
              {aviso}
            </p>
          )}
        </>
      )}
      <div className="painel-substituicao-acoes">
        {estado.estado === 'pronto' && (
          <button type="button" onClick={onConfirmar} disabled={Boolean(bloqueio)}>
            Confirmar troca
          </button>
        )}
        <button type="button" className="secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </section>
  )
}
