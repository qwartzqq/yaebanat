import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Documentation"
      subtitle="How to use Pale (UI + API)."
      sections={[
        { h: "Explorer", p: "Paste an address/tx hash. Check summary cards, open explorer links, copy any field with one click." },
        { h: "Comments", p: "Leave a short note per wallet. Anti-spam restrictions may apply." },
        { h: "API", p: "Use the API modal in the header or open /api-docs for the full endpoint description." },
      ]}
    />
  )
}
