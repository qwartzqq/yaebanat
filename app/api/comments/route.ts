import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

type Comment = {
  id: string
  createdAt: number
  text: string
}

const SALT = process.env.COMMENTS_SALT || "pale-comments-salt"

// Fallback in-memory store (dev only). In serverless this is best-effort.
const mem = globalThis as any
mem.__PALE_COMMENTS__ = mem.__PALE_COMMENTS__ || new Map<string, Comment[]>()
mem.__PALE_COMMENT_IPS__ = mem.__PALE_COMMENT_IPS__ || new Map<string, Set<string>>()

function ipFrom(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0].trim()

  const xvercel = req.headers.get("x-vercel-forwarded-for")
  if (xvercel) return xvercel.split(",")[0].trim()

  const cf = req.headers.get("cf-connecting-ip")
  if (cf) return cf.trim()

  const xr = req.headers.get("x-real-ip")
  if (xr) return xr.trim()

  return "127.0.0.1"
}


function ipHash(ip: string) {
  return crypto.createHash("sha256").update(ip + "|" + SALT).digest("hex")
}

function sanitizePlainText(input: string) {
  // Treat all user text as plain text (no HTML). This protects against stored XSS.
  const s = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim()

  // Escape just in case this ever gets rendered as HTML somewhere.
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function isSafeKeyPart(s: string) {
  // avoid weird key injection / runaway keys
  return /^[A-Z0-9:_\-\.]{2,80}$/i.test(s)
}

async function getKV() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  try {
    const mod = await import("@vercel/kv")
    return mod.kv
  } catch {
    return null
  }
}

function keyFor(network: string, address: string) {
  return `comments:${network}:${address}`
}
function ipKeyFor(network: string, address: string) {
  return `commentips:${network}:${address}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const network = (searchParams.get("network") || "").toUpperCase()
  const address = (searchParams.get("address") || "").trim()
  if (!network || !address) {
    return NextResponse.json({ ok: false, error: "Missing network or address" }, { status: 400 })
  }

  const ip = ipFrom(req)
  const ih = ipHash(ip)

  const kv = await getKV()
  if (kv) {
    const k = keyFor(network, address)
    const ik = ipKeyFor(network, address)

    const [comments, already] = await Promise.all([
      kv.get<Comment[]>(k),
      kv.sismember(ik, ih),
    ])

    return NextResponse.json({
      ok: true,
      network,
      address,
      canPost: !already,
      comments: comments || [],
      storage: "kv",
    })
  }

  const k = keyFor(network, address)
  const ik = ipKeyFor(network, address)
  const comments: Comment[] = mem.__PALE_COMMENTS__.get(k) || []
  const set: Set<string> = mem.__PALE_COMMENT_IPS__.get(ik) || new Set()
  return NextResponse.json({
    ok: true,
    network,
    address,
    canPost: !set.has(ih),
    comments,
    storage: "memory",
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any
  const network = (body?.network || "").toUpperCase()
  const address = (body?.address || "").trim()
  const textRaw = (body?.text || "").toString()
  const text = sanitizePlainText(textRaw)

  if (!network || !address || !text) {
    return NextResponse.json({ ok: false, error: "Missing network/address/text" }, { status: 400 })
  }

  if (!isSafeKeyPart(network) || address.length > 200) {
    return NextResponse.json({ ok: false, error: "Invalid network/address" }, { status: 400 })
  }

  if (text.length > 500) {
    return NextResponse.json({ ok: false, error: "Comment too long (max 500 chars)" }, { status: 400 })
  }

  const ip = ipFrom(req)
  const ih = ipHash(ip)

  const kv = await getKV()
  if (kv) {
    const k = keyFor(network, address)
    const ik = ipKeyFor(network, address)

    const already = await kv.sismember(ik, ih)
    if (already) {
      return NextResponse.json({ ok: false, error: "You have already posted a comment." }, { status: 403 })
    }

    const comment = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      text,
    } satisfies Comment

    // store: add ip to set and append comment
    await kv.sadd(ik, ih)
    // Keep comments list reasonably sized
    await kv.rpush(k, comment as any)
    await kv.ltrim(k, -200, -1)

    // Convert list to array for response
    const list = await kv.lrange(k, 0, -1) as Comment[]
    return NextResponse.json({ ok: true, comment, comments: list, canPost: false, storage: "kv" })
  }

  const k = keyFor(network, address)
  const ik = ipKeyFor(network, address)

  const set: Set<string> = mem.__PALE_COMMENT_IPS__.get(ik) || new Set()
  if (set.has(ih)) {
    return NextResponse.json({ ok: false, error: "You have already posted a comment." }, { status: 403 })
  }
  set.add(ih)
  mem.__PALE_COMMENT_IPS__.set(ik, set)

  const comment = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    text,
  } satisfies Comment

  const comments: Comment[] = mem.__PALE_COMMENTS__.get(k) || []
  comments.push(comment)
  mem.__PALE_COMMENTS__.set(k, comments.slice(-200))

  return NextResponse.json({ ok: true, comment, comments: mem.__PALE_COMMENTS__.get(k), canPost: false, storage: "memory" })
}
