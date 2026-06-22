import { useEffect, useState } from 'react'
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
              <img src="/icon2.png" alt="CifraBox" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
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
}