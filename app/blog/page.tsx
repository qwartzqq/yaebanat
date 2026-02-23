import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Blog"
      subtitle="Updates and notes."
      sections={[
        { h: "No posts yet", p: "This page is ready. Add your posts in the code whenever you want." },
        { h: "Changelog", p: "Use /changelog for release notes and changes." },
      ]}
    />
  )
}
