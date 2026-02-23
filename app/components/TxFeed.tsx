"use client";

import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink } from "lucide-react";
import { fmt, shortAddr, tsToLocal } from "./utils";

type Props = {
  network: string;
  address: string;
  feed: any[];
};

// TON addresses can appear in different friendly forms (bounceable/non-bounceable, url-safe, etc.)
// while pointing to the same raw address. Normalize to raw (workchain:hash) when possible.
function normalizeTonAddress(input: string): string {
  const a = String(input || "").trim();
  if (!a) return "";

  // Raw form like: 0:abcdef...
  if (a.includes(":")) return a.toLowerCase();

  // Friendly base64/base64url form. Layout: tag(1) + wc(1) + hash(32) + crc16(2)
  try {
    const b64 = a.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = globalThis.atob(b64 + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.length < 36) return a.toLowerCase();

    const wcSigned = (bytes[1] << 24) >> 24; // int8
    const hash = bytes.slice(2, 34);
    const hex = Array.from(hash)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    return `${wcSigned}:${hex}`.toLowerCase();
  } catch {
    return a.toLowerCase();
  }
}

function getTonRow(ev: any, addr: string) {
  const actions = Array.isArray(ev?.actions) ? ev.actions : [];
  const main = actions[0] || {};
  const ts = ev?.timestamp || ev?.time || ev?.utime;
  const sender = String(main?.ton_transfer?.sender?.address || main?.sender?.address || "");
  const recipient = String(main?.ton_transfer?.recipient?.address || main?.recipient?.address || "");
  const amountNano = Number(main?.ton_transfer?.amount || main?.amount || 0);
  const amount = amountNano ? amountNano / 1e9 : null;

  const normAddr = normalizeTonAddress(addr);
  const normSender = normalizeTonAddress(sender);
  const normRecipient = normalizeTonAddress(recipient);

  const isIn = !!(normRecipient && normRecipient === normAddr);
  const isOut = !!(normSender && normSender === normAddr);

  const hash = String(ev?.event_id || ev?.id || ev?.hash || "");

  return {
    ts,
    type: String(main?.type || "Event"),
    sender,
    recipient,
    amount,
    direction: isIn ? "in" : isOut ? "out" : "neutral",
    hash,
    openUrl: hash ? `https://tonviewer.com/transaction/${encodeURIComponent(hash)}` : null,
  };
}

function getBtcRow(tx: any, addr: string, network: string) {
  const ts = tx?.confirmed ? Math.floor(new Date(tx.confirmed).getTime() / 1000) : undefined;
  const hash = String(tx?.hash || "");

  const inputs = Array.isArray(tx?.inputs) ? tx.inputs : [];
  const outputs = Array.isArray(tx?.outputs) ? tx.outputs : [];

  let inSat = 0;
  let outSat = 0;

  for (const o of outputs) {
    const addrs = Array.isArray(o?.addresses) ? o.addresses : [];
    if (addrs.includes(addr)) inSat += Number(o?.value || 0);
  }

  for (const i of inputs) {
    const addrs = Array.isArray(i?.addresses) ? i.addresses : [];
    if (addrs.includes(addr)) outSat += Number(i?.output_value || 0);
  }

  const net = (inSat - outSat) / 1e8;
  const direction = net > 0 ? "in" : net < 0 ? "out" : "neutral";

  const from = inputs?.[0]?.addresses?.[0] || "";
  const to = outputs?.[0]?.addresses?.[0] || "";

  const openUrl = network === "BTC"
    ? `https://www.blockchain.com/btc/tx/${encodeURIComponent(hash)}`
    : `https://blockchair.com/litecoin/transaction/${encodeURIComponent(hash)}`;

  return {
    ts,
    type: "Transfer",
    sender: String(from),
    recipient: String(to),
    amount: Math.abs(net),
    direction,
    hash,
    openUrl,
    unit: network,
  };
}

export function TxFeed({ network, address, feed }: Props) {
  if (!Array.isArray(feed) || feed.length === 0) {
    return <div className="text-white/45">No activity found.</div>;
  }

  const rows = feed
    .map((item) => {
      if (network === "TON") return getTonRow(item, address);
      if (network === "BTC" || network === "LTC") return getBtcRow(item, address, network);
      return null;
    })
    .filter(Boolean) as any[];

  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const isIn = r.direction === "in";
        const isOut = r.direction === "out";
        const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
        const sign = isIn ? "+" : isOut ? "-" : "";
        const unit = r.unit || (network === "TON" ? "TON" : network);

        return (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 flex items-center gap-3"
          >
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                isIn
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : isOut
                    ? "border-rose-400/30 bg-rose-400/10"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4 text-white/80" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-white/90 font-medium truncate">{r.type}</div>
                <div className="text-white/40 text-xs">• {tsToLocal(r.ts)}</div>
              </div>
              <div className="text-white/55 text-sm flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  From: <span className="text-white/75">{shortAddr(r.sender)}</span>
                </span>
                <span>
                  To: <span className="text-white/75">{shortAddr(r.recipient)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {typeof r.amount === "number" && (
                <div
                  className={`text-sm font-semibold tabular-nums ${
                    isIn ? "text-emerald-300" : isOut ? "text-rose-300" : "text-white/70"
                  }`}
                >
                  {sign}{fmt(r.amount, 6)} {unit}
                </div>
              )}

              <button
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2"
                onClick={() => navigator.clipboard.writeText(String(r.hash || ""))}
                title="Copy hash"
              >
                <Copy className="h-4 w-4 text-white/70" />
              </button>

              {r.openUrl && (
                <a
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2"
                  href={r.openUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in explorer"
                >
                  <ExternalLink className="h-4 w-4 text-white/70" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
