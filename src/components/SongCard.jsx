import { Link } from 'react-router-dom'

export default function SongCard({ song }) {
  return (
    <Link
      to={`/player/${song.id}`}
      className="block bg-surface hover:bg-surface2 border border-border 
                 hover:border-accent/50 rounded-xl p-5 transition-all 
                 hover:shadow-lg hover:shadow-accent/10"
    >
      <h3 className="text-lg font-bold text-text mb-1 truncate">{song.title}</h3>
      <p className="text-sm text-muted mb-3 truncate">{song.artist}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
          {song.bpm} BPM
        </span>
        <span className="text-xs text-muted">
          {new Date(song.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </Link>
  )
}