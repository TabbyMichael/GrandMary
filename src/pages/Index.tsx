import SiteNav from "@/components/SiteNav";
import HeroSection from "@/components/HeroSection";
import BiographySection from "@/components/BiographySection";
import LifeTimeline from "@/components/LifeTimeline";
import TributeWall from "@/components/TributeWall";
import DigitalCandle from "@/components/DigitalCandle";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <HeroSection />
      <BiographySection />
      <LifeTimeline />
      <TributeWall />
      <DigitalCandle />
      <Footer />
    </div>
  );
};

export default Index;
