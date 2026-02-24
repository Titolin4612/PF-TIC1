import { useEffect, useMemo, useState } from 'react'

import { getHealth, type Health } from './api/client'
import './styles/app.css'

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const backendUrl = useMemo(
    () => import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
    [],
  )

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealth(data)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setHealth(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Stack ready</p>
          <h1>React + Vite front · Spring Boot back</h1>
          <p className="lede">
            Usa este esqueleto para iterar rápido: API REST en <code>/api</code>,
            front opinado pero mínimo y configuración lista para CORS.
          </p>
          <div className="meta">
            <span>Backend:</span>
            <code>{backendUrl}</code>
          </div>
        </div>
      </header>

      <section className="card">
        <div className="card__header">
          <h2>Health check</h2>
          <span className="pill">/api/health</span>
        </div>
        {isLoading && <p className="muted">Consultando backend…</p>}
        {error && <p className="error">{error}</p>}
        {health && (
          <dl className="grid">
            <div>
              <dt>Estado</dt>
              <dd className="ok">{health.status}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{new Date(health.timestamp).toLocaleString()}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  )
}

export default App
