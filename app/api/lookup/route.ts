import { NextResponse } from "next/server"
import { Address } from "@ton/core"

type Network = "BTC" | "ETH" | "LTC" | "TON" | "TRON" | "UNKNOWN"
type Kind = "address" | "tx" | "unknown"
type NetworkOrAuto = Network | "AUTO"

function fmt(n: number, digits = 6) {
  if (!Number.isFinite(n)) return "—"
  const s = n.toFixed(digits)
  return s.replace(/\.0+$|(?<=\.[0-9]*?)0+$/, "").replace(/\.$/, "")
}

function explorerUrl(network: Network, kind: Kind, value: string) {
  const v = encodeURIComponent(value)
  if (network === "BTC") return kind === "tx" ? `https://www.blockchain.com/btc/tx/${v}` : `https://www.blockchain.com/btc/address/${v}`
  if (network === "ETH") return kind === "tx" ? `https://etherscan.io/tx/${v}` : `https://etherscan.io/address/${v}`
  if (network === "LTC") return kind === "tx" ? `https://blockchair.com/litecoin/transaction/${v}` : `https://blockchair.com/litecoin/address/${v}`
  if (network === "TRON") return kind === "tx" ? `https://tronscan.org/#/transaction/${v}` : `https://tronscan.org/#/address/${v}`
  if (network === "TON") return kind === "tx" ? `https://tonviewer.com/transaction/${v}` : `https://tonviewer.com/${v}`
  return ""
}

