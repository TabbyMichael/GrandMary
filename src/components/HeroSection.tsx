import { motion } from "framer-motion";
import portraitImage from "@/assets/grandmother-portrait.jpg";
import { useTranslations } from "@/hooks/useTranslations";

const HeroSection = () => {
  const t = useTranslations();

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
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-rose-light shadow-2xl">
              <img src={portraitImage} alt="Mary Wangui" width={800} height={1024} className="w-full h-full object-cover object-top" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-gold-soft opacity-40 candle-glow" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }}>
            <p className="text-sm md:text-base tracking-[0.3em] uppercase text-muted-foreground mb-3 font-sans font-light">
              {t.hero.subtitle}
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-light text-foreground leading-tight">
              Mary Wangui
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
