import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Features"
      subtitle="A clean, multi-chain explorer built for speed and clarity."
      sections={[
        { h: "Multi-chain", p: "Search addresses and transactions across BTC, ETH, LTC, TON and TRON." },
        { h: "Transaction history", p: "Readable activity feed with timestamps and USD values." },
        { h: "Wallet insights", p: "Balances, totals, and key metadata displayed in clean glass cards." },
      ]}
    />
  )
}
