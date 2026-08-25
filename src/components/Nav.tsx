import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '0.5rem 1rem',
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  color: isActive ? 'var(--accent-home)' : 'var(--text)',
  borderBottom: isActive ? '2px solid var(--accent-home)' : '2px solid transparent',
})

export default function Nav() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSair() {
    try {
      await logout()
    } catch {
      // segue mesmo se a chamada de logout falhar — nao trava o usuario na tela atual
    }
    navigate('/')
  }

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}
    >
      <NavLink to="/tabela" style={linkStyle}>
        Tabela
      </NavLink>
      <NavLink to="/jogadores" style={linkStyle}>
        Jogadores
      </NavLink>
      <NavLink to="/comparar" style={linkStyle}>
        Comparar
      </NavLink>
      <NavLink to="/patrimonio" style={linkStyle}>
        Patrimônio
      </NavLink>
      <NavLink to="/escalador" style={linkStyle}>
        Escalador
      </NavLink>
      <NavLink to="/capitaes" style={linkStyle}>
        Matriz de Capitão
      </NavLink>
      <NavLink to="/alertas" style={linkStyle}>
        Alertas
      </NavLink>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {usuario ? (
          <>
            <NavLink to="/conta" style={linkStyle}>
              {usuario.email}
            </NavLink>
            <button onClick={handleSair}>Sair</button>
          </>
        ) : (
          <NavLink to="/entrar" style={linkStyle}>
            Entrar
          </NavLink>
        )}
      </div>
    </nav>
  )
}
