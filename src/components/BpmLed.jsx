import { useEffect, useState } from 'react'

export default function BpmLed({ bpm = 120, visible = true }) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!bpm || bpm <= 0 || !visible) return
    const interval = (60 / bpm) * 1000
    const timer = setInterval(() => setOn(v => !v), interval)
    return () => clearInterval(timer)
  }, [bpm, visible])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-border rounded-full px-4 py-2 shadow-xl">
      <div
        className="w-3 h-3 rounded-full transition-all duration-75"
        style={{
          backgroundColor: on ? '#8b5cf6' : '#2a2a3a',
          boxShadow: on ? '0 0 12px #8b5cf6, 0 0 24px #8b5cf6' : 'none',
        }}
      />
      <span className="text-xs font-mono text-muted">
        <span className="text-text font-bold">{bpm}</span> BPM
      </span>
    </div>
  )
}