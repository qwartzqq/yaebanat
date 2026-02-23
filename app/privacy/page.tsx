import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Privacy Policy"
      subtitle="Short version: we keep it minimal."
      sections={[
        { h: "No accounts", p: "We do not require you to create an account to use Pale." },
        { h: "IP usage", p: "IP may be used for anti-spam (comments). We store only a hashed identifier." },
        { h: "Analytics", p: "If enabled, analytics help improve performance and UX." },
      ]}
    />
  )
}
