import { apiDelete, apiGet, apiPost } from './client'

export type Papel = 'admin' | 'usuario'

export interface Usuario {
  id: number
  email: string
  role: Papel
}

export interface ApiToken {
  id: number
  criado_em: string
  revogado_em: string | null
}

export interface ApiTokenCriado {
  id: number
  token: string
}

export function registrar(email: string, senha: string): Promise<Usuario> {
  return apiPost<Usuario>('/contas/registro', { email, senha })
}

export function login(email: string, senha: string): Promise<Usuario> {
  return apiPost<Usuario>('/contas/login', { email, senha })
}

export function logout(): Promise<void> {
  return apiPost<void>('/contas/logout')
}

export function obterUsuarioAtual(): Promise<Usuario> {
  return apiGet<Usuario>('/contas/me')
}

export function gerarToken(): Promise<ApiTokenCriado> {
  return apiPost<ApiTokenCriado>('/contas/tokens')
}

export function listarTokens(): Promise<ApiToken[]> {
  return apiGet<ApiToken[]>('/contas/tokens')
}

export function revogarToken(id: number): Promise<void> {
  return apiDelete(`/contas/tokens/${id}`)
}
