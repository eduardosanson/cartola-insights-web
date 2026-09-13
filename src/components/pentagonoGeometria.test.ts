import { describe, it, expect } from 'vitest'
import {
  calcularPonto,
  calcularEixos,
  ANEIS,
  EIXOS_LINHAS,
  POSICOES_ROTULOS,
  PONTOS_MEDIANA,
} from './pentagonoGeometria'
import type { PercentisGol, PercentisPadrao } from '../api/percentis'

describe('components/pentagonoGeometria', () => {
  describe('calcularPonto', () => {
    it('calcula o vértice do topo (índice 0) com valor 100%', () => {
      // ângulo = -PI/2 (topo), cos ≈ 0, sin = -1
      const ponto = calcularPonto(0, 5, 100, 170, 160, 110)

      expect(ponto.x).toBeCloseTo(170, 5)
      expect(ponto.y).toBeCloseTo(50, 5)
      expect(ponto.str).toBe('170,50')
    })

    it('calcula o segundo vértice (índice 1 de 5) com valor 100%', () => {
      // ângulo = -PI/2 + 2*PI/5 = -18°
      const ponto = calcularPonto(1, 5, 100, 170, 160, 110)

      expect(ponto.x).toBeCloseTo(274.616217, 5)
      expect(ponto.y).toBeCloseTo(126.008131, 5)
      // string arredondada para 1 casa decimal — mata mutações de template,
      // arredondamento (round) e dos operadores aritméticos * / / dentro dele.
      expect(ponto.str).toBe('274.6,126')
    })

    it('escala o raio proporcionalmente ao valor do percentil (não é sempre o raio total)', () => {
      // valor 50% no topo: raioEfetivo = r * (valor/100) = 55, não r / (valor/100) = 220
      const ponto = calcularPonto(0, 5, 50, 170, 160, 110)

      expect(ponto.x).toBeCloseTo(170, 5)
      expect(ponto.y).toBeCloseTo(105, 5)
      expect(ponto.str).toBe('170,105')
    })

    it('retorna um objeto com x, y e str preenchidos (não um objeto vazio)', () => {
      const ponto = calcularPonto(2, 5, 80, 0, 0, 100)

      expect(ponto).toHaveProperty('x')
      expect(ponto).toHaveProperty('y')
      expect(ponto).toHaveProperty('str')
      expect(typeof ponto.x).toBe('number')
      expect(typeof ponto.y).toBe('number')
      expect(ponto.str).toMatch(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    })
  })

  describe('constantes de geometria fixa', () => {
    it('POSICOES_ROTULOS tem as 5 posições e âncoras exatas dos rótulos', () => {
      expect(POSICOES_ROTULOS).toEqual([
        { x: 170, y: 36, anchor: 'middle' },
        { x: 282, y: 128, anchor: 'start' },
        { x: 240, y: 268, anchor: 'middle' },
        { x: 98, y: 268, anchor: 'middle' },
        { x: 58, y: 128, anchor: 'end' },
      ])
    })

    it('ANEIS tem os 4 níveis com classe e pontos exatos', () => {
      expect(ANEIS).toEqual([
        { nivel: 100, classe: 'pentagon-ring', pontos: '170,50 275,126 235,249 105,249 65,126' },
        {
          nivel: 75,
          classe: 'pentagon-ring',
          pontos: '170,77.5 248.8,134.5 218.8,226.8 121.2,226.8 91.2,134.5',
        },
        {
          nivel: 50,
          classe: 'pentagon-ring-mid',
          pontos: '170,105 222.5,143 202.5,204.5 137.5,204.5 117.5,143',
        },
        {
          nivel: 25,
          classe: 'pentagon-ring',
          pontos: '170,132.5 196.25,151.5 186.25,182.25 153.75,182.25 143.75,151.5',
        },
      ])
    })

    it('EIXOS_LINHAS tem as 5 pontas exatas dos eixos radiais (100% de raio)', () => {
      expect(EIXOS_LINHAS).toEqual([
        { x2: 170, y2: 50 },
        { x2: 275, y2: 126 },
        { x2: 235, y2: 249 },
        { x2: 105, y2: 249 },
        { x2: 65, y2: 126 },
      ])
    })

    it('PONTOS_MEDIANA tem a string exata do polígono de 50%', () => {
      expect(PONTOS_MEDIANA).toBe('170,105 222.5,143 202.5,204.5 137.5,204.5 117.5,143')
    })
  })

  describe('calcularEixos', () => {
    const percentisGol: PercentisGol = {
      atleta_id: 1,
      pontuacao_media: 80,
      defesas: 70,
      solidez_sg: 60,
      disciplina: 50,
      media_basica: 40,
      brutos: {
        pontuacao_media: 8.5,
        indicador2: 3,
        indicador3: 2,
        defesas: 99,
        solidez_sg: 88,
        disciplina: 1.1,
        media_basica: 0.9,
      },
    }

    const percentisLinha: PercentisPadrao = {
      atleta_id: 2,
      pontuacao_media: 65,
      participacao_gol: 55,
      desarme: 45,
      disciplina: 35,
      media_basica: 25,
      brutos: {
        pontuacao_media: 6.5,
        indicador2: 5,
        indicador3: 4,
        participacao_gol: 88,
        desarme: 77,
        disciplina: 0.5,
        media_basica: 0.3,
      },
    }

    it('deriva os 5 eixos de goleiro (GOL) com rótulos, valores e brutos exatos', () => {
      const eixos = calcularEixos(percentisGol)

      expect(eixos).toHaveLength(5)
      expect(eixos[0]).toEqual({ rotulo: 'Pontuação Média', valor: 80, bruto: 8.5 })
      // indicador2 (3) tem prioridade sobre defesas (99) via ??
      expect(eixos[1]).toEqual({ rotulo: 'Defesas', valor: 70, bruto: 3 })
      // indicador3 (2) tem prioridade sobre solidez_sg (88) via ??
      expect(eixos[2]).toEqual({ rotulo: 'Solidez (SG)', valor: 60, bruto: 2 })
      expect(eixos[3]).toEqual({ rotulo: 'Piso Básico', valor: 40, bruto: 0.9 })
      expect(eixos[4]).toEqual({ rotulo: 'Disciplina', valor: 50, bruto: 1.1 })
    })

    it('deriva os 5 eixos de linha (não-GOL) com rótulos, valores e brutos exatos', () => {
      const eixos = calcularEixos(percentisLinha)

      expect(eixos).toHaveLength(5)
      expect(eixos[0]).toEqual({ rotulo: 'Poder de Fogo', valor: 65, bruto: 6.5 })
      // indicador2 (5) tem prioridade sobre participacao_gol (88) via ??
      expect(eixos[1]).toEqual({ rotulo: 'Criação', valor: 55, bruto: 5 })
      // indicador3 (4) tem prioridade sobre desarme (77) via ??
      expect(eixos[2]).toEqual({ rotulo: 'Combate', valor: 45, bruto: 4 })
      expect(eixos[3]).toEqual({ rotulo: 'Piso Básico', valor: 25, bruto: 0.3 })
      expect(eixos[4]).toEqual({ rotulo: 'Disciplina', valor: 35, bruto: 0.5 })
    })

    it('usa fallback para o bruto secundário quando o indicador específico não vem no payload (GOL)', () => {
      const semIndicadores: PercentisGol = {
        ...percentisGol,
        brutos: {
          pontuacao_media: 8.5,
          defesas: 99,
          solidez_sg: 88,
          disciplina: 1.1,
          media_basica: 0.9,
        },
      }

      const eixos = calcularEixos(semIndicadores)

      expect(eixos[1].bruto).toBe(99)
      expect(eixos[2].bruto).toBe(88)
    })

    it('usa fallback para o bruto secundário quando o indicador específico não vem no payload (linha)', () => {
      const semIndicadores: PercentisPadrao = {
        ...percentisLinha,
        brutos: {
          pontuacao_media: 6.5,
          participacao_gol: 88,
          desarme: 77,
          disciplina: 0.5,
          media_basica: 0.3,
        },
      }

      const eixos = calcularEixos(semIndicadores)

      expect(eixos[1].bruto).toBe(88)
      expect(eixos[2].bruto).toBe(77)
    })

    it('funciona sem objeto de brutos (bruto fica undefined)', () => {
      const { brutos: _brutos, ...semBrutos } = percentisLinha
      const eixos = calcularEixos(semBrutos)

      expect(eixos.every((eixo) => eixo.bruto === undefined)).toBe(true)
      expect(eixos[0].valor).toBe(65)
    })
  })
})
