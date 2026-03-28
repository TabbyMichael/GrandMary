import { motion } from "framer-motion";
import { useTranslations } from "@/hooks/useTranslations";

const BiographySection = () => {
  const t = useTranslations();

  return (
    <section className="py-24 bg-background" id="story">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">{t.bio.label}</p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground">{t.bio.title}</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-sm border border-border">
            <blockquote className="font-serif text-xl md:text-2xl text-foreground/90 leading-relaxed italic mb-8 text-center">
              {t.bio.quote}
            </blockquote>
            <div className="w-16 h-px bg-primary/30 mx-auto mb-8" />
            <div className="space-y-6 font-sans text-muted-foreground leading-relaxed text-base">
              <p>{t.bio.p1}</p>
              <p>{t.bio.p2}</p>
              <p>{t.bio.p3}</p>
            </div>
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-light" />
              <div className="w-2 h-2 rounded-full bg-dusty-blue" />
              <div className="w-2 h-2 rounded-full bg-gold-soft" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BiographySection;
