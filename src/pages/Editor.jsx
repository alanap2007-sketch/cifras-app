import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CifraSearch from '../components/CifraSearch'
import { getAllKeys } from '../utils/transposer'

export default function Editor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [content, setContent] = useState('')
  const [bpm, setBpm] = useState(120)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [originalKey, setOriginalKey] = useState('C')
  const [originalCapo, setOriginalCapo] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (id) {
      loadSong()
      setIsEditing(true)
    }
  }, [id])

  const loadSong = async () => {
    const { data, error } = await supabase.from('songs').select('*').eq('id', id).single()
    if (error) {
      alert('Erro ao carregar música')
      navigate('/')
      return
    }
    setTitle(data.title)
    setArtist(data.artist)
    setContent(data.content)
    setBpm(data.bpm || 120)
    setOriginalKey(data.original_key || 'C')
    setOriginalCapo(data.original_capo || 0)
  }

  const handleSongSelect = (songData) => {
    setTitle(songData.title || '')
    setArtist(songData.artist || '')
    setContent(songData.content || '')
    setBpm(songData.original_bpm || 120)
    setOriginalKey(songData.original_key || 'C')
    setOriginalCapo(songData.original_capo || 0)
    setShowSearch(false)
  }

  const handleSave = async () => {
    if (!title.trim() || !artist.trim() || !content.trim()) {
      alert('Preencha título, artista e cifra')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Você precisa estar logado')
      navigate('/login')
      return
    }

    setSaving(true)

    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      content: content.trim(),
      bpm,
      original_key: originalKey,
      original_capo: originalCapo,
      original_bpm: bpm,
    }

    let error
    if (isEditing) {
      const result = await supabase.from('songs').update(songData).eq('id', id)
      error = result.error
    } else {
      const result = await supabase.from('songs').insert({ ...songData, author_id: user.id })
      error = result.error
    }

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      navigate(isEditing ? `/player/${id}` : '/')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header fixo */}
      <div className="fixed top-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-b border-border z-50 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="text-muted hover:text-accent transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-lg font-bold text-text">
            {isEditing ? '✏️ Editar' : '➕ Nova Cifra'}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pt-[60px] px-4 space-y-4">
        
        {/* Botão de busca */}
        {!isEditing && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-full bg-gradient-to-r from-accent/20 to-accent2/20 border border-accent/40 rounded-xl p-4 text-accent font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔍</span>
            <span>Buscar música online</span>
          </button>
        )}

        {/* Busca expansível */}
        {showSearch && !isEditing && (
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <CifraSearch onSelect={handleSongSelect} />
          </div>
        )}

        {/* Campos básicos */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted font-medium mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Quem é Esse?"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:border-accent outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm text-muted font-medium mb-1">Artista *</label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="Ex: Julliany Souza"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:border-accent outline-none text-base"
            />
          </div>
        </div>

        {/* Informações */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">🎵 Informações</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted font-medium mb-1">Tom</label>
              <select
                value={originalKey}
                onChange={e => setOriginalKey(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-text focus:border-accent outline-none text-sm"
              >
                {getAllKeys().map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted font-medium mb-1">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={e => setBpm(+e.target.value)}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-text font-mono focus:border-accent outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted font-medium mb-2">Capotraste original</label>
            <div className="flex items-center gap-2 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setOriginalCapo(n)}
                  className={`w-12 h-12 rounded-xl font-mono font-bold transition-all ${
                    originalCapo === n
                      ? 'bg-accent2 text-white shadow-lg shadow-accent2/30'
                      : 'bg-surface2 text-text border border-border'
                  }`}
                >
                  {n === 0 ? 'Off' : n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
          <p className="text-xs text-muted">
            💡 <strong>Dica:</strong> Cole a cifra do Cifra Club e use <strong className="text-accent">[Am]</strong> para destacar acordes. Use <strong className="text-accent">Intro</strong>, <strong className="text-accent">Verso</strong>, <strong className="text-accent">Refrão</strong> em linhas separadas.
          </p>
        </div>

        {/* Editor de cifra */}
        <div className="space-y-2">
          <label className="block text-sm text-muted font-medium">Cifra *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Cole a cifra aqui...&#10;&#10;Exemplo:&#10;Intro&#10;[Am] [G] [F] [E]&#10;&#10;Verso 1&#10;[Am] [G]&#10;Letra da música"
            className="w-full bg-surface border border-border rounded-xl p-4 font-mono text-sm text-text min-h-[300px] focus:border-accent outline-none resize-y"
            style={{ minHeight: '300px' }}
          />
        </div>

      </div>

      {/* Botão fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border p-4 safe-bottom">
        <button
          onClick={handleSave}
          disabled={!title.trim() || !artist.trim() || !content.trim() || saving}
          className="w-full bg-accent hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-base"
        >
          {saving ? '💾 Salvando...' : isEditing ? '💾 Atualizar' : '💾 Salvar Cifra'}
        </button>
      </div>
    </div>
  )
}