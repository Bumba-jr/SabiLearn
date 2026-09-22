import { Header } from "@/components/header";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main>
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
