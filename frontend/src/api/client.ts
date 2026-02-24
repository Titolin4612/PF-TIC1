const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export type Health = {
  status: string
  timestamp: string
}

export async function getHealth(): Promise<Health> {
  const response = await fetch(`${API_URL}/api/health`)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `API responded with ${response.status}`)
  }

  return response.json()
}
