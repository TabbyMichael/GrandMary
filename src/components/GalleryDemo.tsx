import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Image as ImageIcon, Video, Heart, MessageCircle, Search, Filter, X, Plus, Grid, List, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "@/hooks/useTranslations";

// Mock data for demonstration
const mockPosts = [
  {
    id: 1,
    uploader_name: "Sarah Johnson",
    title: "Family Reunion 2020",
    caption: "A wonderful day spent together as a family. Mary was so happy to see everyone together.",
    file_name: "family-reunion.jpg",
    original_file_name: "family-reunion.jpg",
    file_type: "image" as const,
    mime_type: "image/jpeg",
    file_size: 2048000,
    tags: ["Family", "Reunion", "Memories"],
    is_public: true,
    status: "approved" as const,
    created_at: "2024-01-15T10:30:00Z",
    event_date: "2020-07-15",
    location: "Nairobi, Kenya",
    reaction_count: 24,
    comment_count: 8,
    view_count: 156,
  },
  {
    id: 2,
    uploader_name: "Michael Wangui",
    title: "Birthday Celebration",
    caption: "Celebrating mom's 75th birthday with all her favorite things.",
    file_name: "birthday-celebration.jpg",
    original_file_name: "birthday-celebration.jpg",
    file_type: "image" as const,
    mime_type: "image/jpeg",
    file_size: 1536000,
    tags: ["Birthday", "Celebration", "Family"],
    is_public: true,
    status: "approved" as const,
    created_at: "2024-01-20T14:45:00Z",
    event_date: "2023-12-10",
    location: "Home",
    reaction_count: 45,
    comment_count: 12,
    view_count: 234,
  },
  {
    id: 3,
    uploader_name: "Grace Kariuki",
    title: "Garden Memories",
    caption: "Mary in her element - tending to her beautiful garden. She loved her flowers so much.",
    file_name: "garden-memories.jpg",
    original_file_name: "garden-memories.jpg",
    file_type: "image" as const,
    mime_type: "image/jpeg",
    file_size: 3072000,
    tags: ["Garden", "Nature", "Memories"],
    is_public: true,
    status: "approved" as const,
    created_at: "2024-01-25T09:20:00Z",
    event_date: "2023-06-20",
    location: "Home Garden",
    reaction_count: 67,
    comment_count: 15,
    view_count: 345,
  },
  {
    id: 4,
    uploader_name: "David Mwangi",
    title: "Cooking Together",
    caption: "Mary teaching her grandchildren how to make her famous ugali. These moments are precious.",
    file_name: "cooking-together.jpg",
    original_file_name: "cooking-together.jpg",
    file_type: "image" as const,
    mime_type: "image/jpeg",
    file_size: 2560000,
    tags: ["Cooking", "Family", "Teaching"],
    is_public: true,
    status: "approved" as const,
    created_at: "2024-02-01T16:30:00Z",
    event_date: "2023-11-25",
    location: "Kitchen",
    reaction_count: 89,
    comment_count: 23,
    view_count: 567,
  },
  {
    id: 5,
    uploader_name: "Anne Njoroge",
    title: "Sunday Church",
    caption: "Mary always looked forward to Sundays. This was her happy place.",
    file_name: "sunday-church.jpg",
    original_file_name: "sunday-church.jpg",
    file_type: "image" as const,
    mime_type: "image/jpeg",
    file_size: 1792000,
    tags: ["Church", "Sunday", "Faith"],
    is_public: true,
    status: "approved" as const,
    created_at: "2024-02-05T11:15:00Z",
    event_date: "2023-10-15",
    location: "Local Church",
    reaction_count: 34,
    comment_count: 7,
    view_count: 189,
  },
  {
    id: 6,
    uploader_name: "James Kamau",
    title: "Video: Mary's Story",
    caption: "A short video of Mary sharing her life story and memories.",
    file_name: "marys-story.mp4",
    original_file_name: "marys-story.mp4",
    file_type: "video" as const,
    mime_type: "video/mp4",
    file_size: 15258000,
    tags: ["Video", "Story", "Interview"],
    is_public: true,
    status: "approved" as const,
    created_at: "2024-02-10T13:45:00Z",
    event_date: "2023-09-01",
    location: "Living Room",
    reaction_count: 112,
    comment_count: 28,
    view_count: 789,
  },
];

