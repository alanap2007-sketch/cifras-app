import { Preferences } from '@capacitor/preferences'

const CACHE_KEYS = {
  SONGS: 'cached_songs',
  SETLISTS: 'cached_setlists',
  LAST_SYNC: 'last_sync_time'
}

// Salvar músicas no cache
export const cacheSongs = async (songs) => {
  try {
    await Preferences.set({
      key: CACHE_KEYS.SONGS,
      value: JSON.stringify(songs)
    })
    await Preferences.set({
      key: CACHE_KEYS.LAST_SYNC,
      value: new Date().toISOString()
    })
    console.log('✅ Músicas salvas no cache')
  } catch (error) {
    console.error('Erro ao salvar cache:', error)
  }
}

// Carregar músicas do cache
export const getCachedSongs = async () => {
  try {
    const { value } = await Preferences.get({ key: CACHE_KEYS.SONGS })
    if (value) {
      console.log('📦 Músicas carregadas do cache')
      return JSON.parse(value)
    }
    return []
  } catch (error) {
    console.error('Erro ao carregar cache:', error)
    return []
  }
}

// Salvar setlists no cache
export const cacheSetlists = async (setlists) => {
  try {
    await Preferences.set({
      key: CACHE_KEYS.SETLISTS,
      value: JSON.stringify(setlists)
    })
    console.log('✅ Setlists salvos no cache')
  } catch (error) {
    console.error('Erro ao salvar cache:', error)
  }
}

// Carregar setlists do cache
export const getCachedSetlists = async () => {
  try {
    const { value } = await Preferences.get({ key: CACHE_KEYS.SETLISTS })
    if (value) {
      console.log('📦 Setlists carregados do cache')
      return JSON.parse(value)
    }
    return []
  } catch (error) {
    console.error('Erro ao carregar cache:', error)
    return []
  }
}

// Limpar cache
export const clearCache = async () => {
  try {
    await Preferences.remove({ key: CACHE_KEYS.SONGS })
    await Preferences.remove({ key: CACHE_KEYS.SETLISTS })
    await Preferences.remove({ key: CACHE_KEYS.LAST_SYNC })
    console.log('🗑️ Cache limpo')
  } catch (error) {
    console.error('Erro ao limpar cache:', error)
  }
}

// Verificar se tem cache
export const hasCache = async () => {
  const { value } = await Preferences.get({ key: CACHE_KEYS.SONGS })
  return !!value
}

// Obter última sincronização
export const getLastSync = async () => {
  const { value } = await Preferences.get({ key: CACHE_KEYS.LAST_SYNC })
  return value ? new Date(value) : null
}