import { useTranslations } from "@/hooks/useTranslations";

const Footer = () => {
  const t = useTranslations();

  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-6 text-center">
        <p className="font-serif text-2xl text-foreground mb-2">Mary Wangui</p>
        <p className="font-sans text-sm text-muted-foreground mb-6">{t.footer?.tagline || "Forever in our hearts"}</p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
        </div>
        <p className="font-sans text-xs text-muted-foreground/60">{t.footer?.credit || "Made with love by her family"}</p>
      </div>
    </footer>
  );
};

export default Footer;
