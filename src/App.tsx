import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Nav from './components/Nav'
import RotaProtegida from './components/RotaProtegida'
import Tabela from './pages/Tabela'
import Jogadores from './pages/Jogadores'
import DetalheJogador from './pages/DetalheJogador'
import Login from './pages/Login'
import Registro from './pages/Registro'
import MinhaConta from './pages/MinhaConta'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1rem' }}>
          <h1>Cartola Insights</h1>
          <Nav />
          <Routes>
            <Route path="/" element={<Navigate to="/tabela" replace />} />
            <Route path="/tabela" element={<Tabela />} />
            <Route path="/jogadores" element={<Jogadores />} />
            <Route path="/jogadores/:id" element={<DetalheJogador />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/registrar" element={<Registro />} />
            <Route
              path="/conta"
              element={
                <RotaProtegida>
                  <MinhaConta />
                </RotaProtegida>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
