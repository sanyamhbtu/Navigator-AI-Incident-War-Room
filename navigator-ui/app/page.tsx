import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { LogoStrip } from "@/components/LogoStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { Stats } from "@/components/Stats";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Sources } from "@/components/Sources";
import { DemoCTA } from "@/components/DemoCTA";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <LogoStrip />
        <Stats />
        <BeforeAfter />
        <Sources />
        <DemoCTA />
      </main>
      <Footer />
    </>
  );
}
