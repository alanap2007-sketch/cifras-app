import os

# Home.jsx - Com fundo.jpg e logo maior
home_code = r"""import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  cacheSongs,
  getCachedSongs,
  cacheSetlists,
  getCachedSetlists,
  getLastSync
} from '../services/cache'
import SongRow from '../components/SongRow'
import SetlistCard from '../components/SetlistCard'
import CreateSetlistModal from '../components/CreateSetlistModal'

export default function Home() {
  const [songs, setSongs] = useState([])
  const [setlists, setSetlists] = useState([])
  const [filteredSongs, setFilteredSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('songs')
  const [showCreateSetlist, setShowCreateSetlist] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    fetchData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    if (navigator.onLine) {
      try {
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (songsError) throw songsError
        
        if (songsData) {
          setSongs(songsData)
          setFilteredSongs(songsData)
          await cacheSongs(songsData)
        }

        const { data: setlistsData, error: setlistsError } = await supabase
          .from('setlists')
          .select(`
            *,
            setlist_songs (
              id,
              position,
              songs (id, title, artist, original_key, bpm)
            )
          `)
          .order('created_at', { ascending: false })
        
        if (setlistsError) throw setlistsError
        
        if (setlistsData) {
          setSetlists(setlistsData)
          await cacheSetlists(setlistsData)
        }

        const now = new Date()
        setLastSync(now)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        await loadFromCache()
      }
    } else {
      await loadFromCache()
    }

    setLoading(false)
  }

  const loadFromCache = async () => {
    const cachedSongs = await getCachedSongs()
    const cachedSetlists = await getCachedSetlists()
    const lastSyncTime = await getLastSync()
    if (cachedSongs.length > 0) {
      setSongs(cachedSongs)
      setFilteredSongs(cachedSongs)
    }

    if (cachedSetlists.length > 0) {
      setSetlists(cachedSetlists)
    }

    if (lastSyncTime) {
      setLastSync(lastSyncTime)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredSongs(songs)
      return
    }
    const filtered = songs.filter(song =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredSongs(filtered)
  }

  const formatLastSync = (date) => {
    if (!date) return 'Nunca'
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-purple-400 text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-bg" style={{ overflow: 'hidden' }}>
      {/* Header com fundo.jpg */}
      <header 
        className="flex-shrink-0 border-b border-gray-800 shadow-lg z-20" 
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          backgroundImage: 'url(/fundo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="px-4 py-3 bg-black/60 backdrop-blur-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/icon2.png" alt="CifraBox" className="w-16 h-16 md:w-20 md:h-20" />
              <h1 className="text-3xl md:text-4xl font-bold text-purple-400">
                CifraBox
              </h1>
            </div>
            <Link
              to="/editor"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm flex-shrink-0"
            >
              <span>✏️</span> Nova Cifra
            </Link>
          </div>
        </div>
        
        {/* Status e busca */}
        <div className="px-4 pb-3 bg-black/40 backdrop-blur-lg">
          <div className="max-w-5xl mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isOnline 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-orange-600/20 text-orange-400'
              }`}>
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
              {lastSync && (
                <span className="text-xs text-gray-300">
                  Sync: {formatLastSync(lastSync)}
                </span>
              )}
            </div>

            {!isOnline && (
              <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-2 text-orange-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>Você está offline. Usando dados salvos.</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="🔍 Buscar músicas..."
                className="w-full bg-gray-900/90 border border-gray-700 rounded-xl px-4 py-2.5 pl-10 text-white focus:border-purple-500 outline-none text-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 border-t border-gray-700 bg-black/40 backdrop-blur-lg">
          <div className="max-w-5xl mx-auto flex gap-2">
            <button
              onClick={() => setActiveTab('songs')}
              className={`px-4 py-2.5 font-semibold text-sm transition-colors relative ${
                activeTab === 'songs' ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              🎵 Músicas ({songs.length})
              {activeTab === 'songs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>}
            </button>
            <button
              onClick={() => setActiveTab('setlists')}
              className={`px-4 py-2.5 font-semibold text-sm transition-colors relative ${
                activeTab === 'setlists' ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              📋 Setlists ({setlists.length})
              {activeTab === 'setlists' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo com scroll */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-5xl mx-auto p-4 space-y-4">
          {activeTab === 'songs' ? (
            <div className="space-y-2">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg mb-4">Nenhuma música encontrada</p>
                  <Link to="/editor" className="inline-block text-purple-400 hover:underline">
                    Criar primeira cifra →
                  </Link>
                </div>
              ) : (
                filteredSongs.map(song => (
                  <SongRow key={song.id} song={song} />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowCreateSetlist(true)}
                className="w-full bg-gradient-to-r from-purple-600/10 to-orange-500/10 border-2 border-dashed border-purple-500/40 hover:border-purple-500/70 rounded-xl p-4 text-purple-400 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>Criar novo Setlist</span>
              </button>

              {setlists.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">Nenhum setlist criado ainda</p>
                  <p className="text-sm text-gray-500 mt-2">Crie um setlist para organizar os louvores do culto</p>
                </div>
              ) : (
                setlists.map(setlist => (
                  <SetlistCard
                    key={setlist.id}
                    setlist={setlist}
                    onAdded={fetchData}
                    onDeleted={fetchData}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {showCreateSetlist && (
        <CreateSetlistModal
          onClose={() => setShowCreateSetlist(false)}
          onCreated={() => {
            setShowCreateSetlist(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}"""

