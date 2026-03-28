import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Heart, Send, Loader2, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "@/hooks/useTranslations";
import { tributeService } from "@/lib/tribute-supabase";
import ShareDialog from "@/components/ShareDialog";

interface Tribute {
  id: string;
  author_name: string;
  author_relationship?: string;
  message: string;
  created_at: string;
  reaction_count?: number;
}

interface TributeCardProps {
  tribute: Tribute;
  index: number;
  onReact: (tributeId: string) => void;
}

const TributeCard = ({ tribute, index, onReact }: TributeCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const handleReaction = () => {
    onReact(tribute.id);
  };

  return (
    <motion.div 
      ref={ref} 
      initial={{ opacity: 0, y: 30 }} 
      animate={isInView ? { opacity: 1, y: 0 } : {}} 
      transition={{ duration: 0.6, delay: index * 0.1 }} 
      className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-serif text-lg">
          {tribute.author_name[0]}
        </div>
        <div>
          <p className="font-sans font-medium text-foreground text-sm">{tribute.author_name}</p>
          <p className="font-sans text-xs text-muted-foreground">{tribute.author_relationship || 'Family Friend'}</p>
        </div>
      </div>
      <p className="font-serif text-foreground/90 leading-relaxed italic text-base mb-4">
        &ldquo;{tribute.message}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-sans">
          {new Date(tribute.created_at).toLocaleDateString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReaction}
          className="text-primary/40 hover:text-primary"
        >
          <Heart className="w-4 h-4 mr-1" />
          {tribute.reaction_count || 0}
        </Button>
      </div>
    </motion.div>
  );
};

const TributeWallSupabase = () => {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const fetchTributes = async () => {
    setLoading(true);
    try {
      const data = await tributeService.getTributes();
      setTributes(data);
    } catch (error) {
      console.error('Failed to fetch tributes:', error);
      toast.error('Failed to load tributes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await tributeService.getTributeStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchTributes();
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await tributeService.addTribute({
        author_name: name,
        author_relationship: relationship,
        message: message,
        is_public: true
      });
      
      toast.success('Tribute submitted successfully! It will appear once approved.');
      setName('');
      setRelationship('');
      setMessage('');
      
      // Refresh tributes
      fetchTributes();
    } catch (error) {
      console.error('Failed to submit tribute:', error);
      toast.error('Failed to submit tribute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (tributeId: string) => {
    const reactorName = prompt('Your name:') || 'Anonymous';
    
    try {
      await tributeService.addReaction(tributeId, {
        reaction_type: 'heart',
        reactor_name: reactorName,
        reactor_ip: '127.0.0.1'
      });
      
      toast.success('Reaction added successfully!');
      fetchTributes(); // Refresh to update reaction count
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast.error('Failed to add reaction. Please try again.');
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20" id="tributes">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            {t.tributes?.label || "Tributes"}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            {t.tributes?.title || "Share Your Memory"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.tributes?.description || "Share your memories and celebrate the life of Mary Wangui"}
          </p>
          
          {stats && (
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.approved_tributes || 0}</div>
                <div className="text-sm text-muted-foreground">Tributes Shared</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.unique_authors || 0}</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Share Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <Button
            variant="outline"
            onClick={() => setIsShareOpen(true)}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            {t.tributes?.shareWall || "Share Tribute Wall"}
          </Button>
        </motion.div>

        {/* Tribute Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t.tributes?.namePlaceholder || "Your Name *"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                required
              />
              <input
                type="text"
                placeholder={t.tributes?.relationshipPlaceholder || "Relationship (Optional)"}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="px-4 py-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <textarea
              placeholder={t.tributes?.messagePlaceholder || "Share your memory or message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
              required
            />
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.tributes?.submitting || "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t.tributes?.submit || "Share Tribute"}
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Tributes Display */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tributes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                {t.tributes?.noTributes || "No tributes yet. Be the first to share a memory!"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {tributes.map((tribute, index) => (
                <TributeCard
                  key={tribute.id}
                  tribute={tribute}
                  index={index}
                  onReact={handleReact}
                />
              ))}
            </div>
          )}
        </div>

        {/* Share Dialog */}
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title={t.tributes?.shareTitle || "Share Tribute Wall"}
          text={t.tributes?.shareText || "Share memories and tributes for Mary Wangui"}
        />
      </div>
    </section>
  );
};

export default TributeWallSupabase;