const mockStats = {
  total_posts: 156,
  total_images: 142,
  total_videos: 14,
  approved_posts: 156,
  pending_posts: 0,
  unique_uploaders: 45,
  total_storage_used: 2048000000,
  average_file_size: 13107200,
};

const mockTags = [
  { tag: "Family", count: 45 },
  { tag: "Memories", count: 38 },
  { tag: "Birthday", count: 23 },
  { tag: "Celebration", count: 19 },
  { tag: "Garden", count: 17 },
  { tag: "Church", count: 15 },
  { tag: "Cooking", count: 12 },
  { tag: "Video", count: 14 },
];

const GalleryPostCard = ({ post, onOpen }: { post: any; onOpen: (post: any) => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const t = useTranslations();

  const handleReaction = () => {
    const name = prompt('Your name:') || 'Anonymous';
    alert(`❤️ Reaction added by ${name}! (Demo mode)`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0 }}
      className="group cursor-pointer"
      onClick={() => onOpen(post)}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-105">
        <div className="relative aspect-square">
          {post.file_type === 'image' ? (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-blue-100 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {post.file_name}
              </span>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Video className="w-16 h-16 text-muted-foreground" />
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {post.file_name}
              </span>
            </div>
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction();
                }}
              >
                <Heart className="w-4 h-4 mr-1" />
                {post.reaction_count || 0}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comment_count || 0}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {post.title && (
            <h3 className="font-medium text-sm mb-2 line-clamp-1">{post.title}</h3>
          )}
          {post.caption && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{post.caption}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{post.uploader_name}</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

const PostLightbox = ({ post, isOpen, onClose }: { post: any; isOpen: boolean; onClose: () => void }) => {
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const t = useTranslations();

  if (!post) return null;

  const handleReaction = (reactionType: string) => {
    const name = prompt('Your name:') || 'Anonymous';
    alert(`${reactionType} reaction added by ${name}! (Demo mode)`);
  };

  const handleComment = () => {
    if (!commentText.trim() || !commenterName.trim()) return;
    
    alert(`Comment posted by ${commenterName}: "${commentText}" (Demo mode)`);
    setCommentText('');
    setCommenterName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{post.title || 'Gallery Post'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Media */}
          <div className="relative">
            {post.file_type === 'image' ? (
              <div className="w-full aspect-video bg-gradient-to-br from-rose-100 to-blue-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-24 h-24 text-muted-foreground" />
                <span className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded">
                  {post.original_file_name}
                </span>
              </div>
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <Video className="w-24 h-24 text-muted-foreground" />
                <span className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded">
                  {post.original_file_name}
                </span>
              </div>
            )}
          </div>
          
          {/* Details */}
          <div className="space-y-4">
            {post.caption && (
              <p className="text-sm">{post.caption}</p>
            )}
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Uploaded by: {post.uploader_name}</p>
              <p>Date: {new Date(post.created_at).toLocaleDateString()}</p>
              {post.location && <p>Location: {post.location}</p>}
              {post.event_date && <p>Event Date: {new Date(post.event_date).toLocaleDateString()}</p>}
              <p>File size: {(post.file_size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction('❤️')}
              >
                <Heart className="w-4 h-4 mr-1" />
                {post.reaction_count || 0}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction('👍')}
              >
                👍 {post.reaction_count || 0}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Share functionality (Demo mode)')}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Download functionality (Demo mode)')}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
            
            {/* Comments */}
            <div className="space-y-3">
              <h4 className="font-medium">Comments ({post.comment_count})</h4>
              
              {/* Add comment */}
              <div className="space-y-2">
                <Input
                  placeholder="Your name"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  className="text-sm"
                />
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm resize-none"
                  rows={3}
                />
                <Button onClick={handleComment} size="sm" disabled={!commentText.trim() || !commenterName.trim()}>
                  Post Comment
                </Button>
              </div>
              
              {/* Sample comments */}
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-muted-foreground">Such a beautiful memory! ❤️</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Michael Wangui</p>
                  <p className="text-muted-foreground">I remember this day so well.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UploadDialog = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!files.length || !uploaderName.trim()) return;

    alert(`Upload functionality (Demo mode)\nFiles: ${files.length}\nUploader: ${uploaderName}\nTitle: ${title}\nCaption: ${caption}\nTags: ${tags}`);
    onSuccess();
    onClose();
    // Reset form
    setFiles([]);
    setUploaderName('');
    setUploaderEmail('');
    setTitle('');
    setCaption('');
    setTags('');
    setIsPublic(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Upload to Gallery</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files (Images & Videos)
            </Button>
            
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Form Fields */}
          <Input
            placeholder="Your name *"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            required
          />
          
          <Input
            placeholder="Your email (optional)"
            type="email"
            value={uploaderEmail}
            onChange={(e) => setUploaderEmail(e.target.value)}
          />
          
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <textarea
            placeholder="Caption or message (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-2 border rounded-md resize-none"
            rows={3}
          />
          
          <Input
            placeholder="Tags (comma-separated, optional)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="isPublic" className="text-sm">Make this post public</label>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!files.length || !uploaderName.trim()}
            className="w-full"
          >
            Upload Files
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GalleryDemo = () => {
  const t = useTranslations();
  const [posts, setPosts] = useState(mockPosts);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedTags, setSelectedTags] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'event_date' | 'title'>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || post.file_type === selectedType;
    const matchesTags = !selectedTags || post.tags?.some((tag: string) => 
      tag.toLowerCase().includes(selectedTags.toLowerCase())
    );
    return matchesSearch && matchesType && matchesTags;
  });

  const handleSearch = () => {
    // Search is handled by filteredPosts above
  };

  return (
    <section className="py-24 bg-background" id="gallery">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-primary font-sans mb-3">
            {t.gallery?.label || "Memories Gallery"}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            {t.gallery?.title || "Photo & Video Gallery"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.gallery?.description || "Share and cherish memories through photos and videos"}
          </p>
          
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{mockStats.total_posts}</div>
              <div className="text-sm text-muted-foreground">{t.gallery?.totalPosts || "Total Posts"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{mockStats.total_images}</div>
              <div className="text-sm text-muted-foreground">{t.gallery?.photos || "Photos"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{mockStats.total_videos}</div>
              <div className="text-sm text-muted-foreground">{t.gallery?.videos || "Videos"}</div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.gallery?.searchPlaceholder || "Search gallery..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.gallery?.filterAll || "All"}</SelectItem>
                  <SelectItem value="image">{t.gallery?.filterImages || "Images"}</SelectItem>
                  <SelectItem value="video">{t.gallery?.filterVideos || "Videos"}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">{t.gallery?.sortByLatest || "Latest"}</SelectItem>
                  <SelectItem value="event_date">{t.gallery?.sortByEventDate || "Event Date"}</SelectItem>
                  <SelectItem value="title">{t.gallery?.sortByTitle || "Title"}</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.gallery?.uploadButton || "Upload"}
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">{t.gallery?.popularTags || "Popular tags:"}</span>
            {mockTags.slice(0, 10).map(({ tag }) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer"
                onClick={() => setSelectedTags(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t.gallery?.noPosts || "No memories shared yet"}</p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t.gallery?.beFirst || "Be the first to share"}
            </Button>
          </div>
        ) : (
          <div className={`grid gap-6 mb-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredPosts.map((post) => (
              <GalleryPostCard
                key={post.id}
                post={post}
                onOpen={setSelectedPost}
              />
            ))}
          </div>
        )}

        {/* Lightbox */}
        <PostLightbox
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />

        {/* Upload Dialog */}
        <UploadDialog
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            // In demo mode, just show a success message
            alert('Upload successful! (Demo mode)');
          }}
        />
      </div>
    </section>
  );
};

export default GalleryDemo;
