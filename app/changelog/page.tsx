import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Changelog"
      subtitle="What changed in recent releases."
      sections={[
        { h: "UI", p: "Collapsible History / NFTs sections for better mobile UX." },
        { h: "Comments", p: "Anti-spam messaging simplified + safer input handling." },
        { h: "Security", p: "Added security headers and server-side sanitization." },
      ]}
    />
  )
}
