import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SeloRisco from './SeloRisco'
import type { PerfilRisco } from '../api/perfilRisco'

const base: PerfilRisco = {
  atleta_id: 1,
  risco_percentual: 70,
  classificacao: 'alto',
  pontos_retorno_direto: 132,
  pontos_participacao: 56.5,
}

describe('SeloRisco', () => {
  it('mostra "Risco alto" na cor --danger quando classificacao é alto', () => {
    render(<SeloRisco perfil={base} />)

    const selo = screen.getByText(/risco alto/i)
    expect(selo).toBeInTheDocument()
    expect(selo).toHaveStyle({ color: 'var(--danger)' })
  })

  it('mostra "Risco médio" na cor --accent-away quando classificacao é medio', () => {
    render(<SeloRisco perfil={{ ...base, classificacao: 'medio', risco_percentual: 50 }} />)

    const selo = screen.getByText(/risco médio/i)
    expect(selo).toHaveStyle({ color: 'var(--accent-away)' })
  })

  it('mostra "Risco baixo" na cor --accent-home quando classificacao é baixo', () => {
    render(<SeloRisco perfil={{ ...base, classificacao: 'baixo', risco_percentual: 0 }} />)

    const selo = screen.getByText(/risco baixo/i)
    expect(selo).toHaveStyle({ color: 'var(--accent-home)' })
  })

  it('mostra o percentual formatado com vírgula decimal (pt-BR)', () => {
    render(<SeloRisco perfil={{ ...base, risco_percentual: 70.5 }} />)

    expect(screen.getByText(/70,5%/)).toBeInTheDocument()
  })
})
