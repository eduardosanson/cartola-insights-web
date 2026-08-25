import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'

/** Geometria fixa do Pentágono de Qualidade (5 eixos), compartilhada entre
 * `PentagonoQualidade` (um atleta) e `PentagonoDual` (dois atletas
 * sobrepostos) — extraída pra evitar duplicar anéis/eixos/mediana entre os
 * dois componentes. */

export interface Ponto {
  x: number
  y: number
  str: string
}

export function calcularPonto(
  indice: number,
  total: number,
  valor: number,
  cx: number,
  cy: number,
  r: number,
): Ponto {
  const angulo = -Math.PI / 2 + indice * ((2 * Math.PI) / total)
  const raioEfetivo = r * (valor / 100)
  const x = cx + raioEfetivo * Math.cos(angulo)
  const y = cy + raioEfetivo * Math.sin(angulo)
  return {
    x,
    y,
    str: `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`,
  }
}

export const RAIO_PADRAO = 110
export const CENTRO_X_PADRAO = 170
export const CENTRO_Y_PADRAO = 160

export const POSICOES_ROTULOS = [
  { x: 170, y: 36, anchor: 'middle' as const },
  { x: 282, y: 128, anchor: 'start' as const },
  { x: 240, y: 268, anchor: 'middle' as const },
  { x: 98, y: 268, anchor: 'middle' as const },
  { x: 58, y: 128, anchor: 'end' as const },
]

// Anéis concêntricos regulares (25%, 50%, 75%, 100%)
export const ANEIS = [
  { nivel: 100, classe: 'pentagon-ring', pontos: '170,50 275,126 235,249 105,249 65,126' },
  { nivel: 75, classe: 'pentagon-ring', pontos: '170,77.5 248.8,134.5 218.8,226.8 121.2,226.8 91.2,134.5' },
  { nivel: 50, classe: 'pentagon-ring-mid', pontos: '170,105 222.5,143 202.5,204.5 137.5,204.5 117.5,143' },
  { nivel: 25, classe: 'pentagon-ring', pontos: '170,132.5 196.25,151.5 186.25,182.25 153.75,182.25 143.75,151.5' },
]

// Eixos radiais (100% de raio)
export const EIXOS_LINHAS = [
  { x2: 170, y2: 50 },
  { x2: 275, y2: 126 },
  { x2: 235, y2: 249 },
  { x2: 105, y2: 249 },
  { x2: 65, y2: 126 },
]

// Sombra da Mediana da posição (50%)
export const PONTOS_MEDIANA = '170,105 222.5,143 202.5,204.5 137.5,204.5 117.5,143'

export interface EixoQualidade {
  rotulo: string
  valor: number
  bruto?: number
}

/** Deriva os 5 eixos (rótulo + valor de percentil + bruto) a partir dos
 * percentis de um atleta, escolhendo o conjunto GOL ou linha conforme o
 * shape recebido. */
export function calcularEixos(percentis: PercentisAtleta): EixoQualidade[] {
  const isGol = ehPercentisGol(percentis)
  const brutos = percentis.brutos

  return isGol
    ? [
        { rotulo: 'Pontuação Média', valor: percentis.pontuacao_media ?? 0, bruto: brutos?.pontuacao_media },
        { rotulo: 'Defesas', valor: percentis.defesas ?? 0, bruto: brutos?.indicador2 ?? brutos?.defesas },
        { rotulo: 'Solidez (SG)', valor: percentis.solidez_sg ?? 0, bruto: brutos?.indicador3 ?? brutos?.solidez_sg },
        { rotulo: 'Piso Básico', valor: percentis.media_basica ?? 0, bruto: brutos?.media_basica },
        { rotulo: 'Disciplina', valor: percentis.disciplina ?? 0, bruto: brutos?.disciplina },
      ]
    : [
        { rotulo: 'Poder de Fogo', valor: percentis.pontuacao_media ?? 0, bruto: brutos?.pontuacao_media },
        { rotulo: 'Criação', valor: percentis.participacao_gol ?? 0, bruto: brutos?.indicador2 ?? brutos?.participacao_gol },
        { rotulo: 'Combate', valor: percentis.desarme ?? 0, bruto: brutos?.indicador3 ?? brutos?.desarme },
        { rotulo: 'Piso Básico', valor: percentis.media_basica ?? 0, bruto: brutos?.media_basica },
        { rotulo: 'Disciplina', valor: percentis.disciplina ?? 0, bruto: brutos?.disciplina },
      ]
}
