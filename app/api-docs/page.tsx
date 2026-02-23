import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="API"
      subtitle="POST /api/lookup — summary + transactions"
      sections={[
        { h: "Endpoint", p: "POST https://palechain.sbs/api/lookup" },
        { h: "Headers", p: "Content-Type: application/json" },
        { h: "Body", p: '{\n  "query": "ADDRESS",\n  "network": "AUTO"\n}' },
        {
          h: "Response",
          p: "Returns { summary, txs }.\n\nsummary: balance, usd, txCount, totalReceived, totalSent, etc.\n\ntxs: recent transfers with timestamp, kind (in/out), amount, symbol, amountUsd, from, to.",
        },
        {
          h: "Example",
          p: "curl -s -X POST https://palechain.sbs/api/lookup \\\n+  -H \"Content-Type: application/json\" \\\n+  -d '{\"query\":\"ADDRESS\",\"network\":\"AUTO\"}'",
        },
      ]}
    />
  )
}
