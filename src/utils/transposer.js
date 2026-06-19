const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SHARPS = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' }

// Regex para detectar acordes (Am, C#m7, G/B, etc)
const CHORD_REGEX = /^([A-G][#b]?)((?:m|maj|dim|aug|sus[24]?|7|maj7|m7|dim7|aug7|add|°|ø)*\d*(?:\([^)]*\))*)(\/([A-G][#b]?))?$/

export function transposeChord(chord, semitones) {
  if (!chord || semitones === 0) return chord
  
  const trimmed = chord.trim()
  if (!trimmed) return trimmed
  
  // Separa o baixo (ex: G/B -> root=G, bass=B)
  let rootPart = trimmed
  let bassPart = ''
  
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    rootPart = parts[0]
    bassPart = '/' + parts[1]
  }
  
  // Extrai a nota raiz
  const rootMatch = rootPart.match(/^([A-G][#b]?)(.*)$/)
  if (!rootMatch) return chord
  
  let root = rootMatch[1]
  const suffix = rootMatch[2]
  
  // Normaliza bemóis
  if (SHARPS[root]) root = SHARPS[root]
  
  const rootIndex = NOTES.indexOf(root)
  if (rootIndex === -1) return chord
  
  // Calcula nova nota
  const newIndex = (rootIndex + semitones + 120) % 12
  const newRoot = NOTES[newIndex]
  
  // Transpõe o baixo se existir
  let newBass = ''
  if (bassPart) {
    const bassNote = bassPart.substring(1)
    let normalizedBass = bassNote
    if (SHARPS[normalizedBass]) normalizedBass = SHARPS[normalizedBass]
    
    const bassIndex = NOTES.indexOf(normalizedBass)
    if (bassIndex !== -1) {
      const newBassIndex = (bassIndex + semitones + 120) % 12
      newBass = '/' + NOTES[newBassIndex]
    } else {
      newBass = bassPart
    }
  }
  
  return newRoot + suffix + newBass
}

// Detecta se uma palavra é um acorde
function isChord(word) {
  if (!word) return false
  const clean = word.replace(/[\[\]]/g, '')
  return CHORD_REGEX.test(clean) || /^[A-G][#b]?$/.test(clean)
}

// Detecta se uma linha é uma linha de acordes
function isChordLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return false
  
  // Se tem colchetes, é linha de acordes com certeza
  if (trimmed.includes('[') && trimmed.includes(']')) return true
  
  const cleanLine = trimmed.replace(/[\[\]]/g, '')
  const words = cleanLine.split(/\s+/).filter(w => w.length > 0)
  
  if (words.length === 0) return false
  
  // Se a maioria das palavras são acordes
  const chordCount = words.filter(w => isChord(w)).length
  return chordCount / words.length >= 0.5
}

// Transpõe uma linha
function transposeLine(line, semitones) {
  // Com colchetes [Am] [G]
  if (line.includes('[') && line.includes(']')) {
    return line.replace(/\[([^\]]+)\]/g, (match, chord) => {
      return '[' + transposeChord(chord.trim(), semitones) + ']'
    })
  }
  
  // Sem colchetes - transpõe cada palavra que parece acorde
  return line.replace(/\b([A-G][#b]?(?:m|maj|dim|aug|sus[24]?|7|maj7|m7|dim7|aug7|add|°|ø)*\d*(?:\([^)]*\))?(?:\/[A-G][#b]?)?)\b/g, (match) => {
    if (isChord(match)) {
      return transposeChord(match, semitones)
    }
    return match
  })
}

export function transposeContent(content, semitones) {
  if (!content || semitones === 0) return content
  
  return content.split('\n').map(line => {
    if (isChordLine(line)) {
      return transposeLine(line, semitones)
    }
    return line
  }).join('\n')
}

export function getAllKeys() {
  return NOTES
}

export function getSemitonesDifference(from, to) {
  const fromIndex = NOTES.indexOf(from)
  const toIndex = NOTES.indexOf(to)
  if (fromIndex === -1 || toIndex === -1) return 0
  
  let diff = toIndex - fromIndex
  if (diff > 6) diff -= 12
  if (diff < -6) diff += 12
  return diff
}
// Converte nota + semitons em nova nota
export const getNoteFromSemitones = (note, semitones) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' }
  
  let cleanNote = flatToSharp[note] || note
  const index = notes.indexOf(cleanNote)
  
  if (index === -1) return note
  
  const newIndex = (index + semitones) % 12
  return notes[newIndex]
}