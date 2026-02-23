import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Careers"
      subtitle="We hire when it makes sense."
      sections={[
        { h: "Open roles", p: "No public openings right now. Check back later." },
        { h: "What we like", p: "Product-minded engineers and designers who care about speed and UX." },
      ]}
    />
  )
}
