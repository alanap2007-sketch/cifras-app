import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    const { data: songsData } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (songsData) {
      setSongs(songsData)
      setFilteredSongs(songsData)
    }

    // IMPORTANTE: Buscar o ID da tabela setlist_songs!
    const { data: setlistsData } = await supabase
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
    
    if (setlistsData) setSetlists(setlistsData)

    setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
              🎸 Cifras App
            </h1>
            <p className="text-muted text-sm mt-1">Suas músicas e setlists para o culto</p>
          </div>
          <Link
            to="/editor"
            className="bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            <span>+</span> Nova Cifra
          </Link>
        </div>

        {/* Busca */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="🔍 Buscar músicas..."
            className="w-full bg-surface border border-border rounded-xl px-5 py-3 pl-12 text-text focus:border-accent outline-none"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('songs')}
            className={`px-4 py-2 font-semibold text-sm transition-colors relative ${
              activeTab === 'songs' ? 'text-accent' : 'text-muted hover:text-text'
            }`}
          >
            🎵 Músicas ({songs.length})
            {activeTab === 'songs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>}
          </button>
          <button
            onClick={() => setActiveTab('setlists')}
            className={`px-4 py-2 font-semibold text-sm transition-colors relative ${
              activeTab === 'setlists' ? 'text-accent' : 'text-muted hover:text-text'
            }`}
          >
            📋 Setlists ({setlists.length})
            {activeTab === 'setlists' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>}
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'songs' ? (
          <div className="space-y-3">
            {filteredSongs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted text-lg mb-4">Nenhuma música encontrada</p>
                <Link to="/editor" className="inline-block text-accent hover:underline">
                  Criar primeira cifra →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSongs.map(song => (
                  <SongRow key={song.id} song={song} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateSetlist(true)}
              className="w-full bg-gradient-to-r from-accent/10 to-accent2/10 border-2 border-dashed border-accent/40 hover:border-accent/70 rounded-xl p-4 text-accent font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Criar novo Setlist</span>
            </button>

            {setlists.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted text-lg">Nenhum setlist criado ainda</p>
                <p className="text-sm text-muted mt-2">Crie um setlist para organizar os louvores do culto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {setlists.map(setlist => (
                  <SetlistCard
                    key={setlist.id}
                    setlist={setlist}
                    onAdded={fetchData}
                    onDeleted={fetchData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

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