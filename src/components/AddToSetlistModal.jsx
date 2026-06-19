import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AddToSetlistModal({ setlistId, onClose, onAdded }) {
  const [songs, setSongs] = useState([])
  const [selectedSongs, setSelectedSongs] = useState(new Set())
  const [search, setSearch] = useState('')
  const [existingSongIds, setExistingSongIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSongs()
    loadExistingSongs()
  }, [])

  const loadSongs = async () => {
    const { data } = await supabase
      .from('songs')
      .select('*')
      .order('title', { ascending: true })
    
    if (data) setSongs(data)
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

  const toggleSong = (songId) => {
    const newSelected = new Set(selectedSongs)
    if (newSelected.has(songId)) {
      newSelected.delete(songId)
    } else {
      newSelected.add(songId)
    }
    setSelectedSongs(newSelected)
  }

  const handleAddSelected = async () => {
    if (selectedSongs.size === 0) return

    setSaving(true)

    const { data: existingSongs } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
    
    let nextPosition = existingSongs ? existingSongs.length + 1 : 1

    const songsToAdd = Array.from(selectedSongs).map(songId => ({
      setlist_id: setlistId,
      song_id: songId,
      position: nextPosition++
    }))

    const { error } = await supabase.from('setlist_songs').insert(songsToAdd)

    if (error) {
      alert('Erro ao adicionar: ' + error.message)
    } else {
      onAdded()
      onClose()
    }

    setSaving(false)
  }

  const filteredSongs = songs.filter(song =>
    !existingSongIds.has(song.id) &&
    (song.title.toLowerCase().includes(search.toLowerCase()) ||
     song.artist.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text">➕ Adicionar Músicas</h2>
            <p className="text-sm text-muted mt-1">
              {selectedSongs.size} selecionada{selectedSongs.size !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-surface2 hover:bg-surface text-text rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar música..."
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-text focus:border-accent outline-none text-base"
            autoFocus
          />
        </div>

        {/* Lista de músicas */}
        <div className="flex-1 overflow-y-auto">
          {filteredSongs.length === 0 ? (
            <div className="p-8 text-center text-muted">
              {search ? 'Nenhuma música encontrada' : 'Todas as músicas já foram adicionadas'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredSongs.map(song => (
                <label
                  key={song.id}
                  className={`flex items-center gap-4 p-4 hover:bg-surface2 transition-colors cursor-pointer ${
                    selectedSongs.has(song.id) ? 'bg-accent/5' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSongs.has(song.id)}
                    onChange={() => toggleSong(song.id)}
                    className="w-6 h-6 rounded border-border bg-surface2 text-accent focus:ring-accent focus:ring-offset-0 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text truncate">{song.title}</div>
                    <div className="text-sm text-muted truncate">{song.artist}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {song.original_key || 'C'}
                      </span>
                      <span className="text-xs font-mono bg-surface2 text-muted px-2 py-0.5 rounded-full">
                        {song.bpm || 120} BPM
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t border-border flex gap-3 flex-shrink-0 safe-bottom">
          <button
            onClick={onClose}
            className="flex-1 bg-surface2 hover:bg-surface border border-border text-text font-semibold py-3 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selectedSongs.size === 0 || saving}
            className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {saving ? 'Adicionando...' : `Adicionar ${selectedSongs.size} música${selectedSongs.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}