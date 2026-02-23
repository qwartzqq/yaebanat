import Link from "next/link"
import { notFound } from "next/navigation"

const PAGES: Record<
  string,
  { title: string; subtitle: string; sections: Array<{ h: string; p: string }> }
> = {
  product: {
    title: "Product",
    subtitle: "A minimal, fast multi-chain explorer UI + API.",
    sections: [
      { h: "Explorer", p: "Search wallets and transactions with clean, readable cards and quick actions." },
      { h: "API", p: "Use a single lookup endpoint to fetch summary + recent transactions." },
      { h: "Built for speed", p: "Light UI, quick responses, mobile-friendly layout." },
    ],
  },
  features: {
    title: "Features",
    subtitle: "A clean, multi-chain explorer built for speed and clarity.",
    sections: [
      { h: "Multi-chain", p: "Search addresses and transactions across BTC, ETH, LTC, TON and TRON." },
      { h: "Transaction history", p: "Readable activity feed with copy/open actions and USD estimates." },
      { h: "Wallet insights", p: "Balances, totals, and key metadata displayed in clean glass cards." },
    ],
  },
  api: {
    title: "API",
    subtitle: "One endpoint. Summary + transactions.",
    sections: [
      { h: "Endpoint", p: "POST https://palechain.sbs/api/lookup" },
      { h: "Headers", p: "Content-Type: application/json" },
      { h: "Body", p: "{ \"query\": \"ADDRESS\", \"network\": \"AUTO\" }" },
      { h: "Response", p: "Returns { summary, txs } where summary contains balance/usd/txCount/etc, and txs is a list of recent transactions." },
      { h: "Example", p: "curl -X POST https://palechain.sbs/api/lookup -H \"Content-Type: application/json\" -d '{\"query\":\"ADDRESS\",\"network\":\"AUTO\"}'" },
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle: "Simple. Free.",
    sections: [
      { h: "Free tier", p: "All core features are available at no cost." },
      { h: "Rate limits", p: "Reasonable rate limits apply to keep the service fast and reliable." },
      { h: "Future", p: "If paid plans are introduced, core features will remain available." },
    ],
  },
  docs: {
    title: "Documentation",
    subtitle: "Quick notes for using the explorer.",
    sections: [
      { h: "Search input", p: "Paste an address or transaction hash. Use the network selector if needed." },
      { h: "Auto-detect", p: "Auto mode infers the correct network from the input format when possible." },
      { h: "USD conversion", p: "USD values are estimates based on public price data and may be delayed." },
    ],
  },
  documentation: {
    title: "Documentation",
    subtitle: "How to use Pale (UI + API).",
    sections: [
      { h: "Explorer", p: "Paste an address/tx hash, check summary cards, open the explorer link, copy any field with one click." },
      { h: "Comments", p: "Leave a short note per wallet (anti-spam restrictions may apply)." },
      { h: "API", p: "Use /api for the lookup endpoint description and request example." },
    ],
  },
  company: {
    title: "Company",
    subtitle: "Small team. Clean product.",
    sections: [
      { h: "Mission", p: "Make on-chain data readable and fast to access." },
      { h: "Values", p: "Simplicity, performance, privacy-first by default." },
    ],
  },
  about: {
    title: "About",
    subtitle: "Pale is a lightweight explorer UI.",
    sections: [
      { h: "Purpose", p: "Make on-chain data easier to read without clutter." },
      { h: "Privacy-first", p: "No accounts required. Minimal data for anti-spam only." },
      { h: "Built to customize", p: "This is a modular Next.js project you can extend." },
    ],
  },
  blog: {
    title: "Blog",
    subtitle: "Updates and notes.",
    sections: [
      { h: "No posts yet", p: "This page is ready. Add your posts in the code whenever you want." },
      { h: "Changelog", p: "Use /changelog for release notes and changes." },
    ],
  },
  changelog: {
    title: "Changelog",
    subtitle: "What changed in recent releases.",
    sections: [
      { h: "Comments", p: "Wallet comment system with one comment per IP per wallet." },
      { h: "Detection", p: "Stricter auto-detect for TON to reduce false positives." },
      { h: "Stability", p: "Safer API parsing and local-dev friendly fallbacks." },
    ],
  },
  careers: {
    title: "Careers",
    subtitle: "We hire when it makes sense.",
    sections: [
      { h: "Open roles", p: "No public openings right now. Check back later." },
      { h: "What we like", p: "Product-minded engineers and designers who care about speed and UX." },
    ],
  },
  contact: {
    title: "Contact",
    subtitle: "Get in touch.",
    sections: [
      { h: "Support", p: "Questions, bug reports, or feature requests — reach out via your preferred channel." },
      { h: "Business", p: "Partnerships and integrations are welcome." },
    ],
  },
  legal: {
    title: "Legal",
    subtitle: "Policies and security notes.",
    sections: [
      { h: "Privacy", p: "See /privacy for what we collect (minimal)." },
      { h: "Terms", p: "See /terms for usage rules and disclaimers." },
      { h: "Security", p: "See /security for our security posture and reporting." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Short version: we keep it minimal.",
    sections: [
      { h: "No accounts", p: "We do not require you to create an account to use Pale." },
      { h: "IP usage", p: "IP may be used for anti-spam (comments). We store only a hashed identifier." },
      { h: "Analytics", p: "If enabled, analytics help improve performance and UX." },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Use responsibly.",
    sections: [
      { h: "No warranties", p: "The service is provided “as is” without warranties of any kind." },
      { h: "Accuracy", p: "Data and USD estimates may be delayed or incomplete. Verify important info independently." },
      { h: "Abuse", p: "Do not spam, scrape aggressively, or attack the service. Access may be limited." },
    ],
  },
  security: {
    title: "Security",
    subtitle: "Basic security posture.",
    sections: [
      { h: "Headers", p: "We apply standard security headers (CSP, X-Frame-Options, etc.) to reduce common attacks." },
      { h: "Input handling", p: "User-generated text is treated as plain text and sanitized on the server." },
      { h: "Reporting", p: "If you find an issue, report it responsibly." },
    ],
  },
}

export default function Page({ params }: { params: { slug: string } }) {
  const slug = (params.slug || "").toLowerCase()
  const page = PAGES[slug]
  if (!page) return notFound()

  return (
    <main className="min-h-screen text-zinc-100 relative overflow-hidden">
      {/* Background (match explorer vibe) */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-14 md:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-800 text-zinc-300 text-xs">
              <span className="font-semibold">Pale</span>
              <span className="text-zinc-500">•</span>
              <span className="truncate">{page.title}</span>
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight font-display">
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">{page.title}</span>
            </h1>
            <p className="mt-3 text-zinc-300/85 max-w-2xl leading-relaxed">{page.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm rounded-xl bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 transition"
            >
              Back to home
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4">
          {page.sections.map((s) => (
            <div key={s.h} className="relative rounded-3xl bg-zinc-900/35 border border-zinc-800/70 backdrop-blur-xl p-6 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/5 via-transparent to-white/5" />
              <div className="relative">
                <div className="text-lg font-semibold text-white">{s.h}</div>
                <div className="mt-2 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{s.p}</div>
              </div>
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