function detectInput(raw: string): { kind: Kind; network: Network } {
  const v = (raw || "").trim()
  if (!v) return { kind: "unknown", network: "UNKNOWN" }

  // ETH
  if (/^0x[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: "ETH" }
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return { kind: "address", network: "ETH" }

  // Common 64-hex tx (BTC/LTC/TRON unknown until probed)
  if (/^[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: "UNKNOWN" }

  // BTC (support long bech32, incl taproot)
  if (/^(1|3)[a-zA-Z0-9]{25,62}$/.test(v)) return { kind: "address", network: "BTC" }
  if (/^bc1[ac-hj-np-z02-9]{11,90}$/i.test(v)) return { kind: "address", network: "BTC" }

  // LTC (legacy + bech32)
  if (/^(L|M)[a-zA-Z0-9]{25,62}$/.test(v)) return { kind: "address", network: "LTC" }
  if (/^ltc1[ac-hj-np-z02-9]{11,90}$/i.test(v)) return { kind: "address", network: "LTC" }

  // TRON
  if (/^T[a-zA-Z0-9]{33}$/.test(v)) return { kind: "address", network: "TRON" }

  // TON (friendly base64url-ish: EQ... / UQ...)
  if (/^(EQ|UQ|kQ)[A-Za-z0-9_-]{46}$/.test(v)) return { kind: "address", network: "TON" }

  // TON raw form: wc:hex
  if (/^-?\d+:[a-fA-F0-9]{64}$/.test(v)) return { kind: "address", network: "TON" }

  return { kind: "unknown", network: "UNKNOWN" }
}

function forceNetwork(raw: string, forced: NetworkOrAuto | undefined | null): { kind: Kind; network: Network } {
  const v = (raw || "").trim()
  if (!forced || forced === "AUTO") return detectInput(v)

  // If user forces a network, try to classify kind within that network.
  if (forced === "ETH") {
    if (/^0x[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: "ETH" }
    return { kind: "address", network: "ETH" }
  }
  if (forced === "BTC" || forced === "LTC") {
    if (/^[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: forced }
    return { kind: "address", network: forced }
  }
  if (forced === "TRON") {
    // Tron tx id is 64 hex usually
    if (/^[a-fA-F0-9]{64}$/.test(v)) return { kind: "tx", network: "TRON" }
    return { kind: "address", network: "TRON" }
  }
  if (forced === "TON") {
    // Ton tx id can vary (base64url), but most users paste address
    return { kind: "address", network: "TON" }
  }

  return detectInput(v)
}

function mock(kind: Kind, network: Network, query: string) {
  return {
    ok: true,
    kind,
    network,
    normalized: query,
    explorerUrl: explorerUrl(network, kind, query),
    summary: {
      title: kind === "tx" ? "Transaction" : "Wallet",
      subtitle: query,
      balance: "—",
      usd: "—",
      usdBalance: "—",
      usdTotalReceived: "—",
      usdTotalSent: "—",
      txCount: "—",
      totalReceived: "—",
      totalSent: "—",
      status: "mock",
    },
    txs: [],
    nfts: [],
    raw: null,
  }
}

type BaseTx = {
  id: string
  timestamp?: number
  kind: "in" | "out" | "other"
  amount?: number
  symbol?: string
  amountUsd?: number
  from?: string
  to?: string
  type?: string
  explorerUrl?: string
}

type TonTx = {
  id: string
  timestamp?: number
  kind: "in" | "out" | "other"
  amountTon?: number
  from?: string
  to?: string
  type?: string
}

function toRawTonAddress(v: string) {
  const s = (v || "").trim()
  if (!s) return s
  try {
    // raw form "0:..." or "-1:..."
    return Address.parse(s).toRawString()
  } catch {
    try {
      // friendly form "EQ..." / "UQ..." etc
      return Address.parseFriendly(s).address.toRawString()
    } catch {
      return s
    }
  }
}

function toFriendlyTonAddress(v: string) {
  const s = (v || "").trim()
  if (!s) return s
  try {
    const a = Address.parse(s)
    return a.toString({ urlSafe: true, bounceable: true })
  } catch {
    try {
      const a = Address.parseFriendly(s).address
      return a.toString({ urlSafe: true, bounceable: true })
    } catch {
      return s
    }
  }
}

function pickImage(nft: any): string | undefined {
  const meta = nft?.metadata || {}
  const direct = meta?.image || meta?.image_url || meta?.imageUrl
  if (typeof direct === "string" && direct) return direct
  const previews = nft?.previews
  if (Array.isArray(previews) && previews.length) {
    const best = previews[0]?.url || previews[0]?.src
    if (typeof best === "string" && best) return best
  }
  const img = nft?.image?.original || nft?.image?.url
  if (typeof img === "string" && img) return img
  return undefined
}

function parseTonEvents(events: any[], addrRaw: string): { txs: TonTx[]; totalIn: number; totalOut: number } {
  const txs: TonTx[] = []
  let totalIn = 0
  let totalOut = 0

  // Normalize once. TonAPI/tonviewer may return raw addresses in different casing.
  const addrKey = String(addrRaw || "").trim().toLowerCase()

  for (const ev of events) {
    const ts = Number(ev?.timestamp || ev?.time || ev?.utime || 0) || undefined
    const id = String(ev?.event_id || ev?.id || ev?.hash || "")
    const actions = Array.isArray(ev?.actions) ? ev.actions : []

    // try to find a transfer-like action as primary
    let primary: any = null
    for (const a of actions) {
      const t = String(a?.type || "").toLowerCase()
      if (t.includes("ton_transfer") || t.includes("transfer")) { primary = a; break }
    }
    if (!primary) primary = actions[0] || null

    const type = String(primary?.type || "event")

    // TonAPI can return different shapes for action payloads (snake_case/camelCase)
    const payload =
      primary?.ton_transfer ??
      primary?.tonTransfer ??
      primary?.TonTransfer ??
      primary?.jetton_transfer ??
      primary?.jettonTransfer ??
      primary?.JettonTransfer ??
      primary

    const senderRaw = String(payload?.sender?.address || payload?.from?.address || payload?.from || primary?.sender?.address || primary?.from?.address || primary?.from || "")
    const recipientRaw = String(payload?.recipient?.address || payload?.to?.address || payload?.to || primary?.recipient?.address || primary?.to?.address || primary?.to || "")

    const senderNorm = senderRaw ? toRawTonAddress(senderRaw) : ""
    const recipientNorm = recipientRaw ? toRawTonAddress(recipientRaw) : ""

    // Prefer normalized raw addresses, but fall back to raw strings if normalization fails.
    const senderKey = String(senderNorm || senderRaw || "").trim().toLowerCase()
    const recipientKey = String(recipientNorm || recipientRaw || "").trim().toLowerCase()

    // keep friendly for display where possible
    const senderDisp = senderRaw ? toFriendlyTonAddress(senderRaw) : ""
    const recipientDisp = recipientRaw ? toFriendlyTonAddress(recipientRaw) : ""

    const amountNano = Number(payload?.amount || primary?.amount || 0) || 0
    const amountTon = amountNano > 0 ? amountNano / 1e9 : undefined

    let kind: TonTx["kind"] = "other"
    if (recipientKey && recipientKey === addrKey) {
      kind = "in"
      if (amountNano > 0) totalIn += amountNano
    } else if (senderKey && senderKey === addrKey) {
      kind = "out"
      if (amountNano > 0) totalOut += amountNano
    }

    txs.push({
      id,
      timestamp: ts,
      kind,
      amountTon,
      from: senderDisp || senderNorm || undefined,
      to: recipientDisp || recipientNorm || undefined,
      type,
    })
  }

  return { txs, totalIn, totalOut }
}

async function tryFetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { cache: "no-store", ...(init || {}) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

async function fetchPriceUsd(coinId: string): Promise<number | null> {
  try {
    const price = await tryFetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`)
    const p = Number(price?.[coinId]?.usd)
    return Number.isFinite(p) ? p : null
  } catch {
    return null
  }
}

function usdStr(v: number | null | undefined) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—"
  return `$${fmt(v, 2)}`
}

function mapBlockcypherTxRefs(txrefs: any[], symbol: string, unitDiv: number, addr: string, net: Network): BaseTx[] {
  if (!Array.isArray(txrefs)) return []
  return txrefs.slice(0, 30).map((t: any) => {
    const id = String(t?.tx_hash || t?.hash || "")
    const confirmed = String(t?.confirmed || "")
    const timestamp = confirmed ? Math.floor(new Date(confirmed).getTime() / 1000) : undefined
    const value = Number(t?.value ?? 0) || 0
    // BlockCypher txrefs convention:
    // - tx_input_n === -1 => address is in outputs => incoming
    // - tx_output_n === -1 => address is in inputs => outgoing
    const inputN = Number(t?.tx_input_n)
    const outputN = Number(t?.tx_output_n)
    const kind: BaseTx["kind"] = inputN === -1 ? "in" : outputN === -1 ? "out" : "other"

    return {
      id,
      timestamp,
      kind,
      amount: value / unitDiv,
      symbol,
      from: kind === "in" ? undefined : addr,
      to: kind === "out" ? undefined : addr,
      type: "transfer",
      explorerUrl: explorerUrl(net, "tx", id),
    }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const query = String(body?.query ?? "").trim()
    const forced = (body?.network as NetworkOrAuto | undefined) ?? "AUTO"
    const guess = forceNetwork(query, forced)

    if (!query) {
      return NextResponse.json({ ok: false, kind: "unknown", network: "UNKNOWN", error: "Empty query" }, { status: 400 })
    }

    // TON (TonAPI)
    if (guess.network === "TON" && guess.kind === "address") {
      const addr = toRawTonAddress(query)

      try {
        const account = await tryFetchJson(`https://tonapi.io/v2/accounts/${encodeURIComponent(addr)}`, {
          headers: { "User-Agent": "explorer-ui" },
        })

        const balanceNano = typeof account?.balance === "number" ? account.balance : 0
        const balanceTon = balanceNano / 1e9

        const [pTon, eventsObj, nftsObj] = await Promise.all([
          fetchPriceUsd("the-open-network"),
          Promise.allSettled([
            tryFetchJson(`https://tonapi.io/v2/accounts/${encodeURIComponent(addr)}/events?limit=30`, { headers: { "User-Agent": "explorer-ui" } }),
            tryFetchJson(`https://tonapi.io/v2/accounts/${encodeURIComponent(addr)}/nfts?limit=30`, { headers: { "User-Agent": "explorer-ui" } }),
          ]).then((r) => r),
          Promise.resolve(null),
        ])

        const settled = eventsObj as any
        const eventsRaw = settled?.[0]?.status === "fulfilled" ? settled[0].value : null
        const nftsRaw = settled?.[1]?.status === "fulfilled" ? settled[1].value : null

        const events = Array.isArray(eventsRaw?.events) ? eventsRaw.events : []
        const parsed = parseTonEvents(events, addr)

        const nftItems = Array.isArray(nftsRaw?.nft_items) ? nftsRaw.nft_items : (Array.isArray(nftsRaw?.items) ? nftsRaw.items : [])
        const nfts = nftItems.slice(0, 24).map((it: any) => ({
          address: String(it?.address || it?.nft_address || ""),
          name: String(it?.metadata?.name || it?.name || "NFT"),
          image: pickImage(it),
          collection: String(it?.collection?.name || it?.collection_name || ""),
        }))

        const usdBalanceNum = pTon ? balanceTon * pTon : null
        const usdReceivedNum = pTon ? (parsed.totalIn / 1e9) * pTon : null
        const usdSentNum = pTon ? (parsed.totalOut / 1e9) * pTon : null

        const txs: BaseTx[] = parsed.txs.map((t) => {
          const amount = typeof t.amountTon === "number" ? t.amountTon : undefined
          return {
            id: t.id,
            timestamp: t.timestamp,
            kind: t.kind,
            amount,
            symbol: "TON",
            amountUsd: pTon && typeof amount === "number" ? amount * pTon : undefined,
            from: t.from,
            to: t.to,
            type: t.type,
            explorerUrl: explorerUrl("TON", "tx", t.id),
          }
        })

        return NextResponse.json({
          ok: true,
          kind: "address",
          network: "TON",
          normalized: addr,
          explorerUrl: explorerUrl("TON", "address", addr),
          summary: {
            title: account?.is_wallet ? "Wallet" : "Account",
            subtitle: query,
            status: String(account?.status || "unknown"),
            contractType: String(account?.contract_type || account?.interfaces?.[0] || ""),
            balance: `${fmt(balanceTon, 6)} TON`,
            usd: usdStr(usdBalanceNum),
            usdBalance: usdStr(usdBalanceNum),
            txCount: String(events.length || "—"),
            totalReceived: `${fmt(parsed.totalIn / 1e9, 6)} TON`,
            totalSent: `${fmt(parsed.totalOut / 1e9, 6)} TON`,
            usdTotalReceived: usdStr(usdReceivedNum),
            usdTotalSent: usdStr(usdSentNum),
          },
          txs,
          nfts,
          raw: { account, events: eventsRaw, nfts: nftsRaw },
        })
      } catch {
        return NextResponse.json(mock("address", "TON", query))
      }
    }

    // BTC/LTC/ETH via BlockCypher (works w/out keys for basic usage)
    if ((guess.network === "BTC" || guess.network === "LTC" || guess.network === "ETH") && guess.kind === "address") {
      const chain = guess.network === "BTC" ? "btc/main" : guess.network === "LTC" ? "ltc/main" : "eth/main"
      const symbol = guess.network
      const unitDiv = guess.network === "ETH" ? 1e18 : 1e8
      const coinId = guess.network === "BTC" ? "bitcoin" : guess.network === "LTC" ? "litecoin" : "ethereum"

      try {
        // include txrefs
        const raw = await tryFetchJson(`https://api.blockcypher.com/v1/${chain}/addrs/${encodeURIComponent(query)}?limit=30`)
        const bal = Number(raw?.balance ?? 0) / unitDiv
        const totalR = Number(raw?.total_received ?? 0) / unitDiv
        const totalS = Number(raw?.total_sent ?? 0) / unitDiv
        const p = await fetchPriceUsd(coinId)

        const txrefs = Array.isArray(raw?.txrefs) ? raw.txrefs : (Array.isArray(raw?.txrefs) ? raw.txrefs : [])
        const txs = mapBlockcypherTxRefs(txrefs, symbol, unitDiv, query, guess.network).map((t) => ({
          ...t,
          amountUsd: p && typeof t.amount === "number" ? t.amount * p : undefined,
        }))

        return NextResponse.json({
          ok: true,
          kind: "address",
          network: guess.network,
          normalized: query,
          explorerUrl: explorerUrl(guess.network, "address", query),
          summary: {
            title: "Wallet",
            subtitle: query,
            balance: `${fmt(bal, guess.network === "ETH" ? 6 : 8)} ${symbol}`,
            usd: usdStr(p ? bal * p : null),
            usdBalance: usdStr(p ? bal * p : null),
            txCount: String(raw?.n_tx ?? "—"),
            totalReceived: `${fmt(totalR, guess.network === "ETH" ? 6 : 8)} ${symbol}`,
            totalSent: `${fmt(totalS, guess.network === "ETH" ? 6 : 8)} ${symbol}`,
            usdTotalReceived: usdStr(p ? totalR * p : null),
            usdTotalSent: usdStr(p ? totalS * p : null),
            status: "ok",
          },
          txs,
          raw,
        })
      } catch {
        return NextResponse.json(mock("address", guess.network, query))
      }
    }

    // TRON via Tronscan (best-effort, no key)
    if (guess.network === "TRON" && guess.kind === "address") {
      try {
        const [acct, txList, pTrx] = await Promise.all([
          tryFetchJson(`https://apilist.tronscanapi.com/api/account?address=${encodeURIComponent(query)}`),
          tryFetchJson(`https://apilist.tronscanapi.com/api/transaction?sort=-timestamp&count=true&limit=30&start=0&address=${encodeURIComponent(query)}`),
          fetchPriceUsd("tron"),
        ])

        // balance in SUN sometimes; tronscan gives balance in "balance" (SUN)
        const balSun = Number(acct?.balance ?? acct?.data?.[0]?.balance ?? 0) || 0
        const bal = balSun / 1e6

        const txsRaw = Array.isArray(txList?.data) ? txList.data : []
        const txs: BaseTx[] = txsRaw.slice(0, 30).map((t: any) => {
          const id = String(t?.hash || t?.transactionHash || "")
          const ts = Number(t?.timestamp || 0)
          const timestamp = ts ? Math.floor(ts / 1000) : undefined

          // direction and amount
          const from = String(t?.ownerAddress || t?.fromAddress || t?.from || "")
          const to = String(t?.toAddress || t?.to || "")
          const contractType = String(t?.contractType || t?.type || "transfer")

          // many trx transfers show amount in "amount" (SUN)
          const amountSun = Number(t?.amount ?? t?.contractData?.amount ?? 0) || 0
          const amount = amountSun / 1e6

          let kind: BaseTx["kind"] = "other"
          if (to && to === query) kind = "in"
          else if (from && from === query) kind = "out"

          return {
            id,
            timestamp,
            kind,
            amount,
            symbol: "TRX",
            amountUsd: pTrx && Number.isFinite(amount) ? amount * pTrx : undefined,
            from: from || undefined,
            to: to || undefined,
            type: contractType,
            explorerUrl: explorerUrl("TRON", "tx", id),
          }
        })

        // totals not always provided; compute from tx list slice as best-effort
        const totalIn = txs.filter((t) => t.kind === "in").reduce((a, b) => a + (b.amount ?? 0), 0)
        const totalOut = txs.filter((t) => t.kind === "out").reduce((a, b) => a + (b.amount ?? 0), 0)

        return NextResponse.json({
          ok: true,
          kind: "address",
          network: "TRON",
          normalized: query,
          explorerUrl: explorerUrl("TRON", "address", query),
          summary: {
            title: "Wallet",
            subtitle: query,
            balance: `${fmt(bal, 6)} TRX`,
            usd: usdStr(pTrx ? bal * pTrx : null),
            usdBalance: usdStr(pTrx ? bal * pTrx : null),
            txCount: String(txList?.total ?? txList?.rangeTotal ?? txs.length ?? "—"),
            totalReceived: `${fmt(totalIn, 6)} TRX`,
            totalSent: `${fmt(totalOut, 6)} TRX`,
            usdTotalReceived: usdStr(pTrx ? totalIn * pTrx : null),
            usdTotalSent: usdStr(pTrx ? totalOut * pTrx : null),
            status: "ok",
          },
          txs,
          raw: { acct, txList },
        })
      } catch {
        return NextResponse.json(mock("address", "TRON", query))
      }
    }

    // fallback
    return NextResponse.json({ ok: false, kind: guess.kind, network: guess.network, error: "Unsupported or unknown input" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, kind: "unknown", network: "UNKNOWN", error: e?.message ?? "Server error" }, { status: 500 })
  }
}
