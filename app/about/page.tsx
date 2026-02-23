import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="About"
      subtitle="Pale is a lightweight explorer UI."
      sections={[
        { h: "Purpose", p: "Make on-chain data easier to read without clutter." },
        { h: "Privacy-first", p: "No accounts required. Minimal data for anti-spam only." },
        { h: "Built to customize", p: "Modular Next.js project you can extend." },
      ]}
    />
  )
}
