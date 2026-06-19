import { useState } from 'react'

export default function CifraSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManualPaste, setShowManualPaste] = useState(false)

  // Busca usando API do Vagalume (gratuita e funciona!)
  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      // API do Vagalume - funciona sem CORS issues
      const response = await fetch(
        `https://api.vagalume.com.br/search.php?q=${encodeURIComponent(query)}`
      )
      const data = await response.json()

      if (data.type === 'exact' || data.type === 'aprox') {
        const songs = []
        
        if (data.art) {
          data.art.forEach(artist => {
            if (artist.mus) {
              artist.mus.forEach(music => {
                songs.push({
                  title: music.name,
                  artist: artist.name,
                  url: music.url,
                  id: music.id,
                  artist_id: artist.id
                })
              })
            }
          })
        }

        if (songs.length > 0) {
          setResults(songs.slice(0, 10))
        } else {
          setError('Nenhuma música encontrada. Tente outro termo de busca.')
        }
      } else {
        setError('Nenhuma música encontrada. Tente buscar com o nome exato.')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao buscar. Verifique sua conexão.')
      setShowManualPaste(true)
    }

    setLoading(false)
  }

  // Busca a cifra completa
  const fetchFullSong = async (song) => {
    setLoading(true)
    
    try {
      // Tenta buscar no Letras.mus.br via proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://www.letras.mus.br/${song.artist_id}/${song.id}/`
      )}`
      
      const response = await fetch(proxyUrl)
      const data = await response.json()
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(data.contents, 'text/html')
      
      // Extrai letra/cifra
      const lyricsDiv = doc.querySelector('.cnt, .letra, #letra_cifra')
      let content = ''
      
      if (lyricsDiv) {
        content = extractChordsFromHtml(lyricsDiv.innerHTML)
      }

      // Extrai informações adicionais
      const titleEl = doc.querySelector('h1')
      const artistEl = doc.querySelector('.artist')
      
      const title = titleEl ? titleEl.textContent.trim() : song.title
      const artist = artistEl ? artistEl.textContent.trim() : song.artist

      if (content && content.length > 50) {
        onSelect({
          title,
          artist,
          content,
          original_key: 'C',
          original_capo: 0,
          original_bpm: 120
        })
      } else {
        // Se não achou cifra, pelo menos preenche com os dados
        onSelect({
          title,
          artist,
          content: `// Letra de: ${title}\n// Artista: ${artist}\n// Adicione os acordes manualmente\n\n`,
          original_key: 'C',
          original_capo: 0,
          original_bpm: 120
        })
      }
    } catch (err) {
      console.error('Erro ao buscar cifra:', err)
      // Mesmo com erro, retorna os dados básicos
      onSelect({
        title: song.title,
        artist: song.artist,
        content: `// ${song.title}\n// ${song.artist}\n\n`,
        original_key: 'C',
        original_capo: 0,
        original_bpm: 120
      })
    }
    
    setLoading(false)
  }

  const extractChordsFromHtml = (html) => {
    let text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\t/g, '    ')
      .replace(/\n{3,}/g, '\n\n')
    
    const chordRegex = /\b([A-G][#b]?(?:m|maj|dim|aug|sus[24]?|7|maj7|m7|dim7|aug7)?\d*(?:\([^)]*\))?(?:\/[A-G][#b]?)?)\b/g
    
    text = text.replace(chordRegex, (match) => {
      if (match.length <= 6 && /^[A-G][#b]?/.test(match)) {
        return `[${match}]`
      }
      return match
    })
    
    return text.trim()
  }

  const handleManualPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setShowManualPaste(true)
      // Auto-preenche se tiver algo na clipboard
      if (text) {
        // Analisa automaticamente
        analyzeAndFill(text)
      }
    } catch (err) {
      setShowManualPaste(true)
    }
  }

  const analyzeAndFill = (text) => {
    // Detecta Tom
    const keyMatch = text.match(/Tom:\s*([A-G][#b]?)/i)
    const detectedKey = keyMatch ? keyMatch[1] : 'C'

    // Detecta Capo
    const capoMatch = text.match(/capo.*?(\d+).*?casa/i)
    const detectedCapo = capoMatch ? parseInt(capoMatch[1]) : 0

    // Detecta título/artista
    const lines = text.split('\n').filter(l => l.trim())
    let detectedTitle = ''
    let detectedArtist = ''
    
    if (lines.length > 0) {
      const firstLine = lines[0].trim()
      if (firstLine.includes(' - ')) {
        const parts = firstLine.split(' - ')
        detectedArtist = parts[0].trim()
        detectedTitle = parts[1]?.trim() || parts[0].trim()
      } else {
        detectedTitle = firstLine
      }
    }

    // Formata acordes
    let formattedContent = text.replace(
      /\b([A-G][#b]?(?:m|maj|dim|aug|sus[24]?|7|maj7|m7|dim7|aug7)?\d*(?:\([^)]*\))?(?:\/[A-G][#b]?)?)\b/g,
      (match) => {
        if (match.length <= 6 && /^[A-G][#b]?/.test(match)) {
          return `[${match}]`
        }
        return match
      }
    )

    onSelect({
      title: detectedTitle || query,
      artist: detectedArtist || '',
      content: formattedContent,
      original_key: detectedKey,
      original_capo: detectedCapo,
      original_bpm: 120
    })
  }

  return (
    <div className="space-y-3">
      {/* Busca */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar música (ex: Quem é Esse)"
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 text-text focus:border-accent outline-none text-base"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-3 bg-accent hover:bg-accent/90 disabled:bg-border text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-orange-600/10 border border-orange-600/30 rounded-xl p-4 text-orange-400 text-sm">
          {error}
          <button
            onClick={handleManualPaste}
            className="mt-2 text-accent hover:underline"
          >
            → Colar cifra manualmente
          </button>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border bg-surface2">
            <h3 className="font-semibold text-text">📋 Resultados:</h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {results.map((song, idx) => (
              <button
                key={idx}
                onClick={() => fetchFullSong(song)}
                disabled={loading}
                className="w-full text-left p-4 hover:bg-surface2 transition-colors flex items-start gap-3 disabled:opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text truncate">{song.title}</div>
                  <div className="text-sm text-muted truncate">{song.artist}</div>
                </div>
                <span className="text-accent text-xl">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão paste manual */}
      {!showManualPaste && (
        <button
          onClick={handleManualPaste}
          className="w-full bg-surface2 hover:bg-surface border border-border text-text font-semibold py-3 rounded-xl transition-colors"
        >
          📋 Ou cole a cifra manualmente
        </button>
      )}

      {/* Área de paste manual */}
      {showManualPaste && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text">📋 Cole a cifra aqui:</h3>
            <button
              onClick={() => setShowManualPaste(false)}
              className="text-muted hover:text-text"
            >
              ✕
            </button>
          </div>
          <textarea
            onChange={e => analyzeAndFill(e.target.value)}
            placeholder="Cole aqui a cifra copiada do Cifra Club, Letras, etc..."
            className="w-full bg-surface2 border border-border rounded-xl p-4 font-mono text-sm text-text min-h-[200px] focus:border-accent outline-none resize-y"
            style={{ minHeight: '200px' }}
          />
          <p className="text-xs text-muted">
            💡 Dica: Abra o Cifra Club, copie tudo (Ctrl+A, Ctrl+C) e cole aqui. 
            O sistema detecta automaticamente tom, capotraste e formata os acordes!
          </p>
        </div>
      )}
    </div>
  )
}