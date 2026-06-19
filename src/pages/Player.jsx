import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCachedSongs } from '../services/cache'
import { transposeContent, getSemitonesDifference, getAllKeys, getNoteFromSemitones } from '../utils/transposer'

const SECTION_KEYWORDS = ['intro', 'verso', 'refrão', 'refrao', 'ponte', 'bridge', 'final', 'outro', 'pré-refrão', 'pre-refrao', 'interlúdio', 'interludio', 'coro']

export default function Player() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState('C')
  const [originalKey, setOriginalKey] = useState('C')
  const [originalCapo, setOriginalCapo] = useState(0)
  const [capo, setCapo] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [sections, setSections] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  
  const [showKeyDropdown, setShowKeyDropdown] = useState(false)
  const [showCapoDropdown, setShowCapoDropdown] = useState(false)
  
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(30)
  const scrollSpeedRef = useRef(scrollSpeed)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(null)

  const [ledOn, setLedOn] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed
  }, [scrollSpeed])

  useEffect(() => {
    if (!song?.bpm || song.bpm <= 0) return
    const interval = (60 / song.bpm) * 1000
    const timer = setInterval(() => setLedOn(v => !v), interval)
    return () => clearInterval(timer)
  }, [song?.bpm])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      setShowKeyDropdown(false)
      setShowCapoDropdown(false)
    }
    if (showKeyDropdown || showCapoDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showKeyDropdown, showCapoDropdown])

  useEffect(() => {
    fetchSong()
    return () => stopAutoScroll()
  }, [id])

  const fetchSong = async () => {
    try {
      const { data, error } = await supabase.from('songs').select('*').eq('id', id).single()
      
      if (error) {
        console.log(' Buscando música no cache (offline)...')
        const cachedSongs = await getCachedSongs()
        const cachedSong = cachedSongs.find(s => s.id === id)
        
        if (cachedSong) {
          setSong(cachedSong)
          const origKey = cachedSong.original_key || 'C'
          setOriginalKey(origKey)
          setOriginalCapo(cachedSong.original_capo || 0)
          setSelectedKey(origKey)
          setCapo(cachedSong.original_capo || 0)
          setSections(detectSections(cachedSong.content))
        } else {
          alert('Música não encontrada. Conecte-se à internet para sincronizar.')
          navigate('/')
        }
      } else {
        setSong(data)
        const origKey = data.original_key || 'C'
        setOriginalKey(origKey)
        setOriginalCapo(data.original_capo || 0)
        setSelectedKey(origKey)
        setCapo(data.original_capo || 0)
        setSections(detectSections(data.content))
      }
    } catch (err) {
      console.error('Erro:', err)
      navigate('/')
    }
    setLoading(false)
  }

  const detectSections = (content) => {
    if (!content) return []
    const lines = content.split('\n')
    const foundSections = []
    lines.forEach((line, index) => {
      const trimmed = line.trim().toLowerCase()
      const isSection = SECTION_KEYWORDS.some(keyword => 
        trimmed === keyword || 
        trimmed.startsWith(keyword + ':') || 
        trimmed.startsWith(keyword + ' ') ||
        trimmed === `(${keyword})` ||
        trimmed.startsWith(`(${keyword}`)
      )
      if (isSection) {
        foundSections.push({ name: line.trim(), lineIndex: index, id: `section-${index}` })
      }
    })
    return foundSections
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta cifra?')) return
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) alert('Erro ao deletar')
    else navigate('/')
  }

  const handleEdit = () => navigate(`/editor/${id}`)

  // Calcula o tom efetivo baseado no capo
  const effectiveKey = getNoteFromSemitones(originalKey, capo)
  
  // Semitons para transposição (considera o capo)
  const semitones = getSemitonesDifference(effectiveKey, selectedKey)

  const startAutoScroll = () => {
    setAutoScroll(true)
    lastTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(scrollStep)
  }

  const stopAutoScroll = () => {
    setAutoScroll(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const scrollStep = (time) => {
    if (!lastTimeRef.current) lastTimeRef.current = time
    const deltaTime = (time - lastTimeRef.current) / 1000
    lastTimeRef.current = time
    
    const scrollAmount = scrollSpeedRef.current * deltaTime
    window.scrollBy(0, scrollAmount)
    
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
      stopAutoScroll()
      return
    }
    
    animationRef.current = requestAnimationFrame(scrollStep)
  }

  const scrollToSection = (section) => {
    setActiveSection(section.id)
    const element = document.getElementById(section.id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-accent text-xl">Carregando...</div></div>
  if (!song) return null

  const transposedContent = transposeContent(song.content, semitones)

  const renderContent = () => {
    const lines = transposedContent.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trim()
      const isSectionHeader = sections.some(s => s.lineIndex === i)
      const hasBrackets = line.includes('[') && line.includes(']')
      
      if (hasBrackets) {
        return (
          <div key={i} className="font-mono leading-loose whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
            {line.split(/(\[.+?\])/g).map((part, j) =>
              part.startsWith('[') ? (
                <span key={j} className="text-accent font-bold bg-accent/10 px-2 py-1 rounded">
                  {part.replace(/[\[\]]/g, '')}
                </span>
              ) : (
                <span key={j} className="text-text">{part}</span>
              )
            )}
          </div>
        )
      }
      
      if (isSectionHeader) {
        return (
          <div key={i} id={`section-${i}`} className="mt-6 mb-2 scroll-mt-32">
            <div className="inline-block bg-accent/20 border border-accent/50 text-accent font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wide">
              {trimmed}
            </div>
          </div>
        )
      }
      
      return (
        <div key={i} className="font-mono leading-loose whitespace-pre-wrap text-text" style={{ fontSize: `${fontSize}px` }}>
          {line}
        </div>
      )
    })
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-lg border-b border-border shadow-lg safe-top">
        <div className="px-2 py-2">
          <div className="max-w-5xl mx-auto flex items-center gap-1.5 flex-wrap justify-between">
            
            <div className="flex items-center gap-1.5">
              <Link to="/" className="w-9 h-9 bg-surface2 hover:bg-surface border border-border text-text rounded-lg transition-colors text-sm flex items-center justify-center flex-shrink-0">
                ←
              </Link>
              
              <div className="flex items-center bg-surface2 rounded-lg border border-border overflow-hidden">
                <button 
                  onClick={() => setFontSize(s => Math.max(12, s - 2))} 
                  className="w-9 h-9 hover:bg-accent/20 text-text transition-colors text-sm font-bold flex items-center justify-center"
                >
                  A-
                </button>
                <div className="w-px h-5 bg-border"></div>
                <button 
                  onClick={() => setFontSize(s => Math.min(32, s + 2))} 
                  className="w-9 h-9 hover:bg-accent/20 text-text transition-colors text-sm font-bold flex items-center justify-center"
                >
                  A+
                </button>
              </div>

              <span className="text-xs font-mono text-muted px-1 hidden sm:inline">
                {fontSize}px
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowKeyDropdown(!showKeyDropdown)
                    setShowCapoDropdown(false)
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    selectedKey === effectiveKey
                      ? 'bg-accent text-white'
                      : 'bg-surface2 text-accent border border-accent/40'
                  }`}
                >
                  <span>🎼</span>
                  <span>{selectedKey}</span>
                  <span className="text-[10px]">▼</span>
                </button>
                
                {showKeyDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-50 p-2 min-w-[240px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs text-muted mb-2 px-1">Tom da música</div>
                    <div className="grid grid-cols-6 gap-1">
                      {getAllKeys().map(key => (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedKey(key)
                            setShowKeyDropdown(false)
                          }}
                          className={`w-9 h-9 rounded-lg font-mono font-bold text-xs transition-all ${
                            selectedKey === key
                              ? 'bg-accent text-white shadow-md shadow-accent/30'
                              : 'bg-surface2 text-text border border-border hover:border-accent/50'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCapoDropdown(!showCapoDropdown)
                    setShowKeyDropdown(false)
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    capo === 0
                      ? 'bg-surface2 text-accent2 border border-accent2/40'
                      : 'bg-accent2 text-white'
                  }`}
                >
                  <span>🎸</span>
                  <span>{capo === 0 ? 'Off' : `${capo}ª`}</span>
                  <span className="text-[10px]">▼</span>
                </button>
                
                {showCapoDropdown && (
                  <div 
                    className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-50 p-2 min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs text-muted mb-2 px-1">Capotraste</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                        <button
                          key={n}
                          onClick={() => {
                            setCapo(n)
                            // Quando muda o capo, atualiza o tom selecionado para o novo tom efetivo
                            const newEffectiveKey = getNoteFromSemitones(originalKey, n)
                            setSelectedKey(newEffectiveKey)
                            setShowCapoDropdown(false)
                          }}
                          className={`h-10 rounded-lg font-mono font-bold text-sm transition-all ${
                            capo === n
                              ? 'bg-accent2 text-white shadow-md shadow-accent2/30'
                              : 'bg-surface2 text-text border border-border hover:border-accent2/50'
                          }`}
                        >
                          {n === 0 ? 'Off' : n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-surface2 rounded-lg px-1.5 py-1">
              {!autoScroll ? (
                <button
                  onClick={startAutoScroll}
                  className="flex items-center gap-1 bg-accent hover:bg-accent/90 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <span>▶</span>
                </button>
              ) : (
                <button
                  onClick={stopAutoScroll}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <span>⏸</span>
                </button>
              )}
              
              <div className="w-px h-5 bg-border"></div>

              <div className="flex items-center gap-1.5 px-1">
                <div
                  className="w-2.5 h-2.5 rounded-full transition-all duration-75"
                  style={{
                    backgroundColor: ledOn ? '#8b5cf6' : '#2a2a3a',
                    boxShadow: ledOn ? '0 0 8px #8b5cf6, 0 0 16px #8b5cf6' : 'none',
                  }}
                />
                <span className="text-[10px] font-mono text-muted">
                  <span className="text-text font-bold">{song.bpm}</span>
                </span>
              </div>

              <div className="w-px h-5 bg-border"></div>

              <div className="hidden sm:flex items-center gap-1">
                <span className="text-[10px]"></span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={scrollSpeed}
                  onChange={e => setScrollSpeed(parseInt(e.target.value))}
                  className="w-16 accent-accent"
                />
                <span className="text-[10px]">🐇</span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button 
                onClick={handleEdit} 
                className="w-9 h-9 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors text-sm flex items-center justify-center"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete} 
                className="w-9 h-9 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg transition-colors text-sm flex items-center justify-center"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div className="sm:hidden px-2 pb-2">
          <div className="max-w-5xl mx-auto flex items-center gap-2 bg-surface2 rounded-lg px-3 py-1.5">
            <span className="text-[10px]">🐢</span>
            <span className="text-[10px] text-muted">Vel:</span>
            <input
              type="range"
              min="10"
              max="100"
              value={scrollSpeed}
              onChange={e => setScrollSpeed(parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-[10px] font-mono text-text w-5">{scrollSpeed}</span>
            <span className="text-[10px]">🐇</span>
          </div>
        </div>

        {/* BARRA DE SEÇÕES - SEMPRE VISÍVEL SE HOUVER SEÇÕES */}
        {sections.length > 0 && (
          <div className="border-t border-border bg-bg/80 px-2 py-2">
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-1.5 overflow-x-auto pb-1 justify-start flex-nowrap">
                {sections.map((section, idx) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-accent to-accent2 text-white shadow-lg shadow-accent/30 scale-105'
                        : idx % 2 === 0
                          ? 'bg-surface2/80 text-accent border border-accent/30 hover:border-accent/60 hover:bg-accent/10'
                          : 'bg-surface2/80 text-accent2 border border-accent2/30 hover:border-accent2/60 hover:bg-accent2/10'
                    }`}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div 
        className="min-h-screen p-4 md:p-6 pb-10"
        style={{ 
          paddingTop: sections.length > 0 ? 'calc(env(safe-area-inset-top) + 160px)' : 'calc(env(safe-area-inset-top) + 80px)' 
        }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          
          {!isOnline && (
            <div className="bg-orange-600/10 border border-orange-600/30 rounded-xl p-3 text-orange-400 text-sm flex items-center gap-2">
              <span></span>
              <span>Modo offline - Usando dados salvos</span>
            </div>
          )}

          <div className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold text-text truncate">{song.title}</h1>
              <span className="text-sm text-muted truncate hidden sm:inline">• {song.artist}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
              <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">{song.bpm} BPM</span>
              <span className="text-xs font-mono bg-surface2 text-muted px-2 py-0.5 rounded-full">
                Tom: {selectedKey}
                {semitones !== 0 ? ` (${semitones > 0 ? '+' : ''}${semitones})` : ''}
              </span>
              {capo > 0 && (
                <span className="text-xs font-mono bg-accent2/10 text-accent2 px-2 py-0.5 rounded-full">
                  Capo {capo}ª (efetivo: {effectiveKey})
                </span>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
            {renderContent()}
          </div>

        </div>
      </div>
    </>
  )
}