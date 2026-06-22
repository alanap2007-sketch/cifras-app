const SONGS_CACHE_KEY = 'cifrabox_songs'
const SETLISTS_CACHE_KEY = 'cifrabox_setlists'
const LAST_SYNC_KEY = 'cifrabox_last_sync'

export const cacheSongs = async (songs) => {
  localStorage.setItem(SONGS_CACHE_KEY, JSON.stringify(songs))
}

export const getCachedSongs = async () => {
  const cached = localStorage.getItem(SONGS_CACHE_KEY)
  return cached ? JSON.parse(cached) : []
}

export const cacheSetlists = async (setlists) => {
  localStorage.setItem(SETLISTS_CACHE_KEY, JSON.stringify(setlists))
}

export const getCachedSetlists = async () => {
  const cached = localStorage.getItem(SETLISTS_CACHE_KEY)
  return cached ? JSON.parse(cached) : []
}

export const getLastSync = async () => {
  const cached = localStorage.getItem(LAST_SYNC_KEY)
  return cached ? new Date(cached) : null
}