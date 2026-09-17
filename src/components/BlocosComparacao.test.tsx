import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlocosComparacao from './BlocosComparacao'
import type { Atleta } from '../api/atletas'
import type { PercentisPadrao, PercentisGol } from '../api/percentis'
import type { RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'
import type { PerfilRisco } from '../api/perfilRisco'

function criarAtleta(overrides: Partial<Atleta> = {}): Atleta {
  return {
    id: 1,
    nome: 'Atleta A',
    posicao: 'ATA',
    clube_id: 5,
    clube_nome: 'Flamengo',
    preco_atual: 12.5,
    media_geral: 6.2,
    media_casa: 7.1,
    media_fora: 5.3,
    rodada_atual: 24,
    mando_rodada: 'casa',
    chance_pontuar_percentual: null,
    chance_pontuar_classificacao: null,
    media_basica: 4.1,
    overall_score: 69.3,
    ...overrides,
  }
}

function criarPercentis(overrides: Partial<PercentisPadrao> = {}): PercentisPadrao {
  return {
    atleta_id: 1,
    pontuacao_media: 80,
    participacao_gol: 91,
    desarme: 40,
    disciplina: 65,
    media_basica: 75,
    ...overrides,
  }
}

function criarPercentisGol(overrides: Partial<PercentisGol> = {}): PercentisGol {
  return {
    atleta_id: 1,
    pontuacao_media: 80,
    defesas: 70,
    solidez_sg: 60,
    disciplina: 65,
    media_basica: 75,
    ...overrides,
  }
}

function criarRaioX(overrides: Partial<RaioXConfrontoTipo> = {}): RaioXConfrontoTipo {
  return {
    atleta_id: 1,
    posicao: 'ATA',
    rodada: 24,
    mando: 'casa',
    clube_adversario_id: 267,
    clube_adversario_nome: 'Vasco',
    media_no_mando: 7.15,
    pontos_cedidos_adversario: 4.89,
    participacao_pontuacao_time_media: 12.4,
    veredito: 'referencia_do_time',
    ...overrides,
  }
}

function criarPerfilRisco(overrides: Partial<PerfilRisco> = {}): PerfilRisco {
  return {
    atleta_id: 1,
    risco_percentual: 70,
    classificacao: 'alto',
    pontos_retorno_direto: 30,
    pontos_participacao: 70,
    ...overrides,
  }
}

function getSecaoPorNome(nome: string): HTMLElement {
  const secao = screen.getByRole('heading', { level: 4, name: nome }).closest('section')
  if (!secao) throw new Error(`seção de "${nome}" não encontrada`)
  return secao as HTMLElement
}

describe('BlocosComparacao', () => {
  it('renderiza o Pentágono Dual e a tabela Head-to-Head quando os dois atletas são da mesma categoria', () => {
    const dadosA = {
      atleta: criarAtleta({ nome: 'Atleta A' }),
      percentis: criarPercentis(),
      raioX: criarRaioX(),
      perfilRisco: criarPerfilRisco(),
    }
    const dadosB = {
      atleta: criarAtleta({ id: 2, nome: 'Atleta B' }),
      percentis: criarPercentis({ atleta_id: 2 }),
      raioX: criarRaioX({ atleta_id: 2 }),
      perfilRisco: criarPerfilRisco({ atleta_id: 2 }),
    }

    render(<BlocosComparacao dadosA={dadosA} dadosB={dadosB} />)

    expect(
      screen.getByRole('img', { name: 'Pentágono de Qualidade comparando Atleta A e Atleta B' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Head-to-Head' })).toBeInTheDocument()
    expect(screen.queryByText(/Posições não comparáveis/)).not.toBeInTheDocument()
  })

  it('cai para dois pentágonos de qualidade lado a lado + aviso quando as posições são incompatíveis (GOL vs. linha)', () => {
    const dadosA = {
      atleta: criarAtleta({ nome: 'Goleiro', posicao: 'GOL' }),
      percentis: criarPercentisGol(),
      raioX: criarRaioX(),
      perfilRisco: criarPerfilRisco(),
    }
    const dadosB = {
      atleta: criarAtleta({ id: 2, nome: 'Linha', posicao: 'ATA' }),
      percentis: criarPercentis({ atleta_id: 2 }),
      raioX: criarRaioX({ atleta_id: 2 }),
      perfilRisco: criarPerfilRisco({ atleta_id: 2 }),
    }

    render(<BlocosComparacao dadosA={dadosA} dadosB={dadosB} />)

    expect(
      screen.getByText(
        'Posições não comparáveis — exibindo os pentágonos de qualidade individualmente.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: /Pentágono de Qualidade comparando/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Head-to-Head' })).not.toBeInTheDocument()
  })

  it('renderiza o Raio-X do confronto dos dois atletas lado a lado', () => {
    const dadosA = {
      atleta: criarAtleta({ nome: 'Atleta A' }),
      percentis: criarPercentis(),
      raioX: criarRaioX({ mando: 'casa', clube_adversario_nome: 'Vasco' }),
      perfilRisco: criarPerfilRisco(),
    }
    const dadosB = {
      atleta: criarAtleta({ id: 2, nome: 'Atleta B' }),
      percentis: criarPercentis({ atleta_id: 2 }),
      raioX: criarRaioX({ atleta_id: 2, mando: 'fora', clube_adversario_nome: 'Botafogo' }),
      perfilRisco: criarPerfilRisco({ atleta_id: 2 }),
    }

    render(<BlocosComparacao dadosA={dadosA} dadosB={dadosB} />)

    expect(screen.getAllByRole('heading', { name: 'Raio-X do confronto' })).toHaveLength(2)
    expect(screen.getByText('Média em casa')).toBeInTheDocument()
    expect(screen.getByText('Média fora')).toBeInTheDocument()
    expect(screen.getByText('Vasco cede em média')).toBeInTheDocument()
    expect(screen.getByText('Botafogo cede em média')).toBeInTheDocument()
  })

  it('renderiza o selo de risco (via SeloRisco) para os dois atletas no bloco de Perfil de Risco', () => {
    const dadosA = {
      atleta: criarAtleta({ nome: 'Atleta A' }),
      percentis: criarPercentis(),
      raioX: criarRaioX(),
      perfilRisco: criarPerfilRisco({ classificacao: 'baixo' }),
    }
    const dadosB = {
      atleta: criarAtleta({ id: 2, nome: 'Atleta B' }),
      percentis: criarPercentis({ atleta_id: 2 }),
      raioX: criarRaioX({ atleta_id: 2 }),
      perfilRisco: criarPerfilRisco({ atleta_id: 2, classificacao: 'medio' }),
    }

    render(<BlocosComparacao dadosA={dadosA} dadosB={dadosB} />)

    expect(getSecaoPorNome('Atleta A').textContent).toContain('Risco baixo')
    expect(getSecaoPorNome('Atleta B').textContent).toContain('Risco médio')
  })

  it('calcula largura das barras e cor dos rótulos de Retorno Direto/Participação a partir dos pontos exatos (total = soma > 0)', () => {
    const dadosA = {
      atleta: criarAtleta({ nome: 'Atleta A' }),
      percentis: criarPercentis(),
      raioX: criarRaioX(),
      // total = 30 + 70 = 100 → 30% / 70%
      perfilRisco: criarPerfilRisco({ pontos_retorno_direto: 30, pontos_participacao: 70 }),
    }
    const dadosB = {
      atleta: criarAtleta({ id: 2, nome: 'Atleta B' }),
      percentis: criarPercentis({ atleta_id: 2 }),
      raioX: criarRaioX({ atleta_id: 2 }),
      // total = 40 + 10 = 50 → 80% / 20%
      perfilRisco: criarPerfilRisco({
        atleta_id: 2,
        pontos_retorno_direto: 40,
        pontos_participacao: 10,
      }),
    }

    render(<BlocosComparacao dadosA={dadosA} dadosB={dadosB} />)

    const secaoA = getSecaoPorNome('Atleta A')
    const barraHomeA = secaoA.querySelector('.bar-fill.home')
    const barraAwayA = secaoA.querySelector('.bar-fill.away')
    expect(barraHomeA).toHaveStyle({ width: '30%' })
    expect(barraAwayA).toHaveStyle({ width: '70%' })

    const rotulosA = secaoA.querySelectorAll('.v')
    expect(rotulosA[0]).toHaveStyle({ color: 'var(--accent-home)' })
    expect(rotulosA[1]).toHaveStyle({ color: 'var(--accent-away)' })
    expect(rotulosA[0].textContent).toBe('30')
    expect(rotulosA[1].textContent).toBe('70')

    const secaoB = getSecaoPorNome('Atleta B')
    const barraHomeB = secaoB.querySelector('.bar-fill.home')
    const barraAwayB = secaoB.querySelector('.bar-fill.away')
    expect(barraHomeB).toHaveStyle({ width: '80%' })
    expect(barraAwayB).toHaveStyle({ width: '20%' })

    const rotulosB = secaoB.querySelectorAll('.v')
    expect(rotulosB[0]).toHaveStyle({ color: 'var(--accent-home)' })
    expect(rotulosB[1]).toHaveStyle({ color: 'var(--accent-away)' })
  })

  it('usa fallback total=1 (evita divisão por zero/Infinity) quando retorno direto e participação somam zero', () => {
    const dadosA = {
      atleta: criarAtleta({ nome: 'Atleta A' }),
      percentis: criarPercentis(),
      raioX: criarRaioX(),
      perfilRisco: criarPerfilRisco({ pontos_retorno_direto: 0, pontos_participacao: 0 }),
    }
    const dadosB = {
      atleta: criarAtleta({ id: 2, nome: 'Atleta B' }),
      percentis: criarPercentis({ atleta_id: 2 }),
      raioX: criarRaioX({ atleta_id: 2 }),
      perfilRisco: criarPerfilRisco({ atleta_id: 2, pontos_retorno_direto: 30, pontos_participacao: 70 }),
    }

    render(<BlocosComparacao dadosA={dadosA} dadosB={dadosB} />)

    const secaoA = getSecaoPorNome('Atleta A')
    const barraHomeA = secaoA.querySelector('.bar-fill.home')
    const barraAwayA = secaoA.querySelector('.bar-fill.away')
    // 0 / 1 * 100 = 0 — nem NaN%, nem Infinity%
    expect(barraHomeA).toHaveStyle({ width: '0%' })
    expect(barraAwayA).toHaveStyle({ width: '0%' })
  })
})
