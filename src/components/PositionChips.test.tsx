import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PositionChips from './PositionChips'
import type { Posicao } from '../api/atletas'

describe('PositionChips', () => {
  it('renderiza o grupo com role e aria-label corretos e as 6 posições, na ordem esperada', () => {
    render(<PositionChips selecionadas={[]} onToggle={vi.fn()} />)

    const grupo = screen.getByRole('group', { name: 'Filtrar por posição' })
    expect(grupo).toBeInTheDocument()
    expect(grupo).toHaveStyle({ display: 'flex', gap: '0.5rem' })

    const botoes = screen.getAllByRole('button')
    expect(botoes).toHaveLength(6)
    expect(botoes.map((botao) => botao.textContent)).toEqual([
      'GOL',
      'ZAG',
      'LAT',
      'MEI',
      'ATA',
      'TEC',
    ])
  })

  it('renderiza cada posição individualmente como texto visível', () => {
    render(<PositionChips selecionadas={[]} onToggle={vi.fn()} />)

    expect(screen.getByText('GOL')).toBeInTheDocument()
    expect(screen.getByText('ZAG')).toBeInTheDocument()
    expect(screen.getByText('LAT')).toBeInTheDocument()
    expect(screen.getByText('MEI')).toBeInTheDocument()
    expect(screen.getByText('ATA')).toBeInTheDocument()
    expect(screen.getByText('TEC')).toBeInTheDocument()
  })

  it('marca aria-pressed="false" e aplica estilo inativo quando a posição não está selecionada', () => {
    render(<PositionChips selecionadas={[]} onToggle={vi.fn()} />)

    const gol = screen.getByText('GOL')
    expect(gol).toHaveAttribute('aria-pressed', 'false')
    expect(gol).toHaveStyle({
      background: 'var(--bg-elevated)',
      color: 'var(--text)',
    })
  })

  it('marca aria-pressed="true" e aplica estilo ativo quando a posição está selecionada', () => {
    render(<PositionChips selecionadas={['ZAG']} onToggle={vi.fn()} />)

    const zag = screen.getByText('ZAG')
    expect(zag).toHaveAttribute('aria-pressed', 'true')
    expect(zag).toHaveStyle({
      background: 'var(--accent-home)',
      color: 'rgb(255, 255, 255)',
    })

    const gol = screen.getByText('GOL')
    expect(gol).toHaveAttribute('aria-pressed', 'false')
    expect(gol).toHaveStyle({
      background: 'var(--bg-elevated)',
      color: 'var(--text)',
    })
  })

  it('aplica os estilos estáticos comuns a todos os botões (borda, raio, padding, fonte e cursor)', () => {
    render(<PositionChips selecionadas={[]} onToggle={vi.fn()} />)

    const gol = screen.getByText('GOL')
    expect(gol).toHaveStyle({
      borderRadius: '999px',
      border: '1px solid var(--border)',
      padding: '0.25rem 0.9rem',
      fontFamily: 'var(--font-heading)',
      cursor: 'pointer',
    })
  })

  it('todos os botões têm type="button"', () => {
    render(<PositionChips selecionadas={[]} onToggle={vi.fn()} />)

    for (const botao of screen.getAllByRole('button')) {
      expect(botao).toHaveAttribute('type', 'button')
    }
  })

  it('chama onToggle com a posição clicada quando ela está inativa', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<PositionChips selecionadas={[]} onToggle={onToggle} />)

    await user.click(screen.getByText('MEI'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('MEI')
  })

  it('chama onToggle com a posição clicada quando ela já está ativa', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<PositionChips selecionadas={['ATA']} onToggle={onToggle} />)

    await user.click(screen.getByText('ATA'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('ATA')
  })

  it('chama onToggle apenas para a posição clicada, não para as demais', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<PositionChips selecionadas={[]} onToggle={onToggle} />)

    await user.click(screen.getByText('TEC'))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('TEC')
    expect(onToggle).not.toHaveBeenCalledWith('GOL')
    expect(onToggle).not.toHaveBeenCalledWith('ZAG')
    expect(onToggle).not.toHaveBeenCalledWith('LAT')
    expect(onToggle).not.toHaveBeenCalledWith('MEI')
    expect(onToggle).not.toHaveBeenCalledWith('ATA')
  })

  it('reflete múltiplas posições selecionadas simultaneamente', () => {
    const selecionadas: Posicao[] = ['GOL', 'LAT', 'TEC']
    render(<PositionChips selecionadas={selecionadas} onToggle={vi.fn()} />)

    for (const posicao of selecionadas) {
      expect(screen.getByText(posicao)).toHaveAttribute('aria-pressed', 'true')
    }

    for (const posicao of ['ZAG', 'MEI', 'ATA']) {
      expect(screen.getByText(posicao)).toHaveAttribute('aria-pressed', 'false')
    }
  })
})
