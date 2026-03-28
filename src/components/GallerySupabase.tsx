import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Image as ImageIcon, Video, Heart, MessageCircle, Search, Filter, X, Plus, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "@/hooks/useTranslations";
import { galleryService } from "@/lib/supabase-client";
import type { GalleryPost } from "@/types/gallery";

const GalleryPostCard = ({ post, onOpen }: { post: GalleryPost; onOpen: (post: GalleryPost) => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const t = useTranslations();

  const handleReaction = async () => {
    const name = prompt('Your name:') || 'Anonymous';
    try {
      await galleryService.addReaction(post.id, {
        reactionType: 'heart',
        reactorName: name,
        reactorIp: '127.0.0.1'
      });
      alert('❤️ Reaction added successfully!');
    } catch (error) {
      console.error('Failed to add reaction:', error);
      alert('Failed to add reaction. Please try again.');
    }
  };

  const getFileUrl = (filePath: string) => {
    // For Supabase, we'll use the file_path directly or construct URL
    return filePath || '';
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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-square">
          {post.file_type === 'image' ? (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-blue-100 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {post.original_file_name}
              </span>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Video className="w-16 h-16 text-muted-foreground" />
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {post.original_file_name}
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
              {post.tags.slice(0, 3).map((tag) => (
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

const PostLightbox = ({ post, isOpen, onClose }: { post: GalleryPost | null; isOpen: boolean; onClose: () => void }) => {
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const t = useTranslations();

  if (!post) return null;

  const handleReaction = async (reactionType: string) => {
    const name = prompt('Your name:') || 'Anonymous';
    try {
      await galleryService.addReaction(post.id, {
        reactionType,
        reactorName: name,
        reactorIp: '127.0.0.1'
      });
      alert(`${reactionType} reaction added successfully!`);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      alert('Failed to add reaction. Please try again.');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !commenterName.trim()) return;
    
    try {
      await galleryService.addComment(post.id, {
        commenterName,
        commentText,
        commenterIp: '127.0.0.1'
      });
      alert('Comment submitted successfully! It will appear once approved.');
      setCommentText('');
      setCommenterName('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const getFileUrl = (filePath: string) => {
    return filePath || '';
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
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Uploaded by: {post.uploader_name}</p>
              {post.uploader_relationship && <p>Relationship: {post.uploader_relationship}</p>}
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
  const [relationship, setRelationship] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!files.length || !uploaderName.trim()) return;

    setUploading(true);

    try {
      for (const file of files) {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${file.name.split('.')[0]}-${Date.now()}.${fileExt}`;
        
        // For now, we'll simulate the upload since we don't have the actual Supabase setup
        // In production, this would be:
        // const { data } = await galleryService.uploadFile(file, fileName);
        
        // Create post record
        await galleryService.uploadPost({
          uploaderName,
          uploaderRelationship: relationship,
          title,
          caption,
          fileName,
          originalFileName: file.name,
          fileType: file.type.startsWith('image/') ? 'image' : 'video',
          mimeType: file.type,
          fileSize: file.size,
          filePath: `gallery/${fileName}`, // This would be the actual Supabase path
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          isPublic,
          eventDate: null,
          location: null
        });
      }

      alert(`Successfully uploaded ${files.length} file(s)! They will appear once approved.`);
      onSuccess();
      onClose();
      
      // Reset form
      setFiles([]);
      setUploaderName('');
      setRelationship('');
      setTitle('');
      setCaption('');
      setTags('');
      setIsPublic(true);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
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
            placeholder={t.gallery?.uploaderName || "Your name *"}
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            required
          />
          
          <Input
            placeholder={t.gallery?.uploaderRelationship || "Relationship (optional)"}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
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
            disabled={!files.length || !uploaderName.trim() || uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GallerySupabase = () => {
  const t = useTranslations();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedTags, setSelectedTags] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'event_date' | 'title'>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await galleryService.getPosts({
        search: searchTerm,
        type: selectedType === 'all' ? null : selectedType,
        tags: selectedTags,
        sortBy,
        sortOrder: 'DESC'
      });
      
      // Transform the data to match the expected format
      const transformedPosts = response.posts.map(post => ({
        ...post,
        reaction_count: post.gallery_reactions?.[0]?.count || 0,
        comment_count: post.gallery_comments?.[0]?.count || 0,
        is_public: post.is_public || true,
        status: post.status || 'approved'
      }));
      
      setPosts(transformedPosts);
    } catch (err) {
      const apiError = err as Error;
      setError(apiError.message);
      console.error('Failed to fetch posts:', apiError);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await galleryService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const tagsData = await galleryService.getTags();
      setTags(tagsData);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();
    fetchTags();
  }, []);

  const handleSearch = () => {
    fetchPosts();
  };

  const handlePageChange = (page: number) => {
    // Implement pagination if needed
    fetchPosts();
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
          
          {stats && (
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_posts || 0}</div>
                <div className="text-sm text-muted-foreground">{t.gallery?.totalPosts || "Total Posts"}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_images || 0}</div>
                <div className="text-sm text-muted-foreground">{t.gallery?.photos || "Photos"}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_videos || 0}</div>
                <div className="text-sm text-muted-foreground">{t.gallery?.videos || "Videos"}</div>
              </div>
            </div>
          )}
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
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">{t.gallery?.popularTags || "Popular tags:"}</span>
              {tags.slice(0, 10).map(({ tag }) => (
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
          )}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={fetchPosts}>Try Again</Button>
          </div>
        ) : posts.length === 0 ? (
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
            {posts.map((post) => (
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
          onSuccess={() => fetchPosts()}
        />
      </div>
    </section>
  );
};

export default GallerySupabase;
