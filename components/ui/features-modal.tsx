"use client"

import { useEffect } from "react"

interface Props {
  open: boolean
  onClose: () => void
}

export function FeaturesModal({ open, onClose }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      
      {/* затемнение фона */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* стеклянное окно */}
      <div className="relative z-10 w-[600px] max-w-[90%] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8">
        
        <h2 className="text-2xl font-semibold mb-4">Features</h2>

        {/* ТУТ МОЖЕШЬ ПИСАТЬ ЛЮБЫЕ ФИЧИ */}
        <ul className="space-y-3 text-zinc-300">
          <li>• Multi-chain auto detection</li>
          <li>• Live transaction history</li>
          <li>• USD conversion</li>
          <li>• Clean glass UI</li>
        </ul>

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}