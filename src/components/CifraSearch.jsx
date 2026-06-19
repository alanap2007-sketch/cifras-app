import { useState } from 'react'

export default function CifraSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManualPaste, setShowManualPaste] = useState(false)
  const [manualText, setManualText] = useState('')

  // Busca usando API do Vagalume (funciona!)
  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])
    setShowManualPaste(false)

    try {
      // API do Vagalume - funciona sem CORS issues
      const response = await fetch(
        `https://api.vagalume.com.br/search.php?q=${encodeURIComponent(query)}`
      )
      const data = await response.json()

      if ((data.type === 'exact' || data.type === 'aprox') && data.art) {
        const songs = []
        
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

        if (songs.length > 0) {
          setResults(songs.slice(0, 10))
        } else {
          setError('Nenhuma música encontrada.')
          setShowManualPaste(true)
        }
      } else {
        setError('Nenhuma música encontrada. Tente buscar de outra forma.')
        setShowManualPaste(true)
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao buscar. Usando modo manual.')
      setShowManualPaste(true)
    }

    setLoading(false)
  }

  // Busca a cifra completa (pode falhar, mas tenta)
  const fetchFullSong = async (song) => {
    setLoading(true)
    setError('')
    
    try {
      // Tenta buscar no Letras.mus.br
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://www.letras.mus.br/${song.artist_id}/${song.id}/`
      )}`
      
      const response = await fetch(proxyUrl, { timeout: 5000 })
      const data = await response.json()
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(data.contents, 'text/html')
      
      // Extrai letra/cifra
      const lyricsDiv = doc.querySelector('.cnt, .letra, #letra_cifra')
      let content = ''
      
      if (lyricsDiv) {
        content = extractChordsFromHtml(lyricsDiv.innerHTML)
      }

      if (content && content.length > 50) {
        onSelect({
          title: song.title,
          artist: song.artist,
          content: content,
          original_key: 'C',
          original_capo: 0,
          original_bpm: 120
        })
      } else {
        // Retorna com dados básicos
        onSelect({
          title: song.title,
          artist: song.artist,
          content: `// ${song.title}\n// ${song.artist}\n// Adicione os acordes manualmente\n\n`,
          original_key: 'C',
          original_capo: 0,
          original_bpm: 120
        })
      }
    } catch (err) {
      console.error('Erro ao buscar cifra:', err)
      // Mesmo com erro, retorna dados básicos
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

  const analyzeAndFill = (text) => {
    if (!text.trim()) return

    // Detecta Tom
    const keyMatch = text.match(/Tom:\s*([A-G][#b]?)/i)
    const detectedKey = keyMatch ? keyMatch[1] : 'C'

    // Detecta Capo
    const capoMatch = text.match(/capo.*?(\d+).*?casa/i)
    const detectedCapo = capoMatch ? parseInt(capoMatch[1]) : 0

    // Detecta BPM
    const bpmMatch = text.match(/(\d{2,3})\s*BPM/i)
    const detectedBpm = bpmMatch ? parseInt(bpmMatch[1]) : 120

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
        if (lines.length > 1) {
          detectedArtist = lines[1].trim()
        }
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
      original_bpm: detectedBpm
    })
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setManualText(text)
      analyzeAndFill(text)
      setShowManualPaste(true)
    } catch (err) {
      setShowManualPaste(true)
      setManualText('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Busca Online */}
      <div className="bg-gradient-to-r from-accent/10 to-accent2/10 border border-accent/30 rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-text flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <span>Buscar Online</span>
        </h3>
        
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

        {error && (
          <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-3 text-orange-400 text-sm">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border bg-surface2">
              <h3 className="font-semibold text-text">📋 Resultados:</h3>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
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
      </div>

      {/* Separador */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-xs text-muted">OU</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Paste Manual */}
      <div className="bg-gradient-to-r from-accent2/10 to-accent/10 border border-accent2/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span>Copiar e Colar (Recomendado)</span>
          </h3>
        </div>

        <div className="bg-surface2 rounded-lg p-3 text-xs text-muted">
          <p className="mb-2"><strong>Como fazer:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Abra o <strong className="text-accent2">Cifra Club</strong> no navegador</li>
            <li>Busque a música e copie tudo (Ctrl+A, Ctrl+C)</li>
            <li>Clique no botão abaixo ou cole no campo</li>
            <li>O sistema detecta TUDO automaticamente!</li>
          </ol>
        </div>

        <button
          onClick={handlePasteFromClipboard}
          className="w-full bg-accent2 hover:bg-accent2/90 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <span>📋</span>
          <span>Colar da Área de Transferência</span>
        </button>

        {!showManualPaste && (
          <button
            onClick={() => setShowManualPaste(true)}
            className="w-full bg-surface2 hover:bg-surface border border-border text-text font-semibold py-3 rounded-xl transition-colors"
          >
            Ou cole manualmente
          </button>
        )}

        {showManualPaste && (
          <div className="space-y-3">
            <textarea
              value={manualText}
              onChange={e => {
                setManualText(e.target.value)
                analyzeAndFill(e.target.value)
              }}
              placeholder="Cole aqui a cifra copiada..."
              className="w-full bg-surface border border-border rounded-xl p-4 font-mono text-sm text-text min-h-[200px] focus:border-accent2 outline-none resize-y"
              style={{ minHeight: '200px' }}
            />
            <p className="text-xs text-accent2">
              💡 Dica: O sistema detecta automaticamente tom, capotraste, BPM e formata os acordes!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}