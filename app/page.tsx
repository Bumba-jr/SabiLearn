import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TrustStatsSection } from "@/components/trust-stats-section";
import { VerifiedTutorsSection } from "@/components/verified-tutors-section";
import { FindMatchSection } from "@/components/find-match-section";
import { LearnFromBestSection } from "@/components/learn-from-best-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { SecurePaymentSection } from "@/components/secure-payment-section";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustStatsSection />
        <VerifiedTutorsSection />
        <FindMatchSection />
        <HowItWorksSection />
        <LearnFromBestSection />
        <SecurePaymentSection />
      </main>
    </>
  );
}

