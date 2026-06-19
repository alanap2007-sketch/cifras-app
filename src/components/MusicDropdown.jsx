import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function MusicDropdown({ setlistId, onAdded }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [existingSongIds, setExistingSongIds] = useState(new Set())
  const dropdownRef = useRef(null)

  // Carrega músicas e as que já estão no setlist
  useEffect(() => {
    if (isOpen) {
      loadSongs()
      loadExistingSongs()
    }
  }, [isOpen])

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadSongs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('songs')
      .select('*')
      .order('title', { ascending: true })
    
    if (data) setSongs(data)
    setLoading(false)
  }

  const loadExistingSongs = async () => {
    const { data } = await supabase
      .from('setlist_songs')
      .select('song_id')
      .eq('setlist_id', setlistId)
    
    if (data) {
      setExistingSongIds(new Set(data.map(item => item.song_id)))
    }
  }

  const handleAdd = async (songId) => {
    const nextPosition = existingSongIds.size + 1

    const { error } = await supabase.from('setlist_songs').insert({
      setlist_id: setlistId,
      song_id: songId,
      position: nextPosition
    })

    if (error) {
      alert('Erro ao adicionar: ' + error.message)
    } else {
      setExistingSongIds(prev => new Set([...prev, songId]))
      setSearch('')
      onAdded()
    }
  }

  const filteredSongs = songs.filter(song =>
    !existingSongIds.has(song.id) &&
    (song.title.toLowerCase().includes(search.toLowerCase()) ||
     song.artist.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
      >
        <span>+</span>
        <span className="hidden sm:inline">Música</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-50 w-80 max-h-96 flex flex-col">
          {/* Busca */}
          <div className="p-3 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder=" Buscar música..."
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-accent outline-none"
              autoFocus
            />
          </div>

          {/* Lista */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted text-sm">Carregando...</div>
            ) : filteredSongs.length === 0 ? (
              <div className="p-4 text-center text-muted text-sm">
                {search ? 'Nenhuma música encontrada' : 'Todas as músicas já foram adicionadas'}
              </div>
            ) : (
              filteredSongs.map(song => (
                <button
                  key={song.id}
                  onClick={() => handleAdd(song.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface2 border-b border-border last:border-b-0 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text text-sm truncate">{song.title}</div>
                    <div className="text-xs text-muted truncate">{song.artist}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <span className="text-xs font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                      {song.original_key || 'C'}
                    </span>
                    <span className="text-xs font-mono bg-surface2 text-muted px-1.5 py-0.5 rounded">
                      {song.bpm || 120}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Rodapé */}
          <div className="p-2 border-t border-border text-center">
            <span className="text-xs text-muted">
              {filteredSongs.length} música{filteredSongs.length !== 1 ? 's' : ''} disponível{filteredSongs.length !== 1 ? 'eis' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}