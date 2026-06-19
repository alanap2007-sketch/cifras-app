import { useState } from 'react'
import { getAllKeys } from '../utils/transposer'

export default function KeySelector({ originalKey, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const keys = getAllKeys()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold 
                   rounded-xl transition-colors flex items-center gap-2"
      >
        <span>🎼</span>
        <span>Ton: {originalKey || 'C'}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-surface border border-border 
                          rounded-xl shadow-xl z-50 p-2 min-w-[200px]">
            <div className="grid grid-cols-4 gap-1">
              {keys.map(key => (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key)
                    setIsOpen(false)
                  }}
                  className={`px-3 py-2 rounded-lg font-mono font-bold text-sm 
                              transition-colors ${
                    key === originalKey 
                      ? 'bg-accent text-white' 
                      : 'bg-surface2 text-text hover:bg-accent/20'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}