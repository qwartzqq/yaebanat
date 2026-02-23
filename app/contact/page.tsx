import StaticPage from "../components/StaticPage"

export default function Page() {
  return (
    <StaticPage
      title="Contact"
      subtitle="Get in touch."
      sections={[
        {
      h: "Support",
      p: (
        <>
          Our support in telegram:{" "}
          <a
            href="https://t.me/scupaet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            @scupaet
          </a>
        </>
      )
    },
        {
      h: "News",
      p: (
        <>
          Our channel in telegram:{" "}
          <a
            href="https://t.me/palechain"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            @PaleChain
          </a>
        </>
      )
    },
      ]}
    />
  )
}
