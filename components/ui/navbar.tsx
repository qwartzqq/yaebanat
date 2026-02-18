"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#testimonials", label: "Pricing" },
  { href: "#pricing", label: "Support" },
]

type Phase = "enter" | "exit"

function GlassModal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>("enter")
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setPhase("enter")
      document.body.style.overflow = "hidden"
      return
    }

    if (mounted) {
      setPhase("exit")
      document.body.style.overflow = "auto"
      closeTimer.current = window.setTimeout(() => setMounted(false), 220)
    }

    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      document.body.style.overflow = "auto"
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(14px) scale(.98); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          to   { opacity: 0; transform: translateY(10px) scale(.985); filter: blur(2px); }
        }
      `}</style>

      {/* overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        style={{
          animation: phase === "enter" ? "fadeIn 200ms ease-out" : "fadeOut 200ms ease-in",
        }}
      />

      {/* modal */}
      <div
        className="relative z-10 w-[680px] max-w-[92%] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8"
        style={{
          animation: phase === "enter" ? "modalIn 220ms cubic-bezier(.2,.9,.2,1)" : "modalOut 220ms ease-in",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/10 text-zinc-200 hover:bg-white/15 transition"
          >
            Close
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export function Navbar() {
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [getStartedOpen, setGetStartedOpen] = useState(false)

  const onNavClick = (href: string) => {
  // Features — модалка
  if (href === "#features") {
    setFeaturesOpen(true)
    return
  }

  // Pricing / Testimonials — в тг
  if (href === "#pricing" || href === "#testimonials") {
    window.open("https://t.me/oarew", "_blank", "noopener,noreferrer")
    return
  }

  // Остальное — обычный скролл по якорю
  const id = href.replace("#", "")
  const el = document.getElementById(id)
  if (el) {
    const y = el.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({ top: Math.max(0, y - 120), behavior: "smooth" })
  } else {
    location.hash = id
  }
}

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] p-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between h-12 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <Link
            href="https://t.me/oarew"
            className="font-display text-xl font-semibold text-zinc-100 tracking-wide hover:text-white transition-colors"
          >
            Pale
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => onNavClick(link.href)}
                className="px-4 py-1.5 text-sm rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
              >
                {link.label}
              </button>
            ))}

            <button
              onClick={() => setGetStartedOpen(true)}
              className="ml-2 px-4 py-1.5 text-sm rounded-full bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* FEATURES MODAL */}
      <GlassModal
        open={featuresOpen}
        onClose={() => setFeaturesOpen(false)}
        title="Features"
        subtitle=""
      >
        <div className="grid gap-3">

  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
    <div className="text-white font-medium">Multi-chain</div>
    <div className="text-zinc-400 text-sm mt-1">
      Explore blockchains as BTC / ETH / LTC / TON / TRON easily.
    </div>
  </div>

  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
    <div className="text-white font-medium">USD conversion</div>
    <div className="text-zinc-400 text-sm mt-1">
      Balances in USD for easier communication.
    </div>
  </div>

  {/* НОВАЯ КАРТОЧКА */}
  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
    <div className="text-white font-medium">Transaction history</div>
    <div className="text-zinc-400 text-sm mt-1">
      View detailed transfer history with timestamps and USD values.
    </div>
  </div>

</div>
		  
		
      </GlassModal>

      {/* GET STARTED MODAL */}
      <GlassModal
        open={getStartedOpen}
        onClose={() => setGetStartedOpen(false)}
        title="Get Started"
        subtitle="Instrucrions for new user"
      >
        {/* ТУТ ТВОЙ ТЕКСТ */}
        <div className="space-y-3 text-zinc-300">
          <p>
            1) Copy BTC / ETH / LTC / TON / TRON adress<br />
            2) Paste adress in search window <br />
            3) Now you can explore blockchains as BTC / ETH / LTC / TON / TRON easily
          </p>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-zinc-300">
            Pale - <b>First</b> and <b>Fastest</b> multi-chain explorer
          </div>

          <Link
            href="https://t.me/oarew"
            className="inline-block text-sm text-zinc-100 hover:text-white underline underline-offset-4"
          >
            Any questions? <b>Click here</b>
          </Link>
        </div>
      </GlassModal>
    </>
  )
}