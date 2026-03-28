import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/hooks/useTranslations";
import { useCandles } from "@/hooks/useApi";

const DigitalCandle = () => {
  const t = useTranslations();
  const [hasLit, setHasLit] = useState(false);
  const [localCandleCount, setLocalCandleCount] = useState(0);
  const { candleCount, loading, lightCandle: apiLightCandle, error } = useCandles();

  // Use local count if API fails, otherwise use API count
  const displayCount = error ? localCandleCount : candleCount;

  const lightCandle = async () => {
    if (hasLit || loading) return;
    
    try {
      await apiLightCandle();
      setHasLit(true);
      setLocalCandleCount(prev => prev + 1);
    } catch (error) {
      // Error is already handled by the hook
      console.error("Failed to light candle:", error);
      // Still increment local count to provide feedback
      setLocalCandleCount(prev => prev + 1);
    }
  };

  return (
    <section className="py-20 bg-[hsl(var(--candle-bg))] text-[hsl(var(--candle-fg))]" id="candle">
      <div className="container mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <div className="candle-glow text-6xl mb-6">🕯️</div>
          <h2 className="text-3xl md:text-4xl font-serif font-light mb-4">{t.candle.title}</h2>
          <p className="opacity-70 font-sans text-sm mb-8">{displayCount} {t.candle.count}</p>
          <button
            onClick={lightCandle}
            disabled={hasLit || loading}
            className={`px-8 py-3 rounded-full font-sans text-sm tracking-wide transition-all ${
              hasLit || loading
                ? "bg-[hsl(var(--candle-fg))]/20 opacity-50 cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              "Lighting..."
            ) : hasLit ? (
              t.candle.lit
            ) : (
              t.candle.button
            )}
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default DigitalCandle;
