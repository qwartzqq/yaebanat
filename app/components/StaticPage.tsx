import Link from "next/link"

export type StaticSection = { h: string; p: string }

export default function StaticPage({
  title,
  subtitle,
  sections,
}: {
  title: string
  subtitle?: string
  sections: StaticSection[]
}) {
  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-sm text-zinc-400">Pale</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 text-zinc-400 max-w-2xl">{subtitle}</p> : null}
          </div>
          <Link
            href="/"
            className="shrink-0 px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 transition"
          >
            Back to home
          </Link>
        </div>

        <div className="mt-10 grid gap-4">
          {sections.map((s) => (
            <div key={s.h} className="rounded-3xl bg-zinc-900/35 border border-zinc-800/70 backdrop-blur-xl p-6">
              <div className="text-lg font-semibold text-white">{s.h}</div>
              <div className="mt-2 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{s.p}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-xs text-zinc-500">
          © {new Date().getFullYear()} Pale. All rights reserved. Content is for informational purposes only and does not constitute financial advice.
        </div>
      </div>
    </main>
  )
}
