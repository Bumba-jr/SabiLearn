import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TrustStatsSection } from "@/components/trust-stats-section";
import { FindMatchSection } from "@/components/find-match-section";
import { LearnFromBestSection } from "@/components/learn-from-best-section";
import { SecurePaymentSection } from "@/components/secure-payment-section";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustStatsSection />
        <FindMatchSection />
        <LearnFromBestSection />
        <SecurePaymentSection />
      </main>
    </>
  );
}

