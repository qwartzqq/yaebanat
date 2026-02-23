"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Copy, ExternalLink, Loader2, CheckCircle2, XCircle, Shield, Zap, Blocks, Link2, MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react"
import { LiquidCtaButton } from "@/components/buttons/liquid-cta-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Network = "BTC" | "ETH" | "LTC" | "TON" | "TRON" | "UNKNOWN"
type Kind = "address" | "tx" | "unknown"

type LookupResponse = {
  ok: boolean
  kind: Kind
  network: Network
  normalized?: string
  explorerUrl?: string
  summary?: {
    title: string
    subtitle?: string
    status?: "success" | "failed" | "unknown"
    amount?: string
    fee?: string
    confirmations?: string
    timestamp?: string
    from?: string
    to?: string
    balance?: string
    totalReceived?: string
    totalSent?: string
    txCount?: string
    usd?: string
    usdBalance?: string
    usdTotalReceived?: string
    usdTotalSent?: string
    contractType?: string
  }
  txs?: Array<{
    id: string
    timestamp?: number
    kind: "in" | "out" | "other"
    amount?: number
    symbol?: string
    amountUsd?: number
    // legacy TON field (server also provides `amount`)
    amountTon?: number
    from?: string
    to?: string
    type?: string
    explorerUrl?: string
  }>
  nfts?: Array<{
    address: string
    name: string
    image?: string
    collection?: string
  }>

  recentTxs?: Array<{
    hash: string
    time?: string
    value?: string
    direction?: "in" | "out" | "self"
  }>
  raw?: any
  error?: string
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function shorten(s: string, head = 8, tail = 6) {
  if (!s) return s
  if (s.length <= head + tail + 3) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

function detectInput(value: string): { kind: Kind; network: Network } {
  const v = value.trim()

  // ETH
  if (/^0x[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: "ETH" }
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return { kind: "address", network: "ETH" }

  // BTC / LTC / TRON typical patterns
  if (/^[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: "UNKNOWN" } // could be BTC/LTC/TRON
  if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(v)) return { kind: "address", network: "BTC" }
  if (/^(L|M|ltc1)[a-zA-Z0-9]{25,62}$/.test(v)) return { kind: "address", network: "LTC" }
  if (/^T[a-zA-Z0-9]{33}$/.test(v)) return { kind: "address", network: "TRON" }

  // TON (friendly base64url-ish: EQ... / UQ...)
  if (/^(EQ|UQ)[A-Za-z0-9_-]{40,80}$/.test(v)) return { kind: "address", network: "TON" }

  return { kind: "unknown", network: "UNKNOWN" }
}

function networkMeta(net: Network) {
  switch (net) {
    case "BTC":
      return { label: "Bitcoin", accent: "text-amber-200", badge: "bg-amber-500/10 border-amber-500/20 text-amber-200" }
    case "ETH":
      return { label: "Ethereum", accent: "text-violet-200", badge: "bg-violet-500/10 border-violet-500/20 text-violet-200" }
    case "LTC":
      return { label: "Litecoin", accent: "text-slate-200", badge: "bg-slate-500/10 border-slate-500/20 text-slate-200" }
    case "TRON":
      return { label: "TRON", accent: "text-red-200", badge: "bg-red-500/10 border-red-500/20 text-red-200" }
    case "TON":
      return { label: "TON", accent: "text-sky-200", badge: "bg-sky-500/10 border-sky-500/20 text-sky-200" }
    default:
      return { label: "Auto", accent: "text-zinc-200", badge: "bg-zinc-500/10 border-zinc-500/20 text-zinc-200" }
  }
}


function ts(ts?: number) {
  if (!ts) return "—"
  try {
    return new Date(ts * 1000).toLocaleString()
  } catch {
    return "—"
  }
}

function tonAmount(a?: number) {
  if (typeof a !== "number" || !Number.isFinite(a)) return null
  const s = a.toFixed(6).replace(/\.0+$|(?<=\.[0-9]*?)0+$/, "").replace(/\.$/, "")
  return s
}

function TxFeed({ addr, txs }: { addr: string; txs: NonNullable<LookupResponse["txs"]> }) {
  function fmtAmount(t: NonNullable<LookupResponse["txs"]>[number]) {
    const raw = typeof t.amount === "number" ? t.amount : typeof t.amountTon === "number" ? t.amountTon : null
    if (raw === null || !Number.isFinite(raw)) return "—"
    const s = raw.toFixed(6).replace(/\.0+$|(?<=\.[0-9]*?)0+$/, "").replace(/\.$/, "")
    return `${s} ${t.symbol ?? ""}`.trim()
  }

  function fmtUsd(t: NonNullable<LookupResponse["txs"]>[number]) {
    if (typeof t.amountUsd !== "number" || !Number.isFinite(t.amountUsd)) return null
    return `$${t.amountUsd.toFixed(2)}`
  }

  return (
    <div className="space-y-2">
      {txs.map((t) => {
        const dir = t.kind
        const sign = dir === "in" ? "+" : dir === "out" ? "-" : ""
        const accent =
          dir === "in"
            ? "border-emerald-400/20 bg-emerald-400/5"
            : dir === "out"
              ? "border-rose-400/20 bg-rose-400/5"
              : "border-white/10 bg-white/5"
        const text =
          dir === "in" ? "text-emerald-200" : dir === "out" ? "text-rose-200" : "text-zinc-200"

        const openUrl =
          t.explorerUrl ||
          (t.symbol === "TON"
            ? `https://tonviewer.com/transaction/${encodeURIComponent(t.id)}`
            : null)

        const usd = fmtUsd(t)

        return (
          <div key={t.id} className={cn("rounded-2xl border backdrop-blur-xl px-4 py-3 flex items-center gap-3", accent)}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm text-zinc-300/90 truncate">{t.type ?? "Transfer"}</div>
                <div className="text-xs text-zinc-400">• {ts(t.timestamp)}</div>
              </div>
              <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  From: <span className="text-zinc-200">{shorten(t.from ?? "—", 10, 10)}</span>
                </span>
                <span>
                  To: <span className="text-zinc-200">{shorten(t.to ?? "—", 10, 10)}</span>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className={cn("text-sm font-semibold tabular-nums", text)}>
                {sign}
                {fmtAmount(t)}
              </div>
              {usd ? <div className="text-xs text-zinc-400 tabular-nums">{usd}</div> : null}
              <div className="flex items-center justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(t.id)
                      setCopied(t.id)
                      setTimeout(() => setCopied(null), 900)
                    } catch {}
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {openUrl ? (
                  <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => window.open(openUrl, "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


function NftGrid({ nfts }: { nfts: NonNullable<LookupResponse["nfts"]> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {nfts.map((n) => {
        const url = n.address ? `https://tonviewer.com/${encodeURIComponent(n.address)}` : "#"
        return (
          <a
            key={n.address || n.name}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/10 transition"
          >
            <div className="aspect-square bg-black/30">
              {n.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.image} alt={n.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition" />
              ) : (
                <div className="h-full w-full grid place-items-center text-white/30 text-xs">No preview</div>
              )}
            </div>
            <div className="p-2">
              <div className="text-white/85 text-xs font-medium truncate">{n.name}</div>
              {n.collection ? <div className="text-white/35 text-[10px] truncate">{n.collection}</div> : null}
            </div>
          </a>
        )
      })}
    </div>
  )
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function ExplorerSection() {
  const [q, setQ] = useState("")
  const [res, setRes] = useState<LookupResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

const [commentsOpen, setCommentsOpen] = useState(false)
const [commentsLoading, setCommentsLoading] = useState(false)
const [commentsError, setCommentsError] = useState<string | null>(null)
const [comments, setComments] = useState<Array<{ id: string; createdAt: number; text: string }>>([])
const [canComment, setCanComment] = useState(false)
const [commentText, setCommentText] = useState("")
  const [commentNotice, setCommentNotice] = useState<string | null>(null)
  const [commentsMounted, setCommentsMounted] = useState(false)
  const [commentsPhase, setCommentsPhase] = useState<"enter" | "exit">("enter")

  // Mobile-friendly collapse for heavy sections
  const [historyOpen, setHistoryOpen] = useState(true)
  const [nftsOpen, setNftsOpen] = useState(true)
  const commentsCloseTimer = useRef<number | null>(null)



  const [forcedNetwork, setForcedNetwork] = useState<Network | "AUTO">("AUTO")

  useEffect(() => {
    if (commentsOpen) {
      setCommentsMounted(true)
      setCommentsPhase("enter")
      return
    }
    if (commentsMounted) {
      setCommentsPhase("exit")
      if (commentsCloseTimer.current) window.clearTimeout(commentsCloseTimer.current)
      commentsCloseTimer.current = window.setTimeout(() => {
        setCommentsMounted(false)
      }, 220)
    }
  }, [commentsOpen, commentsMounted])


  const guessed = useMemo(() => {
    if (forcedNetwork !== "AUTO") return { kind: detectInput(q).kind, network: forcedNetwork }
    return detectInput(q)
  }, [q, forcedNetwork])
  const guessedMeta = networkMeta(guessed.network)

  async function onSubmit() {
    const query = q.trim()
    if (!query) return
    setLoading(true)
    setRes(null)
    try {
      const r = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, network: forcedNetwork }),
      })
      const data = (await r.json()) as LookupResponse
      setRes(data)
    } catch (e: any) {
      setRes({ ok: false, kind: "unknown", network: "UNKNOWN", error: e?.message ?? "Request failed" })
    } finally {
      setLoading(false)
    }
  }

  function getCommentsKey() {
    const address = ((res?.normalized || q) ?? "").trim()
    const network = (res?.network || "UNKNOWN").toString().toUpperCase()
    return { network, address }
  }

  async function openComments() {
    const { network, address } = getCommentsKey()
    if (!address || network === "UNKNOWN") return

    setCommentsOpen(true)
    setCommentsError(null)
    setCommentNotice(null)
    setCommentsLoading(true)

    try {
      const r = await fetch(
        `/api/comments?network=${encodeURIComponent(network)}&address=${encodeURIComponent(address)}`,
        { cache: "no-store" }
      )
      const raw = await r.text()
      let data: any = null
      try { data = raw ? JSON.parse(raw) : null } catch {}

      if (!r.ok || !data?.ok) throw new Error(data?.error || `Comments API error (${r.status})`)

      setComments(Array.isArray(data.comments) ? data.comments : [])
      setCanComment(!!data.canPost)
    } catch (e: any) {
      setComments([])
      setCanComment(false)
      setCommentsError(e?.message || "Failed to load comments")
    } finally {
      setCommentsLoading(false)
    }
  }

  async function submitComment() {
    const { network, address } = getCommentsKey()
    const text = commentText.trim()
    if (!text || !address || network === "UNKNOWN") return

    setCommentsError(null)
    setCommentNotice(null)
    setCommentsLoading(true)

    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, address, text }),
      })
      const raw = await r.text()
      let data: any = null
      try { data = raw ? JSON.parse(raw) : null } catch {}

      if (!r.ok || !data?.ok) throw new Error(data?.error || `Comments API error (${r.status})`)

      setComments(Array.isArray(data.comments) ? data.comments : [])
      setCanComment(!!data.canPost)
      setCommentText("")
      setCommentNotice("Comment posted.")
    } catch (e: any) {
      setCommentsError(e?.message || "Failed to post comment")
    } finally {
      setCommentsLoading(false)
    }
  }


  const showStatus = res?.summary?.status
  const statusIcon =
    showStatus === "success" ? <CheckCircle2 className="w-4 h-4" /> : showStatus === "failed" ? <XCircle className="w-4 h-4" /> : null

  return (
    <section className="min-h-screen flex flex-col items-center justify-start px-6 pt-24 pb-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-6xl">
        {/* Top badge */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 mb-8">
            <Blocks className="w-4 h-4 text-zinc-300" />
            <span className="text-sm text-zinc-300">Blockchain Explorer • Multi-chain • Auto-detect</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white mb-6">
            Explore transactions <span className="bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-200 bg-clip-text text-transparent">instantly</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-300/90 leading-relaxed mb-10">
            Paste a wallet address or transaction hash. We&apos;ll figure out the network (BTC, ETH, LTC, TON, TRON) and show what matters.
          </p>
        </div>

        {/* Search Card */}
        <Card className="relative mx-auto max-w-3xl p-5 sm:p-6 bg-zinc-900/40 border-zinc-800/70 backdrop-blur-xl rounded-3xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-r from-white/5 via-transparent to-white/5" />
          <div className="relative">
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {([
                { key: "AUTO", label: "Auto" },
                { key: "BTC", label: "BTC" },
                { key: "ETH", label: "ETH" },
                { key: "LTC", label: "LTC" },
                { key: "TON", label: "TON" },
                { key: "TRON", label: "TRON" },
              ] as const).map((n) => (
                <Button
                  key={n.key}
                  type="button"
                  variant={forcedNetwork === n.key ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setForcedNetwork(n.key as any)}
                  className="rounded-xl"
                >
                  {n.label}
                </Button>
              ))}
            </div>
<div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit()
                  }}
                  placeholder="Address or TX hash…"
                  className="h-12 pl-11 pr-4 rounded-2xl bg-zinc-950/40 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-700"
                />
              </div>

              <div className="flex gap-3">
                <LiquidCtaButton onClick={onSubmit} className="h-12 px-5 rounded-2xl">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Search
                    </span>
                  )}
                </LiquidCtaButton>

                <Badge className={cn("h-12 px-4 rounded-2xl border flex items-center gap-2", guessedMeta.badge)}>
                  <Shield className="w-4 h-4 opacity-90" />
                  <span className="font-medium">{guessedMeta.label}</span>
                </Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="px-3 py-1 rounded-full bg-zinc-950/40 border border-zinc-800">BTC</span>
              <span className="px-3 py-1 rounded-full bg-zinc-950/40 border border-zinc-800">ETH</span>
              <span className="px-3 py-1 rounded-full bg-zinc-950/40 border border-zinc-800">LTC</span>
              <span className="px-3 py-1 rounded-full bg-zinc-950/40 border border-zinc-800">TON</span>
              <span className="px-3 py-1 rounded-full bg-zinc-950/40 border border-zinc-800">TRON</span>
              <span className="ml-auto hidden sm:inline-flex items-center gap-2 text-zinc-500">
                <Link2 className="w-3.5 h-3.5" /> auto-detect enabled
              </span>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mt-10">
          {loading && (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Card
                  key={i}
                  className="p-5 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl animate-pulse"
                >
                  <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
                  <div className="h-8 w-40 bg-zinc-800 rounded mb-2" />
                  <div className="h-4 w-28 bg-zinc-800 rounded" />
                </Card>
              ))}
            </div>
          )}

          {!loading && res && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn("rounded-full border", networkMeta(res.network).badge)}>{networkMeta(res.network).label}</Badge>
                  <Badge className="rounded-full bg-zinc-900/70 border-zinc-800 text-zinc-200">
                    {res.kind === "tx" ? "Transaction" : res.kind === "address" ? "Address" : "Unknown"}
                  </Badge>
                  {statusIcon && (
                    <Badge className="rounded-full bg-zinc-900/70 border-zinc-800 text-zinc-200 inline-flex items-center gap-2">
                      {statusIcon}
                      {showStatus === "success" ? "Success" : showStatus === "failed" ? "Failed" : "Status"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {res.normalized && (
                    <Button
                      variant="outline"
                      className="rounded-2xl border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900"
                      onClick={async () => {
                        const ok = await safeCopy(res.normalized!)
                        if (ok) {
                          setCopied(res.normalized!)
                          setTimeout(() => setCopied(null), 1200)
                        }
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied === res.normalized ? "Copied" : "Copy"}
                    </Button>
                  )}
                  {res.explorerUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-2xl border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900"
                    >
                      <a href={res.explorerUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {res.ok ? (
                <>
                  {/* Summary cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                      <div className="text-sm text-zinc-400 mb-2">{res.summary?.title ?? "Overview"}</div>
                      <div className="text-2xl font-semibold text-white">{res.summary?.amount ?? res.summary?.balance ?? "—"}</div>
                      {res.summary?.usd && res.summary.usd !== "—" ? (
                        <div className="text-sm text-zinc-300/80 mt-1">≈ {res.summary.usd}</div>
                      ) : null}
                      <div className="text-sm text-zinc-400 mt-2">{res.summary?.subtitle ?? (res.normalized ? shorten(res.normalized) : "")}</div>
                    </Card>

                    <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                      <div className="text-sm text-zinc-400 mb-2">{res.kind === "tx" ? "Confirmations" : "Transactions"}</div>
                      <div className="text-2xl font-semibold text-white">
                        {res.kind === "tx" ? res.summary?.confirmations ?? "—" : res.summary?.txCount ?? "—"}
                      </div>
                      <div className="text-sm text-zinc-400 mt-2">{res.kind === "tx" ? "Network security" : "Activity"}</div>
                    </Card>

                    <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                      <div className="text-sm text-zinc-400 mb-2">{res.kind === "tx" ? "Fee" : "Total received"}</div>
                      <div className="text-2xl font-semibold text-white">{res.kind === "tx" ? res.summary?.fee ?? "—" : res.summary?.totalReceived ?? "—"}</div>
                      {res.kind === "tx" ? (
                        <div className="text-sm text-zinc-400 mt-2">{res.summary?.timestamp ?? ""}</div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {res.summary?.usdTotalReceived && res.summary.usdTotalReceived !== "—" ? (
                            <div className="text-sm text-zinc-300/80">≈ {res.summary.usdTotalReceived}</div>
                          ) : null}
                          <div className="text-sm text-zinc-400">
                            Sent: {res.summary?.totalSent ?? "—"}
                            {res.summary?.usdTotalSent && res.summary.usdTotalSent !== "—" ? (
                              <span className="text-zinc-300/80"> • ≈ {res.summary.usdTotalSent}</span>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Details */}
                  <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-zinc-400">Details</div>
                        <div className="text-lg font-semibold text-white mt-1">{res.normalized ? shorten(res.normalized, 14, 10) : "—"}</div>
                        <div className="text-sm text-zinc-400 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          {res.summary?.contractType ? <span>Contract: <span className="text-zinc-200">{res.summary.contractType}</span></span> : null}
                          {res.summary?.status ? <span>Status: <span className="text-zinc-200">{res.summary.status}</span></span> : null}
                        </div>
                      </div>
                      <Badge className="rounded-full bg-zinc-950/40 border-zinc-800 text-zinc-300">{res.network}</Badge>
                    </div>

                    <Separator className="my-5 bg-zinc-800/80" />

                    <div className="grid gap-4 sm:grid-cols-2">
                      {res.kind === "tx" ? (
                        <>
                          <div className="text-sm text-zinc-400">
                            From
                            <div className="text-zinc-100 mt-1 break-all">{res.summary?.from ?? "—"}</div>
                          </div>
                          <div className="text-sm text-zinc-400">
                            To
                            <div className="text-zinc-100 mt-1 break-all">{res.summary?.to ?? "—"}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-zinc-400">
                            Balance
                            <div className="text-zinc-100 mt-1">{res.summary?.balance ?? "—"}</div>
                          </div>
                          <div className="text-sm text-zinc-400">
                            Total sent
                            <div className="text-zinc-100 mt-1">{res.summary?.totalSent ?? "—"}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                                    {/* Activity / extras */}
                  {res.kind === "address" && (
                    <div className={cn("grid gap-4", res.network === "TON" ? "lg:grid-cols-2" : "")}>
                      <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-zinc-400">Transactions</div>
                            <div className="text-lg font-semibold text-white mt-1">History</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setHistoryOpen((v) => !v)}
                              className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 transition"
                              aria-label={historyOpen ? "Collapse history" : "Expand history"}
                            >
                              <span className="inline-flex items-center gap-1">
                                {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span className="hidden sm:inline">{historyOpen ? "Hide" : "Show"}</span>
                              </span>
                            </button>

                            <button
                              onClick={openComments}
                              disabled={!res?.ok || res.kind !== "address" || commentsLoading}
                              className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none transition"
                            >
                              Comments
                            </button>

                            <Badge className="rounded-full bg-zinc-950/40 border-zinc-800 text-zinc-300">
                              {Array.isArray(res.txs) ? res.txs.length : 0}
                            </Badge>
                          </div>
                        </div>
                        <Separator className="my-5 bg-zinc-800/80" />
                        {historyOpen ? (
                          Array.isArray(res.txs) && res.txs.length ? (
                            <TxFeed addr={res.normalized ?? ""} txs={res.txs} />
                          ) : (
                            <div className="text-zinc-400 text-sm">No transactions found</div>
                          )
                        ) : (
                          <div className="text-zinc-500 text-sm">Collapsed</div>
                        )}
                      </Card>

                      {res.network === "TON" ? (
                        <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-zinc-400">Collectibles</div>
                              <div className="text-lg font-semibold text-white mt-1">NFTs</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setNftsOpen((v) => !v)}
                                className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 transition"
                                aria-label={nftsOpen ? "Collapse NFTs" : "Expand NFTs"}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {nftsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  <span className="hidden sm:inline">{nftsOpen ? "Hide" : "Show"}</span>
                                </span>
                              </button>

                              <Badge className="rounded-full bg-zinc-950/40 border-zinc-800 text-zinc-300">
                                {Array.isArray(res.nfts) ? res.nfts.length : 0}
                              </Badge>
                            </div>
                          </div>
                          <Separator className="my-5 bg-zinc-800/80" />
                          {nftsOpen ? (
                            Array.isArray(res.nfts) && res.nfts.length ? (
                              <NftGrid nfts={res.nfts} />
                            ) : (
                              <div className="text-zinc-400 text-sm">No NFTs found</div>
                            )
                          ) : (
                            <div className="text-zinc-500 text-sm">Collapsed</div>
                          )}
                        </Card>
                      ) : null}
                    </div>
                  )}

{/* Recent txs */}
                  {res.recentTxs?.length ? (
                    <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-zinc-400">Recent transactions</div>
                          <div className="text-white font-semibold mt-1">{res.recentTxs.length} items</div>
                        </div>
                      </div>

                      <Separator className="my-5 bg-zinc-800/80" />

                      <div className="space-y-3">
                        {res.recentTxs.slice(0, 10).map((t) => (
                          <div
                            key={t.hash}
                            className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-zinc-950/30 border border-zinc-800/70"
                          >
                            <div className="min-w-0">
                              <div className="text-zinc-100 font-medium truncate">{shorten(t.hash, 12, 10)}</div>
                              <div className="text-xs text-zinc-500 mt-1">{t.time ?? ""}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-zinc-100 font-medium">{t.value ?? "—"}</div>
                              <div className="text-xs text-zinc-500 mt-1">{t.direction ?? ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : null}
                </>
              ) : (
                <Card className="p-6 bg-zinc-900/35 border-zinc-800/70 backdrop-blur-xl rounded-3xl">
                  <div className="text-white font-semibold">Not found</div>
                  <div className="text-zinc-400 mt-2">{res.error ?? "We couldn't resolve this input. Try another address or tx hash."}</div>
                </Card>
              )}
            </div>
          )}

          {!loading && !res && (
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <Card className="p-6 bg-zinc-900/25 border-zinc-800/60 backdrop-blur-xl rounded-3xl">
                <div className="text-white font-semibold mb-2">Auto-detect</div>
                <div className="text-zinc-400 text-sm leading-relaxed">We classify addresses and tx hashes and route the lookup to the right chain.</div>
              </Card>
              <Card className="p-6 bg-zinc-900/25 border-zinc-800/60 backdrop-blur-xl rounded-3xl">
                <div className="text-white font-semibold mb-2">Lightning speed</div>
                <div className="text-zinc-400 text-sm leading-relaxed">The best and the fastest free service for exploring blockchains.</div>
              </Card>
              <Card className="p-6 bg-zinc-900/25 border-zinc-800/60 backdrop-blur-xl rounded-3xl">
                <div className="text-white font-semibold mb-2">Multi-chain</div>
                <div className="text-zinc-400 text-sm leading-relaxed">BTC, ETH, LTC are live via BlockCypher. TON/TRON ready via env keys.</div>
              </Card>
            </div>
          )}
        </div>

      {commentsMounted ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          <style>{`
            @keyframes cFadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes cFadeOut { from { opacity: 1 } to { opacity: 0 } }
            @keyframes cModalIn {
              from { opacity: 0; transform: translateY(14px) scale(.98); filter: blur(2px); }
              to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
            }
            @keyframes cModalOut {
              from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
              to   { opacity: 0; transform: translateY(10px) scale(.985); filter: blur(2px); }
            }
          `}</style>

          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            style={{
              animation: commentsPhase === "enter" ? "cFadeIn 200ms ease-out" : "cFadeOut 200ms ease-in",
            }}
            onClick={() => {
              setCommentsOpen(false)
              setCommentsError(null)
              setCommentNotice(null)
            }}
          />

          <div
            className="relative z-10 w-[760px] max-w-[95%] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 md:p-8"
            style={{
              animation:
                commentsPhase === "enter"
                  ? "cModalIn 220ms cubic-bezier(.2,.9,.2,1)"
                  : "cModalOut 220ms ease-in",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold text-white">Comments</div>
                <div className="mt-1 text-sm text-zinc-400">Comment section for the {res?.normalized ?? q} wallet</div>
              </div>
              <button
                onClick={() => {
                  setCommentsOpen(false)
                  setCommentsError(null)
                  setCommentNotice(null)
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/10 text-zinc-200 hover:bg-white/15 transition"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {commentsLoading ? (
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading comments…
                </div>
              ) : null}

              {commentsError ? (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  {commentsError}
                </div>
              ) : null}

              {commentNotice ? (
                <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  {commentNotice}
                </div>
              ) : null}

              {!commentsLoading && !commentsError ? (
                <div className="max-h-[260px] overflow-auto rounded-xl border border-white/10 bg-white/5">
                  {comments.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-400">No comments yet. Be the first.</div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {comments
                        .slice()
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .map((c) => (
                          <div key={c.id} className="p-4">
                            <div className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleString()}</div>
                            <div className="mt-1 text-sm text-zinc-200 whitespace-pre-wrap break-words">{c.text}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-2">
                {canComment ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={500}
                      placeholder="Write a comment (max 500 chars)…"
                      className="w-full min-h-[110px] rounded-xl bg-zinc-950/30 border border-white/10 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-zinc-500">{commentText.length}/500</div>
                      <button
                        onClick={submitComment}
                        disabled={commentsLoading || commentText.trim().length === 0}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-60 disabled:pointer-events-none transition"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post comment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-400">You have already posted a comment.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

<div className="mt-14 text-center text-xs text-zinc-500">
          Tip: try <span className="text-zinc-300">0x</span>… for ETH, <span className="text-zinc-300">bc1</span>… for BTC, <span className="text-zinc-300">EQ</span>… for TON.
        </div>
      </div>
    </section>
  )
}