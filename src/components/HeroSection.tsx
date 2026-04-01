import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import portraitImage from "@/assets/grandmother-portrait.jpg";
import shoshImg1 from "@/assets/Shosh.png";
import shoshImg2 from "@/assets/Shosh 2.png";
import { useTranslations } from "@/hooks/useTranslations";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HeroSection = () => {
  const t = useTranslations();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroImages = [portraitImage, shoshImg1, shoshImg2];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  return (
    <section className="relative min-h-screen living-background flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-rose-light opacity-60 animate-float" />
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-dusty-blue-light opacity-40 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-gold-soft opacity-50 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="relative"
          >
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-rose-light shadow-2xl relative group">
              <img 
                src={heroImages[currentImageIndex]} 
                alt="Mary Mathenge" 
                width={800} 
                height={1024} 
                className="w-full h-full object-cover transition-opacity duration-500" 
                style={{ objectPosition: 'center 30%' }}
              />
              
              {/* Slider Controls */}
              <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={prevImage}
                  className="ml-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextImage}
                  className="mr-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Image Indicators */}
            <div className="flex justify-center gap-1 mt-4">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            
            <div className="absolute inset-0 rounded-full border-2 border-gold-soft opacity-40 candle-glow pointer-events-none" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }}>
            <p className="text-sm md:text-base tracking-[0.3em] uppercase text-muted-foreground mb-3 font-sans font-light">
              {t.hero.subtitle}
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-light text-foreground leading-tight">
              Mary Mathenge
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="text-lg md:text-xl text-muted-foreground font-serif italic">
            {t.hero.tagline}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.3 }} className="mt-8 flex flex-col items-center gap-3">
            <div className="candle-glow text-4xl">🕯️</div>
            <p className="text-sm text-muted-foreground font-sans">
              <span className="text-primary font-medium">47</span> {t.hero.candlesLit}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2 }} className="absolute bottom-10">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-muted-foreground/40 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
