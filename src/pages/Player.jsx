import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCachedSongs } from '../services/cache'
import { transposeContent, getSemitonesDifference, getAllKeys, getNoteFromSemitones } from '../utils/transposer'

const SECTION_KEYWORDS = [
  'intro', 'verso', 'refrão', 'refrao', 'ponte', 'bridge', 'final', 'outro',
  'pré-refrão', 'pre-refrao', 'interlúdio', 'interludio', 'coro',
  'primeira parte', 'segunda parte', 'terceira parte', 'parte 1', 'parte 2', 'parte 3'
]

// Regex para acordes
// Regex CORRIGIDA - versões compostas ANTES das simples
// Regex CORRIGIDA
// Regex para acordes - CORRIGIDA
const CHORD_REGEX = /^[A-G][#b]?(?:maj7|m7|dim7|aug7|maj|min|dim|aug|sus[24]?|add[2469]|m|7)?(?:\([^)]*\))?(?:\/[A-G][#b]?)?\d*$/i

// Verifica se uma palavra é um acorde - CORRIGIDO
const isChord = (word) => {
  const clean = word.replace(/[\[\]\(\)]/g, '').trim()
  if (!clean) return false
  return CHORD_REGEX.test(clean)
}

// Verifica se uma linha é APENAS acordes - CORRIGIDO
const isChordLine = (line) => {
  let checkLine = line.trim()
  if (!checkLine) return false
  
  // Remove barras verticais | no final - CORRIGIDO
  checkLine = checkLine.replace(/\|+$/g, '').trim()
  
  // Remove parênteses externos
  if (checkLine.startsWith('(') && checkLine.endsWith(')')) {
    checkLine = checkLine.slice(1, -1).trim()
  }
  
  const parts = checkLine.split(/\s+/).filter(p => p !== '')
  if (parts.length === 0) return false
  
  return parts.every(part => isChord(part))
}

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
  const [showSettings, setShowSettings] = useState(false)
  
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(2)
  const scrollSpeedRef = useRef(scrollSpeed)
  const animationRef = useRef(null)

  const [beatCount, setBeatCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [menuVisible, setMenuVisible] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [autoFontSize, setAutoFontSize] = useState(true)

  const contentRef = useRef(null)

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed
  }, [scrollSpeed])

  useEffect(() => {
    if (!song?.bpm || song.bpm <= 0) return
    const beatInterval = (60 / song.bpm) * 1000
    let currentBeat = 0
    const timer = setInterval(() => {
      currentBeat = (currentBeat + 1) % 4
      setBeatCount(currentBeat)
    }, beatInterval)
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
      setShowSettings(false)
    }
    if (showKeyDropdown || showCapoDropdown || showSettings) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showKeyDropdown, showCapoDropdown, showSettings])

  useEffect(() => {
    fetchSong()
    return () => stopAutoScroll()
  }, [id])

  useEffect(() => {
    if (!autoFontSize) return
    const adjustFontSize = () => {
      const width = window.innerWidth
      if (width < 400) setFontSize(14)
      else if (width < 600) setFontSize(16)
      else if (width < 900) setFontSize(18)
      else if (width < 1200) setFontSize(20)
      else setFontSize(22)
    }
    adjustFontSize()
    window.addEventListener('resize', adjustFontSize)
    return () => window.removeEventListener('resize', adjustFontSize)
  }, [autoFontSize])

  const fetchSong = async () => {
    try {
      const { data, error } = await supabase.from('songs').select('*').eq('id', id).single()
      if (error) {
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
          alert('Música não encontrada.')
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
        trimmed.startsWith(`(${keyword}`) ||
        trimmed === `[${keyword}]` ||
        trimmed.startsWith(`[${keyword}]`)
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

  const effectiveKey = getNoteFromSemitones(originalKey, capo)
  const semitones = getSemitonesDifference(effectiveKey, selectedKey)

  const startAutoScroll = () => {
    setAutoScroll(true)
    animationRef.current = setInterval(() => {
      const pixelsPerSecond = 5 + (scrollSpeedRef.current * 2)
      const scrollAmount = pixelsPerSecond / 10
      window.scrollBy(0, scrollAmount)
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        stopAutoScroll()
      }
    }, 100)
  }

  const stopAutoScroll = () => {
    setAutoScroll(false)
    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }
  }

  const scrollToSection = (section) => {
    setActiveSection(section.id)
    const element = document.getElementById(section.id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleMenu = () => {
    setMenuVisible(!menuVisible)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-accent text-xl">Carregando...</div></div>
  if (!song) return null

  const transposedContent = transposeContent(song.content, semitones)

  const isLightTheme = theme === 'light'
  const bgColor = isLightTheme ? 'bg-white' : 'bg-bg'
  const textColor = isLightTheme ? 'text-gray-900' : 'text-text'
  const surfaceColor = isLightTheme ? 'bg-gray-100' : 'bg-surface'
  const surface2Color = isLightTheme ? 'bg-gray-200' : 'bg-surface2'
  const borderColor = isLightTheme ? 'border-gray-300' : 'border-border'
  const mutedColor = isLightTheme ? 'text-gray-600' : 'text-muted'

  const groupContentBySections = () => {
    const lines = transposedContent.split('\n')
    const groups = []
    let currentGroup = { type: 'intro', lines: [] }
    
    lines.forEach((line, i) => {
      const section = sections.find(s => s.lineIndex === i)
      if (section) {
        if (currentGroup.lines.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = { type: 'section', section: section, lines: [] }
      } else {
        currentGroup.lines.push({ text: line, index: i })
      }
    })
    if (currentGroup.lines.length > 0 || currentGroup.section) {
      groups.push(currentGroup)
    }
    return groups
  }

  const contentGroups = groupContentBySections()

  const renderLine = (line) => {
  // Linha vazia
  if (!line || line.trim() === '') {
    return <div style={{ height: `${fontSize * 0.4}px` }}></div>
  }
  
  let checkLine = line.trim()
  
  // Verifica se é linha de acordes
  if (isChordLine(checkLine)) {
    return (
      <div 
        className="font-mono font-bold" 
        style={{ 
          fontSize: `${fontSize}px`, 
          color: '#f97316',
          lineHeight: 1.3,
          marginBottom: '2px',
          whiteSpace: 'pre',
          fontFamily: 'monospace'
        }}
      >
        {line}
      </div>
    )
  }
  
  // Linha de letra com acordes entre colchetes - CORRIGIDO
  const hasInlineChords = /\[[^\]]+\]/.test(line)
  
  if (hasInlineChords) {
    const parts = line.split(/(\[[^\]]+\])/g).filter(p => p !== '')
    return (
      <div 
        className="font-mono" 
        style={{ 
          fontSize: `${fontSize}px`, 
          lineHeight: 1.4,
          whiteSpace: 'pre',
          fontFamily: 'monospace',
          color: isLightTheme ? '#1a1a1a' : undefined
        }}
      >
        {parts.map((part, i) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            return (
              <span key={i} style={{ color: '#f97316', fontWeight: 'bold' }}>
                {part.replace(/[\[\]]/g, '')}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
    )
  }

  // Linha de letra normal
  return (
    <div 
      className="font-mono" 
      style={{ 
        fontSize: `${fontSize}px`, 
        lineHeight: 1.4,
        whiteSpace: 'pre',
        fontFamily: 'monospace',
        color: isLightTheme ? '#1a1a1a' : undefined
      }}
    >
      {line}
    </div>
  )
}
  return (
    <>
      {/* BARRA 1 - Controles */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 ${isLightTheme ? 'bg-white/95' : 'bg-surface/95'} backdrop-blur-lg border-b ${borderColor} shadow-lg transition-all duration-300 ${
          menuVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-2 py-2">
          <div className="max-w-5xl mx-auto flex items-center gap-1.5 flex-wrap justify-between">
            
            <div className="flex items-center gap-1.5">
              <Link to="/" className={`w-9 h-9 ${surface2Color} hover:opacity-80 ${isLightTheme ? 'text-gray-900' : 'text-text'} border ${borderColor} rounded-lg transition-colors text-sm flex items-center justify-center flex-shrink-0`}>
                ←
              </Link>
              <div className={`flex items-center ${surface2Color} rounded-lg border ${borderColor} overflow-hidden`}>
                <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className={`w-9 h-9 hover:bg-accent/20 ${isLightTheme ? 'text-gray-900' : 'text-text'} transition-colors text-sm font-bold flex items-center justify-center`}>A-</button>
                <div className={`w-px h-5 ${isLightTheme ? 'bg-gray-400' : 'bg-border'}`}></div>
                <button onClick={() => setFontSize(s => Math.min(32, s + 2))} className={`w-9 h-9 hover:bg-accent/20 ${isLightTheme ? 'text-gray-900' : 'text-text'} transition-colors text-sm font-bold flex items-center justify-center`}>A+</button>
              </div>
              <span className={`text-xs font-mono ${mutedColor} px-1 hidden sm:inline`}>{fontSize}px</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowKeyDropdown(!showKeyDropdown); setShowCapoDropdown(false); setShowSettings(false) }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${selectedKey === effectiveKey ? 'bg-accent text-white' : `${surface2Color} ${isLightTheme ? 'text-gray-900' : 'text-accent'} border border-accent/40`}`}
                >
                  <span>🎼</span><span>{selectedKey}</span><span className="text-[10px]">▼</span>
                </button>
                {showKeyDropdown && (
                  <div className={`absolute top-full left-0 mt-2 ${surfaceColor} border ${borderColor} rounded-xl shadow-2xl z-50 p-2 min-w-[240px]`} onClick={(e) => e.stopPropagation()}>
                    <div className={`text-xs ${mutedColor} mb-2 px-1`}>Tom da música</div>
                    <div className="grid grid-cols-6 gap-1">
                      {getAllKeys().map(key => (
                        <button key={key} onClick={() => { setSelectedKey(key); setShowKeyDropdown(false) }} className={`w-9 h-9 rounded-lg font-mono font-bold text-xs transition-all ${selectedKey === key ? 'bg-accent text-white shadow-md shadow-accent/30' : `${surface2Color} ${isLightTheme ? 'text-gray-900' : 'text-text'} border ${borderColor} hover:border-accent/50`}`}>{key}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCapoDropdown(!showCapoDropdown); setShowKeyDropdown(false); setShowSettings(false) }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${capo === 0 ? `${surface2Color} ${isLightTheme ? 'text-gray-900' : 'text-accent2'} border border-accent2/40` : 'bg-accent2 text-white'}`}
                >
                  <span>🎸</span><span>{capo === 0 ? 'Off' : `${capo}ª`}</span><span className="text-[10px]">▼</span>
                </button>
                {showCapoDropdown && (
                  <div className={`absolute top-full right-0 mt-2 ${surfaceColor} border ${borderColor} rounded-xl shadow-2xl z-50 p-2 min-w-[200px]`} onClick={(e) => e.stopPropagation()}>
                    <div className={`text-xs ${mutedColor} mb-2 px-1`}>Capotraste</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                        <button key={n} onClick={() => { setCapo(n); setSelectedKey(getNoteFromSemitones(originalKey, n)); setShowCapoDropdown(false) }} className={`h-10 rounded-lg font-mono font-bold text-sm transition-all ${capo === n ? 'bg-accent2 text-white shadow-md shadow-accent2/30' : `${surface2Color} ${isLightTheme ? 'text-gray-900' : 'text-text'} border ${borderColor} hover:border-accent2/50`}`}>{n === 0 ? 'Off' : n}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-1.5 ${surface2Color} rounded-lg px-1.5 py-1`}>
              {!autoScroll ? (
                <button onClick={startAutoScroll} className="flex items-center gap-1 bg-accent hover:bg-accent/90 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"><span>▶</span></button>
              ) : (
                <button onClick={stopAutoScroll} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"><span></span></button>
              )}
              <div className={`w-px h-5 ${isLightTheme ? 'bg-gray-400' : 'bg-border'}`}></div>
              <button onClick={() => setScrollSpeed(s => Math.max(1, s - 1))} className={`w-7 h-7 ${isLightTheme ? 'bg-gray-300 hover:bg-gray-400 text-gray-900' : 'bg-surface hover:bg-accent/20 text-text'} rounded flex items-center justify-center text-xs font-bold`}>-</button>
              <span className={`text-[10px] font-mono ${isLightTheme ? 'text-gray-900' : 'text-text'} w-5 text-center`}>{scrollSpeed}</span>
              <button onClick={() => setScrollSpeed(s => Math.min(50, s + 1))} className={`w-7 h-7 ${isLightTheme ? 'bg-gray-300 hover:bg-gray-400 text-gray-900' : 'bg-surface hover:bg-accent/20 text-text'} rounded flex items-center justify-center text-xs font-bold`}>+</button>
              <div className={`w-px h-5 ${isLightTheme ? 'bg-gray-400' : 'bg-border'}`}></div>
              <div className="flex items-center gap-1.5 px-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(beat => (
                    <div key={beat} className="w-2 h-2 rounded-full transition-all duration-75" style={{ backgroundColor: beatCount === beat ? '#8b5cf6' : (isLightTheme ? '#d1d5db' : '#2a2a3a'), boxShadow: beatCount === beat ? '0 0 6px #8b5cf6' : 'none' }} />
                  ))}
                </div>
                <span className={`text-[10px] font-mono ${isLightTheme ? 'text-gray-900 font-bold' : 'text-muted'}`}>{song.bpm}</span>
              </div>
            </div>

            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowKeyDropdown(false); setShowCapoDropdown(false) }} className={`w-9 h-9 ${surface2Color} hover:opacity-80 ${isLightTheme ? 'text-gray-900' : 'text-text'} border ${borderColor} rounded-lg transition-colors text-sm flex items-center justify-center`}>⚙️</button>
              {showSettings && (
                <div className={`absolute top-full right-0 mt-2 ${surfaceColor} border ${borderColor} rounded-xl shadow-2xl z-50 p-3 min-w-[200px]`} onClick={(e) => e.stopPropagation()}>
                  <div className={`text-xs ${mutedColor} mb-3 font-semibold`}>⚙️ Configurações</div>
                  <div className="space-y-3">
                    <div>
                      <label className={`text-xs ${mutedColor} block mb-1`}>Tema</label>
                      <div className="flex gap-2">
                        <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-accent text-white' : `${surface2Color} ${isLightTheme ? 'text-gray-900' : 'text-text'} border ${borderColor}`}`}>🌙 Escuro</button>
                        <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${theme === 'light' ? 'bg-accent text-white' : `${surface2Color} ${isLightTheme ? 'text-gray-900' : 'text-text'} border ${borderColor}`}`}>☀️ Claro</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${mutedColor}`}>Auto tamanho</span>
                      <button onClick={() => setAutoFontSize(!autoFontSize)} className={`w-10 h-5 rounded-full transition-colors ${autoFontSize ? 'bg-accent' : `${surface2Color} border ${borderColor}`}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${autoFontSize ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-1.5">
              <button onClick={handleEdit} className="w-9 h-9 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors text-sm flex items-center justify-center">✏️</button>
              <button onClick={handleDelete} className="w-9 h-9 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg transition-colors text-sm flex items-center justify-center">🗑️</button>
            </div>
          </div>
        </div>
      </div>

    
      {/* BARRA 2 - Seções */}
{sections.length > 0 && (
  <div 
    className={`fixed left-0 right-0 z-40 ${isLightTheme ? 'bg-white/98' : 'bg-bg/98'} backdrop-blur-lg border-b ${borderColor} shadow-md`}
    style={{ 
      top: menuVisible ? 'calc(env(safe-area-inset-top) + 80px)' : 'env(safe-area-inset-top)',
      transition: 'top 0.3s ease'
    }}
  >
    <div className="px-2 py-2">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-1.5 overflow-x-auto justify-center flex-wrap">
          {sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-accent to-accent2 text-white shadow-lg shadow-accent/30 scale-105'
                  : isLightTheme
                    ? 'bg-white text-accent border border-accent/30 hover:border-accent/60 hover:bg-accent/10'
                    : 'bg-surface2/80 text-accent border border-accent/30 hover:border-accent/60 hover:bg-accent/10'
              }`}
            >
              {section.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

      {!menuVisible && (
        <button
          onClick={toggleMenu}
          className="fixed z-50 w-10 h-10 bg-accent/80 hover:bg-accent text-white rounded-full shadow-lg flex items-center justify-center transition-all"
          style={{ 
            top: 'calc(env(safe-area-inset-top) + 10px)',
            right: '10px'
          }}
        >
          ☰
        </button>
      )}

      <div 
  className={`min-h-screen pb-10 ${bgColor} transition-colors duration-300`}
  style={{ 
    paddingTop: sections.length > 0 
      ? (menuVisible ? 'calc(env(safe-area-inset-top) + 150px)' : 'calc(env(safe-area-inset-top) + 70px)')
      : (menuVisible ? 'calc(env(safe-area-inset-top) + 90px)' : 'env(safe-area-inset-top)')
  }}
  onClick={toggleMenu}
  ref={contentRef}
>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-4">
          
          {!isOnline && (
            <div className="bg-orange-600/10 border border-orange-600/30 rounded-xl p-3 text-orange-400 text-sm flex items-center gap-2">
              <span>📡</span><span>Modo offline - Usando dados salvos</span>
            </div>
          )}

          <div className={`${surfaceColor} border ${borderColor} rounded-xl p-3 flex items-center justify-between flex-wrap gap-2`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h1 className={`text-lg md:text-xl font-bold ${textColor} truncate`}>{song.title}</h1>
              <span className={`text-sm ${mutedColor} truncate hidden sm:inline`}>• {song.artist}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
              <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">{song.bpm} BPM</span>
              <span className={`text-xs font-mono ${surface2Color} ${mutedColor} px-2 py-0.5 rounded-full`}>
                Tom: {selectedKey}{semitones !== 0 ? ` (${semitones > 0 ? '+' : ''}${semitones})` : ''}
              </span>
              {capo > 0 && (
                <span className="text-xs font-mono bg-accent2/10 text-accent2 px-2 py-0.5 rounded-full">Capo {capo}ª (efetivo: {effectiveKey})</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {contentGroups.map((group, gIdx) => {
              if (group.type === 'section' && group.section) {
                return (
                  <div 
                    key={`group-${gIdx}`}
                    id={group.section.id}
                    className={`${surfaceColor} border ${borderColor} rounded-xl p-4 md:p-5 scroll-mt-32`}
                  >
                    {/* Título da seção - SEMPRE com o mesmo estilo */}
                    <div className="mb-3">
                      <span className="inline-block bg-accent/20 border border-accent/50 text-accent font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wide">
                        {group.section.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {group.lines.map((line, lIdx) => (
                        <div key={lIdx}>{renderLine(line.text)}</div>
                      ))}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div key={`group-${gIdx}`} className={`${surfaceColor} border ${borderColor} rounded-xl p-4 md:p-6 space-y-1`}>
                    {group.lines.map((line, lIdx) => (
                      <div key={lIdx}>{renderLine(line.text)}</div>
                    ))}
                  </div>
                )
              }
            })}
          </div>

        </div>
      </div>
    </>
  )
}