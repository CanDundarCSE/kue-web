import FaqSection from "@/app/features/landing/faq-section";
import FeaturesSection from "@/app/features/landing/features-section";
import FormatsSection from "@/app/features/landing/formats-section";
import HeroSection from "@/app/features/landing/hero-section";
import RevealObserver from "@/app/features/landing/reveal-observer";
import SiteFooter from "@/app/features/landing/site-footer";
import SiteNav from "@/app/features/landing/site-nav";
import StatsSection from "@/app/features/landing/stats-section";
import YearSection from "@/app/features/landing/year-section";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-background font-sans text-ink">
      <SiteNav />

      <main className="flex-1">
        <HeroSection />
        <FormatsSection />
        <FeaturesSection />
        <StatsSection />
        <YearSection />
        <FaqSection />
      </main>

      <SiteFooter />
      <RevealObserver />
    </div>
  );
}
