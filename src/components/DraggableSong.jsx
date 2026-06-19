import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function DraggableSong({ song, setlistSongId, index, onRemove, onDragStart, onDragOver, onDragEnd, isDragging, dragOverIndex }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(index, e)}
      onDragOver={(e) => onDragOver(index, e)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 transition-all cursor-move ${
        isDragging ? 'opacity-50 bg-accent/10' : 'hover:bg-surface2'
      } ${dragOverIndex === index ? 'border-t-2 border-accent' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Handle de arrastar */}
      <div className="flex flex-col gap-0.5 text-muted flex-shrink-0">
        <div className="w-4 h-0.5 bg-current rounded"></div>
        <div className="w-4 h-0.5 bg-current rounded"></div>
        <div className="w-4 h-0.5 bg-current rounded"></div>
      </div>

      {/* Número */}
      <div className="w-8 h-8 bg-accent/10 text-accent font-bold rounded-lg flex items-center justify-center text-sm flex-shrink-0">
        {index + 1}
      </div>

      {/* Info */}
      <Link to={`/player/${song.id}`} className="flex-1 min-w-0">
        <div className="font-semibold text-text truncate hover:text-accent transition-colors">
          {song.title}
        </div>
        <div className="text-xs text-muted truncate">{song.artist}</div>
      </Link>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">
          {song.original_key || 'C'}
        </span>
        <span className="text-xs font-mono bg-surface2 text-muted px-2 py-0.5 rounded-full">
          {song.bpm || 120}
        </span>
      </div>

      {/* Botão remover - usa setlistSongId (não song.id) */}
      <button
        onClick={() => onRemove(setlistSongId)}
        className={`w-7 h-7 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all text-xs flex items-center justify-center ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        title="Remover"
      >
        ×
      </button>
    </div>
  )
}