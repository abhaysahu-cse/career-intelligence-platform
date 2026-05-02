import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Demo from "@/components/landing/Demo";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="relative bg-mesh">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Demo />
      <CTA />
      <Footer />
    </main>
  );
}
