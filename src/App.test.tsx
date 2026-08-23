import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    )
    expect(screen.getByText('Cartola Insights')).toBeInTheDocument()
  })
})
