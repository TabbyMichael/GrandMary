import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import childhoodImg from "@/assets/timeline-childhood.jpg";
import familyImg from "@/assets/timeline-family.jpg";
import gardenImg from "@/assets/timeline-garden.jpg";
import { useTranslations } from "@/hooks/useTranslations";

const images = [childhoodImg, familyImg, gardenImg];

interface MilestoneData {
  year: string;
  title: string;
  description: string;
}

const TimelineItem = ({ milestone, index, image }: { milestone: MilestoneData; index: number; image: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="relative flex items-center mb-24 last:mb-0">
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-md" />
      </div>
      <div className={`w-full flex ${isEven ? "flex-row" : "flex-row-reverse"}`}>
        <motion.div initial={{ opacity: 0, x: isEven ? -60 : 60 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, ease: "easeOut" }} className="w-5/12">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={image} alt={milestone.title} loading="lazy" width={1280} height={720} className="w-full h-48 md:h-64 object-cover" />
          </div>
        </motion.div>
        <div className="w-2/12" />
        <motion.div initial={{ opacity: 0, x: isEven ? 60 : -60 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="w-5/12 flex flex-col justify-center">
          <span className="text-sm tracking-[0.2em] uppercase text-primary font-sans font-medium mb-2">{milestone.year}</span>
          <h3 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-3">{milestone.title}</h3>
          <p className="text-muted-foreground font-sans leading-relaxed text-sm md:text-base">{milestone.description}</p>
        </motion.div>
      </div>
    </div>
  );
};

const TimelineItemMobile = ({ milestone, index, image }: { milestone: MilestoneData; index: number; image: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: index * 0.1 }} className="relative pl-8 mb-16 last:mb-0">
      <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary border-3 border-background shadow" />
      <span className="text-xs tracking-[0.2em] uppercase text-primary font-sans font-medium mb-2 block">{milestone.year}</span>
      <h3 className="text-xl font-serif font-medium text-foreground mb-2">{milestone.title}</h3>
      <div className="rounded-xl overflow-hidden shadow-md mb-3">
        <img src={image} alt={milestone.title} loading="lazy" width={1280} height={720} className="w-full h-48 object-cover" />
      </div>
      <p className="text-muted-foreground font-sans leading-relaxed text-sm">{milestone.description}</p>
    </motion.div>
  );
};

const LifeTimeline = () => {
  const t = useTranslations();
  const milestones = t.timeline.milestones;

  return (
    <section className="py-24 bg-card" id="timeline">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">{t.timeline.label}</p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground">{t.timeline.title}</h2>
        </motion.div>

        <div className="relative hidden md:block max-w-5xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-px timeline-line" />
          {milestones.map((m, i) => (
            <TimelineItem key={i} milestone={m} index={i} image={images[i]} />
          ))}
        </div>

        <div className="relative md:hidden">
          <div className="absolute left-[5px] top-0 bottom-0 w-px timeline-line" />
          {milestones.map((m, i) => (
            <TimelineItemMobile key={i} milestone={m} index={i} image={images[i]} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifeTimeline;
