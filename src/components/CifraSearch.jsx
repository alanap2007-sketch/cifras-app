import { useState } from 'react'

export default function CifraSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setResults(data.results)
      } else {
        setError('Nenhuma cifra encontrada. Tente outro termo.')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao buscar. Tente novamente.')
    }

    setLoading(false)
  }

  const fetchCifra = async (url) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/cifra?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.content && data.content.length > 50) {
        onSelect(data)
      } else {
        setError('Não foi possível extrair a cifra. Tente outra.')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar cifra.')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar (ex: Quem é Esse Julliany Souza)"
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 text-text focus:border-accent outline-none text-base"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-3 bg-accent hover:bg-accent/90 disabled:bg-border text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? '' : '🔍'}
        </button>
      </div>

      {error && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border bg-surface2">
            <h3 className="font-semibold text-text">📋 Resultados:</h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {results.map((result, idx) => (
              <button
                key={idx}
                onClick={() => fetchCifra(result.url)}
                disabled={loading}
                className="w-full text-left p-4 hover:bg-surface2 transition-colors flex items-start gap-3 disabled:opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text truncate">{result.title}</div>
                  <div className="text-sm text-muted truncate">{result.artist}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      {result.site}
                    </span>
                  </div>
                </div>
                <span className="text-accent text-xl">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}