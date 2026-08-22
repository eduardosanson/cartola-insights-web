import { NavLink } from 'react-router-dom'

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '0.5rem 1rem',
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  color: isActive ? 'var(--accent-home)' : 'var(--text)',
  borderBottom: isActive ? '2px solid var(--accent-home)' : '2px solid transparent',
})

export default function Nav() {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '0.5rem',
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
    </nav>
  )
}
