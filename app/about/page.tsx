import { AboutPage } from "@/components/AboutPage"
import { getAboutSettings } from "@/lib/siteSettings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "About — AÉVA",
  description:
    "Discover the story behind AÉVA — refined modestwear for quiet elegance, timeless design, and modern women.",
}

export default async function About() {
  const settings = await getAboutSettings()
  return <AboutPage settings={settings} />
}
