import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as atletasApi from '../api/atletas'
import * as clubesApi from '../api/clubes'
import * as mercadoApi from '../api/mercado'
import * as mpvApi from '../api/mpv'
import * as otimizadorApi from '../api/otimizador'
import * as percentisApi from '../api/percentis'
import * as raioXApi from '../api/raioX'
import * as perfilRiscoApi from '../api/perfilRisco'
import AlertasMercado from '../pages/AlertasMercado'
import DetalheJogador from '../pages/DetalheJogador'
import Jogadores from '../pages/Jogadores'
import MatrizCapitao from '../pages/MatrizCapitao'
import Patrimonio from '../pages/Patrimonio'
import Tabela from '../pages/Tabela'
import { atletaMock } from './fixtures'

const pendente = () => new Promise<never>(() => {})
const falha = () => Promise.reject(new Error('Falha de rede'))

interface Pagina {
  nome: string
  ui: ReactNode
  loading: RegExp
  vazio: RegExp
  /** Configura os mocks para os três estados. */
  mock: (estado: 'loading' | 'vazio' | 'erro') => void
}

type Modulo = Record<string, unknown>

function resposta(estado: string, vazio: unknown) {
  if (estado === 'loading') return pendente
  return estado === 'erro' ? falha : () => Promise.resolve(vazio)
}

function mockGenerico(mod: Modulo, fn: string, estado: string, vazio: unknown) {
  vi.spyOn(mod as Record<string, (...args: unknown[]) => unknown>, fn).mockImplementation(
    resposta(estado, vazio),
  )
}

/** Endpoints secundários do detalhe: pendentes em loading, indisponíveis nos demais. */
function silenciarDetalhe(entrada: string) {
  const estado = entrada === 'loading' ? 'loading' : 'erro'
  mockGenerico(percentisApi, 'buscarPercentisAtleta', estado, undefined)
  mockGenerico(raioXApi, 'buscarRaioXConfronto', estado, undefined)
  mockGenerico(perfilRiscoApi, 'buscarPerfilRiscoAtleta', estado, undefined)
  mockGenerico(mpvApi, 'buscarMpvAtleta', estado, undefined)
}

const paginas: Pagina[] = [
  {
    nome: 'Tabela',
    ui: <Tabela />,
    loading: /carregando clubes/i,
    vazio: /nenhum clube/i,
    mock: (e) => mockGenerico(clubesApi, 'listarClubes', e, []),
  },
  {
    nome: 'Jogadores',
    ui: <Jogadores />,
    loading: /carregando jogadores/i,
    vazio: /nenhum jogador encontrado/i,
    mock: (e) => mockGenerico(atletasApi, 'listarTodosAtletas', e, []),
  },
  {
    nome: 'MatrizCapitao',
    ui: <MatrizCapitao />,
    loading: /calculando candidatos/i,
    vazio: /nenhum candidato a capitão/i,
    mock: (e) => mockGenerico(otimizadorApi, 'buscarMatrizCapitao', e, []),
  },
  {
    nome: 'AlertasMercado',
    ui: <AlertasMercado />,
    loading: /verificando mudanças/i,
    vazio: /nenhuma mudança de status/i,
    mock: (e) => mockGenerico(mercadoApi, 'buscarStatusAlterados', e, []),
  },
  {
    nome: 'Patrimonio',
    ui: <Patrimonio />,
    loading: /carregando curva/i,
    vazio: /nenhum histórico de valorização/i,
    mock: (e) => {
      // AtletaAutocomplete carrega o catálogo ao montar — sem rede real (RNF02)
      vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([atletaMock])
      mockGenerico(mpvApi, 'buscarCurvaValorizacao', e, [])
    },
  },
  {
    nome: 'DetalheJogador',
    ui: (
      <Routes>
        <Route path="/jogadores/:id" element={<DetalheJogador />} />
      </Routes>
    ),
    loading: /carregando jogador/i,
    vazio: /sem histórico disponível/i,
    mock: (e) => {
      silenciarDetalhe(e)
      mockGenerico(atletasApi, 'buscarAtleta', e, atletaMock)
      mockGenerico(atletasApi, 'buscarHistoricoAtleta', e, [])
    },
  },
]

function renderizar(ui: ReactNode) {
  return render(<MemoryRouter initialEntries={['/jogadores/1']}>{ui}</MemoryRouter>)
}

describe('estados de UI por página (issue #7, RF05)', () => {
  describe.each(paginas)('$nome', (pagina) => {
    it('loading: anuncia o carregamento com role="status"', () => {
      pagina.mock('loading')
      renderizar(pagina.ui)

      expect(screen.getByRole('status')).toHaveTextContent(pagina.loading)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('vazio: exibe mensagem legível, sem alerta de erro', async () => {
      pagina.mock('vazio')
      renderizar(pagina.ui)

      expect(await screen.findByText(pagina.vazio)).toBeVisible()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.queryByText(pagina.loading)).not.toBeInTheDocument()
    })

    it('erro: exibe a mensagem em role="alert"', async () => {
      pagina.mock('erro')
      renderizar(pagina.ui)

      expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede')
      expect(screen.queryByText(pagina.loading)).not.toBeInTheDocument()
    })
  })
})
