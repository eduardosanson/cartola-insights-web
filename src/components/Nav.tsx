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
    await logout()
    navigate('/')
  }

  return (
    <nav
      style={{
        display: 'flex',
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
