import { useState } from 'react'
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
    const { error } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('id', setlistSongId)
    
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
    navigate(`/player/${songId}`, { state: { from: 'setlist' } })
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
            <p className="text-xs text-accent2 mt-1"> {formatDate(setlist.event_date)}</p>
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
}