import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Security"
      subtitle="Basic security posture."
      sections={[
        { h: "Headers", p: "We apply standard security headers (CSP, X-Frame-Options, etc.) to reduce common attacks." },
        { h: "Input handling", p: "User-generated text is treated as plain text and sanitized on the server." },
        { h: "Reporting", p: "If you find an issue, report it responsibly." },
      ]}
    />
  )
}
