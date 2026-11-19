import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import { CTA, HowItWorks, PlatformInfo } from "../components/home/Sections";
import Footer from "../components/home/Footer";
import { RevealObserver } from "../components/home/Client";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Hero />
        <PlatformInfo />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}
