import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Nav from './components/Nav'
import Tabela from './pages/Tabela'
import Jogadores from './pages/Jogadores'
import DetalheJogador from './pages/DetalheJogador'

function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1rem' }}>
        <h1>Cartola Insights</h1>
        <Nav />
        <Routes>
          <Route path="/" element={<Navigate to="/tabela" replace />} />
          <Route path="/tabela" element={<Tabela />} />
          <Route path="/jogadores" element={<Jogadores />} />
          <Route path="/jogadores/:id" element={<DetalheJogador />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
