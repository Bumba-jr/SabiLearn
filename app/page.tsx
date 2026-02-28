import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TrustStatsSection } from "@/components/trust-stats-section";
import { VerifiedTutorsSection } from "@/components/verified-tutors-section";
import { FindMatchSection } from "@/components/find-match-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { LearnFromBestSection } from "@/components/learn-from-best-section";
import { SecurePaymentSection } from "@/components/secure-payment-section";
import { FAQSection } from "@/components/faq-section";
import { TestimonialSection } from "@/components/testimonial-section";
import { TutorProfilePage } from "@/components/tutor-profile-page";
import { DashboardSection } from "@/components/dashboard-section";
import { CompleteBookingSection } from "@/components/complete-booking-section";
import { StayInLoopSection } from "@/components/stay-in-loop-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

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
        <FAQSection />
        <TestimonialSection />
        <TutorProfilePage />
        <DashboardSection />
        <CompleteBookingSection />
        <StayInLoopSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

