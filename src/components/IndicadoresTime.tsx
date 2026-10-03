import type { EscalacaoOtima } from "../api/otimizador";
import { formatCurrency, formatNumber } from "../utils/formatNumber";
import type { DetalhesAtletaCampo } from "./CampoTatico";

interface Props {
  escalacao: EscalacaoOtima;
  detalhes: Record<number, DetalhesAtletaCampo>;
}

export default function IndicadoresTime({ escalacao, detalhes }: Props) {
  const titulares = escalacao.titulares;
  const total = titulares.length;
  const dados = titulares.map((atleta) => detalhes[atleta.atleta_id]);
  const emCasa = dados.filter((d) => d?.mando === "casa").length;
  const comConfronto = dados.filter((d) => d?.mando).length;
  const medias = dados.flatMap((d) =>
    d?.mediaNoMando === undefined ? [] : [d.mediaNoMando],
  );
  const mediaNoMando = medias.length
    ? medias.reduce((a, b) => a + b, 0) / medias.length
    : null;
  const custoTitulares = titulares.reduce(
    (soma, atleta) => soma + atleta.preco,
    0,
  );

  return (
    <div className="indicadores-time">
      <h4 className="hud-rotulo">Indicadores do time</h4>
      <Barra
        rotulo="Jogando em casa"
        valor={`${emCasa}/${total}`}
        pct={(emCasa / total) * 100}
      />
      <Barra
        rotulo="Confrontos conhecidos"
        valor={`${comConfronto}/${total}`}
        pct={(comConfronto / total) * 100}
      />
      <div className="indicador-linha">
        <span>Média no mando</span>
        <span className="numeric">
          {mediaNoMando === null ? "—" : formatNumber(mediaNoMando)}
        </span>
      </div>
      <div className="indicador-linha">
        <span>Preço médio por titular</span>
        <span className="numeric">
          {formatCurrency(custoTitulares / total)}
        </span>
      </div>
    </div>
  );
}

function Barra({
  rotulo,
  valor,
  pct,
}: {
  rotulo: string;
  valor: string;
  pct: number;
}) {
  return (
    <div>
      <div className="indicador-linha">
        <span>{rotulo}</span>
        <span className="numeric">{valor}</span>
      </div>
      <span className="orcamento-barra" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
