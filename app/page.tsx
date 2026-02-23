import { ExplorerSection } from "@/components/sections/explorer-section"
import { FooterSection } from "@/components/sections/footer-section"

export default function Page() {
  return (
    <main className="min-h-screen">
      <div id="explorer" />
      <ExplorerSection />
      <FooterSection />
    </main>
  )
}
