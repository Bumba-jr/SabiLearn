import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TrustStatsSection } from "@/components/trust-stats-section";
import { FindMatchSection } from "@/components/find-match-section";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustStatsSection />
        <FindMatchSection />
      </main>
    </>
  );
}

