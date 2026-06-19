import { Link } from 'react-router-dom'

export default function SongRow({ song }) {
  return (
    <Link
      to={`/player/${song.id}`}
      className="block bg-surface hover:bg-surface2 border border-border hover:border-accent/50 rounded-xl p-3 md:p-4 transition-all group"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Esquerda: Título e Artista */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text truncate group-hover:text-accent transition-colors">
            {song.title}
          </h3>
          <p className="text-sm text-muted truncate">{song.artist}</p>
        </div>

        {/* Direita: Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono bg-accent/10 text-accent px-2.5 py-1 rounded-full">
            {song.original_key || 'C'}
          </span>
          <span className="text-xs font-mono bg-surface2 text-muted px-2.5 py-1 rounded-full">
            {song.bpm || 120} BPM
          </span>
          {song.original_capo > 0 && (
            <span className="text-xs font-mono bg-accent2/10 text-accent2 px-2.5 py-1 rounded-full">
              Capo {song.original_capo}ª
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}