# SetlistCard.jsx - CORREÇÃO DA NAVEGAÇÃO COM navigate()
setlist_code = r"""import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AddToSetlistModal from './AddToSetlistModal'

export default function SetlistCard({ setlist, onAdded, onDeleted }) {
  const navigate = useNavigate()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useState(() => {
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
  })

  const sortedSongs = [...(setlist.setlist_songs || [])].sort((a, b) => a.position - b.position)

  const handleDelete = async () => {
    const { error } = await supabase.from('setlists').delete().eq('id', setlist.id)
    if (error) alert('Erro ao deletar')
    else onDeleted()
  }

  const handleRemoveSong = async (setlistSongId) => {
    const { error } = await supabase.from('setlist_songs').delete().eq('id', setlistSongId)
    if (error) alert('Erro ao remover')
    else onAdded()
  }

  const handleMoveSong = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= sortedSongs.length) return
    const newOrder = [...sortedSongs]
    const [movedItem] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, movedItem)

    try {
      for (let i = 0; i < newOrder.length; i++) {
        const item = newOrder[i]
        const newPosition = i + 1
        
        const { error } = await supabase
          .from('setlist_songs')
          .update({ position: newPosition })
          .eq('id', item.id)
        
        if (error) {
          alert('Erro ao reordenar: ' + error.message)
          return
        }
      }
      
      onAdded()
    } catch (err) {
      alert('Erro: ' + err.message)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  const handleSongClick = (songId, e) => {
    e.stopPropagation()
    navigate('/player/' + songId, { state: { from: 'setlist' } })
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div
        className="p-4 border-b border-border flex items-center justify-between gap-3 cursor-pointer hover:bg-surface2/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text text-lg truncate">{setlist.name}</h3>
          {setlist.description && (
            <p className="text-sm text-muted truncate">{setlist.description}</p>
          )}
          {setlist.event_date && (
            <p className="text-xs text-accent2 mt-1">📅 {formatDate(setlist.event_date)}</p>
          )}
          <p className="text-xs text-muted mt-1">
            {sortedSongs.length} música{sortedSongs.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="w-10 h-10 bg-surface2 hover:bg-accent/20 text-text rounded-lg transition-colors flex items-center justify-center"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowAddModal(true)
            }}
            className="px-3 py-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Música
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowConfirmDelete(!showConfirmDelete)
            }}
            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 text-xs rounded-lg transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      {showConfirmDelete && (
        <div className="px-4 py-3 bg-red-600/10 border-b border-red-600/30 flex items-center justify-between gap-2">
          <span className="text-sm text-red-400">Deletar este setlist?</span>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg">Sim</button>
            <button onClick={() => setShowConfirmDelete(false)} className="px-3 py-1 bg-surface2 text-text text-xs rounded-lg">Não</button>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="animate-fadeIn">
          {sortedSongs.length === 0 ? (
            <div className="p-6 text-center text-muted text-sm">
              Nenhuma música adicionada ainda. Clique em <strong>+ Música</strong> para começar.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedSongs.map((item, idx) => {
                const song = item.songs
                if (!song) return null
                return (
                  <div key={item.id} className="flex items-center gap-2 p-3 hover:bg-surface2 transition-colors">
                    {isMobile && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveSong(idx, -1)
                          }}
                          disabled={idx === 0}
                          className="w-7 h-7 bg-surface2 hover:bg-accent/20 disabled:opacity-30 text-text rounded flex items-center justify-center text-xs"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveSong(idx, 1)
                          }}
                          disabled={idx === sortedSongs.length - 1}
                          className="w-7 h-7 bg-surface2 hover:bg-accent/20 disabled:opacity-30 text-text rounded flex items-center justify-center text-xs"
                        >
                          ↓
                        </button>
                      </div>
                    )}

                    <div className="w-8 h-8 bg-accent/10 text-accent font-bold rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                      {idx + 1}
                    </div>

                    <button 
                      onClick={(e) => handleSongClick(song.id, e)}
                      className="flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="font-semibold text-text truncate">{song.title}</div>
                      <div className="text-xs text-muted truncate">{song.artist}</div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {song.original_key || 'C'}
                      </span>
                      <span className="text-xs font-mono bg-surface2 text-muted px-2 py-0.5 rounded-full">
                        {song.bpm || 120}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSong(item.id)
                      }}
                      className="w-7 h-7 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddToSetlistModal
          setlistId={setlist.id}
          onClose={() => setShowAddModal(false)}
          onAdded={onAdded}
        />
      )}
    </div>
  )
}"""

print('🔧 Sobrescrevendo arquivos...')

with open('src/pages/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(home_code)
print('✅ Home.jsx atualizado!')

with open('src/components/SetlistCard.jsx', 'w', encoding='utf-8') as f:
    f.write(setlist_code)
print('✅ SetlistCard.jsx atualizado!')

print('')
print('📋 AGORA:')
print('1. Copie fundo.jpg para a pasta public/')
print('2. Copie icon2.png para a pasta public/')
print('')
print('🔄 Depois rode:')
print('   npm run build')
print('   git add .')
print('   git commit -m "Fundo personalizado + logo maior + corrige navegacao setlist"')
print('   git push')