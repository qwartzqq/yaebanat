export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-transparent to-transparent" />

      {/* main glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-violet-600 via-sky-500 to-emerald-500" />
      <div className="absolute -bottom-48 right-[-120px] w-[520px] h-[520px] rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-fuchsia-600 via-indigo-500 to-sky-400" />
      <div className="absolute -bottom-64 left-[-160px] w-[520px] h-[520px] rounded-full blur-3xl opacity-15 bg-gradient-to-tr from-emerald-500 via-sky-500 to-violet-500" />

      {/* faint noise grid */}
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] bg-[length:22px_22px]" />
    </div>
  )
}
