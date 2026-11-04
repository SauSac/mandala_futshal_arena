import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import { Arenas, CTA, HowItWorks, Stats, Tournaments } from "../components/home/Sections";
import Footer from "../components/home/Footer";
import { RevealObserver } from "../components/home/Client";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Hero />
        <Stats />
        <Arenas />
        <HowItWorks />
        <Tournaments />
        <CTA />
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}