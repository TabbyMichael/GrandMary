import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import childhoodImg1 from "@/assets/timeline-childhood.jpg";
import childhoodImg2 from "@/assets/Childhood in the Highlands 2.png";
import familyImg from "@/assets/timeline-family.jpg";
import gardenImg1 from "@/assets/Garden of Grace 1.png";
import gardenImg2 from "@/assets/Garden of Grace2.png";
import gardenImg3 from "@/assets/Garden of Grace3.png";
import gardenImg4 from "@/assets/Garden of Grace4.png";
import shoshImg1 from "@/assets/Shosh.png";
import shoshImg2 from "@/assets/Shosh 2.png";
import { useTranslations } from "@/hooks/useTranslations";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [[childhoodImg1, childhoodImg2], familyImg, [gardenImg1, gardenImg2, gardenImg3, gardenImg4], [shoshImg1, shoshImg2]];

// Slider component for childhood images
const ImageSlider = ({ images, milestone }: { images: string[]; milestone: MilestoneData }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  return (
    <div ref={ref} className="relative flex items-center mb-24 last:mb-0">
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-md" />
      </div>
      <div className="w-full flex flex-row">
        <motion.div initial={{ opacity: 0, x: -60 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, ease: "easeOut" }} className="w-5/12">
          <div className="rounded-2xl overflow-hidden shadow-lg relative group">
            <img 
              src={images[currentImageIndex]} 
              alt={milestone.title} 
              loading="lazy" 
              width={1280} 
              height={720} 
              className="w-full h-48 md:h-64 object-contain bg-gray-50" 
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
            
            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
        <div className="w-2/12" />
        <motion.div initial={{ opacity: 0, x: 60 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="w-5/12 flex flex-col justify-center">
          <span className="text-sm tracking-[0.2em] uppercase text-primary font-sans font-medium mb-2">{milestone.year}</span>
          <h3 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-3">{milestone.title}</h3>
          <p className="text-muted-foreground font-sans leading-relaxed text-sm md:text-base">{milestone.description}</p>
        </motion.div>
      </div>
    </div>
  );
};

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
            <img 
              src={image} 
              alt={milestone.title} 
              loading="lazy" 
              width={1280} 
              height={720} 
              className="w-full h-48 md:h-64 object-contain bg-gray-50" 
            />
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

// Mobile slider component for childhood images
const ImageSliderMobile = ({ images, milestone, index }: { images: string[]; milestone: MilestoneData; index: number }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: index * 0.1 }} className="relative pl-8 mb-16 last:mb-0">
      <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary border-3 border-background shadow" />
      <span className="text-xs tracking-[0.2em] uppercase text-primary font-sans font-medium mb-2 block">{milestone.year}</span>
      <h3 className="text-xl font-serif font-medium text-foreground mb-2">{milestone.title}</h3>
      <div className="rounded-xl overflow-hidden shadow-md mb-3 relative group">
        <img 
          src={images[currentImageIndex]} 
          alt={milestone.title} 
          loading="lazy" 
          width={1280} 
          height={720} 
          className="w-full h-48 object-contain bg-gray-50" 
        />
        
        {/* Mobile Slider Controls */}
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
        
        {/* Mobile Image Indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <p className="text-muted-foreground font-sans leading-relaxed text-sm">{milestone.description}</p>
    </motion.div>
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
        <img 
          src={image} 
          alt={milestone.title} 
          loading="lazy" 
          width={1280} 
          height={720} 
          className="w-full h-48 object-contain bg-gray-50" 
        />
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
            (i === 0 || i === 2 || i === 3) ? 
              <ImageSlider key={i} images={Array.isArray(images[i]) ? images[i] : [images[i]]} milestone={m} /> :
              <TimelineItem key={i} milestone={m} index={i} image={Array.isArray(images[i]) ? images[i][0] : images[i]} />
          ))}
        </div>

        <div className="relative md:hidden">
          <div className="absolute left-[5px] top-0 bottom-0 w-px timeline-line" />
          {milestones.map((m, i) => (
            (i === 0 || i === 2 || i === 3) ? 
              <ImageSliderMobile key={i} images={Array.isArray(images[i]) ? images[i] : [images[i]]} milestone={m} index={i} /> :
              <TimelineItemMobile key={i} milestone={m} index={i} image={Array.isArray(images[i]) ? images[i][0] : images[i]} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifeTimeline;
