import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Product"
      subtitle="A minimal, fast multi-chain explorer UI + API."
      sections={[
        { h: "Explorer", p: "Search wallets and transactions with clean, readable cards and quick actions." },
        { h: "API", p: "Use a single lookup endpoint to fetch summary + recent transactions." },
        { h: "Built for speed", p: "Light UI, quick responses, mobile-friendly layout." },
      ]}
    />
  )
}
