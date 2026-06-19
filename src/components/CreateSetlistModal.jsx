import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CreateSetlistModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dateDisplay, setDateDisplay] = useState('') // Formato visual dd/mm/aaaa
  const [saving, setSaving] = useState(false)

  // Converte dd/mm/aaaa para yyyy-mm-dd (formato do banco)
  const parseDate = (displayDate) => {
    if (!displayDate) return null
    const parts = displayDate.split('/')
    if (parts.length !== 3) return null
    const [day, month, year] = parts
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null
    return `${year}-${month}-${day}`
  }

  // Máscara de data: adiciona / automaticamente
  const handleDateChange = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    let formatted = numbers
    if (numbers.length >= 3 && numbers.length <= 4) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else if (numbers.length > 4) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
    
    setDateDisplay(formatted)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Digite o nome do setlist')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Você precisa estar logado')
      return
    }

    const eventDate = parseDate(dateDisplay)

    setSaving(true)

    const { error } = await supabase.from('setlists').insert({
      name,
      description: description || null,
      event_date: eventDate,
      author_id: user.id
    })

    if (error) {
      alert('Erro ao criar: ' + error.message)
    } else {
      onCreated()
    }

    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">📋 Novo Setlist</h2>
          <button onClick={onClose} className="w-8 h-8 bg-surface2 hover:bg-surface text-text rounded-lg transition-colors">
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted font-medium">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Culto de Domingo 19/06"
              className="w-full mt-1 bg-surface2 border border-border rounded-lg px-4 py-2.5 text-text focus:border-accent outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-muted font-medium">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Culto da juventude"
              className="w-full mt-1 bg-surface2 border border-border rounded-lg px-4 py-2.5 text-text focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted font-medium">Data do evento (opcional)</label>
            <input
              type="text"
              value={dateDisplay}
              onChange={e => handleDateChange(e.target.value)}
              placeholder="dd/mm/aaaa"
              maxLength={10}
              className="w-full mt-1 bg-surface2 border border-border rounded-lg px-4 py-2.5 text-text focus:border-accent outline-none font-mono"
            />
            <p className="text-xs text-muted mt-1">Formato: dia/mês/ano (ex: 19/06/2026)</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 bg-accent hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Criando...' : 'Criar Setlist'}
          </button>
          <button
            onClick={onClose}
            className="px-5 bg-surface2 hover:bg-surface border border-border text-text font-semibold py-2.5 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}