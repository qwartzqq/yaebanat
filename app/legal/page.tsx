import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Legal"
      subtitle="Policies and security notes."
      sections={[
        { h: "Privacy", p: "See /privacy for what we collect (minimal)." },
        { h: "Terms", p: "See /terms for usage rules and disclaimers." },
        { h: "Security", p: "See /security for our security posture and reporting." },
      ]}
    />
  )
}
