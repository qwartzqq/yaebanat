import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Terms of Service"
      subtitle="Use responsibly."
      sections={[
        { h: "No warranties", p: "The service is provided “as is” without warranties of any kind." },
        { h: "Accuracy", p: "Data and USD estimates may be delayed or incomplete. Verify important info independently." },
        { h: "Abuse", p: "Do not spam, scrape aggressively, or attack the service. Access may be limited." },
      ]}
    />
  )
}
