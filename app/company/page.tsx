import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Company"
      subtitle="Small team. Clean product."
      sections={[
        { h: "Mission", p: "Make on-chain data readable and fast to access." },
        { h: "Values", p: "Simplicity, performance, privacy-first by default." },
      ]}
    />
  )
}
