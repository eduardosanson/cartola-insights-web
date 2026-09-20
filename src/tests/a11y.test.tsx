import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import * as atletasApi from '../api/atletas'
import * as clubesApi from '../api/clubes'
import * as mpvApi from '../api/mpv'
import * as otimizadorApi from '../api/otimizador'
import * as mercadoApi from '../api/mercado'
import { AuthProvider } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import PentagonoQualidade from '../components/PentagonoQualidade'
import SplitBars from '../components/SplitBars'
import Tabela from '../pages/Tabela'
import Jogadores from '../pages/Jogadores'
import Patrimonio from '../pages/Patrimonio'
import MatrizCapitao from '../pages/MatrizCapitao'
import AlertasMercado from '../pages/AlertasMercado'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import { atletaMock, percentisMock } from './fixtures'

// color-contrast não funciona em jsdom (sem layout/cores computadas) —
// coberto por contraste.test.ts (RF06).
const opcoes = { rules: { 'color-contrast': { enabled: false } } }

async function violacoesGraves(container: Element) {
  const { violations } = await axe(container, opcoes)
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
}

function comRouter(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  )
}

describe('a11y (axe) — sem violações critical/serious', () => {
  it('Nav', async () => {
    const { container } = comRouter(<Nav />)
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('PentagonoQualidade', async () => {
    const { container } = render(<PentagonoQualidade percentis={percentisMock} />)
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('SplitBars', async () => {
    const { container } = render(<SplitBars mediaCasa={7.2} mediaFora={5.3} />)
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('Tabela', async () => {
    vi.spyOn(clubesApi, 'listarClubes').mockResolvedValue([
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55, media_pontos_fora: 48 },
    ])
    const { container, findByText } = comRouter(<Tabela />)
    await findByText('Flamengo')
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('Jogadores', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([atletaMock])
    const { container, findByText } = comRouter(<Jogadores />)
    await findByText('Gabigol')
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('Patrimonio', async () => {
    vi.spyOn(mpvApi, 'buscarCurvaValorizacao').mockResolvedValue([])
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([atletaMock])
    const { container } = comRouter(<Patrimonio />)
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('MatrizCapitao', async () => {
    vi.spyOn(otimizadorApi, 'buscarMatrizCapitao').mockResolvedValue([])
    const { container, findByText } = comRouter(<MatrizCapitao />)
    await findByText(/nenhum candidato/i)
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('AlertasMercado', async () => {
    vi.spyOn(mercadoApi, 'buscarStatusAlterados').mockResolvedValue([])
    const { container, findByText } = comRouter(<AlertasMercado />)
    await findByText(/nenhuma mudança/i)
    expect(await violacoesGraves(container)).toEqual([])
  })

  it('Login e Registro', async () => {
    const login = comRouter(<Login />)
    expect(await violacoesGraves(login.container)).toEqual([])
    login.unmount()
    const registro = comRouter(<Registro />)
    expect(await violacoesGraves(registro.container)).toEqual([])
  })

})
