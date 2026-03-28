import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Share2, Copy, Facebook, Twitter, Mail, Link2 } from "lucide-react";

interface ShareDialogProps {
  children: React.ReactNode;
}

const ShareDialog = ({ children }: ShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const shareUrl = `${window.location.origin}${window.location.pathname}#tributes`;
  const shareText = "Join me in sharing memories and tributes for Mary Wangui";

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tribute Wall - Mary Wangui",
          text: shareText,
          url: shareUrl,
        });
        setOpen(false);
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Tribute Wall - Mary Wangui");
    const body = encodeURIComponent(`${shareText}\n\nVisit the tribute wall: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Tribute Wall</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this tribute wall with friends and family to collect more memories.
          </p>
          
          {/* Native Share (Mobile) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}

          {/* Copy Link */}
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={handleCopyLink}
              size="sm"
              variant="outline"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Social Media Options */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleFacebookShare}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              onClick={handleTwitterShare}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Twitter className="w-4 h-4 text-blue-400" />
              Twitter
            </Button>
            <Button
              onClick={handleEmailShare}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button
              onClick={handleCopyLink}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Link2 className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
