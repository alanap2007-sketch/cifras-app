import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Player from './pages/Player'
import Login from './pages/Login'
import useBackButton from './hooks/useBackButton'

function AppContent() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useBackButton() // Hook para o botão voltar

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/editor" element={session ? <Editor /> : <Navigate to="/login" />} />
      <Route path="/editor/:id" element={session ? <Editor /> : <Navigate to="/login" />} />
      <Route path="/player/:id" element={<Player />} />
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App