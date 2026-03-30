import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Image as ImageIcon, Video, Heart, MessageCircle, Search, Filter, X, Plus, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "@/hooks/useTranslations";
import { useGallery, useGalleryStats, useGalleryUpload, useGalleryTags } from "@/hooks/useGallery";
import { useGalleryPost } from "@/hooks/useGallery";
import type { GalleryPost } from "@/lib/gallery-api";

const GalleryPostCard = ({ post, onOpen }: { post: GalleryPost; onOpen: (post: GalleryPost) => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { addReaction } = useGalleryPost(post.id);
  const t = useTranslations();

  const handleReaction = async () => {
    const name = prompt('Your name:') || 'Anonymous';
    await addReaction('heart', name);
  };

  const getFileUrl = (fileName: string) => {
    // Direct hardcoded URL as primary fallback
    const url = `http://localhost:3001/uploads/gallery/${fileName}`;
    console.log('🔗 Image URL:', url);
    console.log('📁 File name:', fileName);
    return url;
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
            <img
              src={getFileUrl(post.file_name)}
              alt={post.title || 'Gallery image'}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={(e) => {
                console.log('✅ Image loaded successfully:', getFileUrl(post.file_name));
              }}
              onError={(e) => {
                console.error('❌ Image failed to load:', getFileUrl(post.file_name));
                console.error('📊 Post data:', post);
                console.error('🌐 Network error:', e);
                // Try fallback
                e.currentTarget.src = `http://localhost:3001/uploads/gallery/${post.file_name}`;
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Video className="w-16 h-16 text-muted-foreground" />
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
          {post.tags.length > 0 && (
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
  const { addReaction, addComment } = useGalleryPost(post?.id || 0);
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const t = useTranslations();

  if (!post) return null;

  const getFileUrl = (filePath: string) => {
    return `http://localhost:3001/uploads/gallery/${filePath}`;
  };

  const handleReaction = async (reactionType: string) => {
    const name = prompt('Your name:') || 'Anonymous';
    await addReaction(reactionType, name);
  };

  const handleComment = async () => {
    if (!commentText.trim() || !commenterName.trim()) return;
    
    await addComment(commenterName, commentText);
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
              <img
                src={getFileUrl(post.file_name)}
                alt={post.title || 'Gallery image'}
                className="w-full rounded-lg"
              />
            ) : (
              <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                <video
                  src={getFileUrl(post.file_name)}
                  controls
                  className="w-full h-full rounded-lg"
                />
              </div>
            )}
          </div>
          
          {/* Details */}
          <div className="space-y-4">
            {post.caption && (
              <p className="text-sm">{post.caption}</p>
            )}
            
            {post.tags.length > 0 && (
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
              <p>Date: {new Date(post.created_at).toLocaleDateString()}</p>
              {post.location && <p>Location: {post.location}</p>}
              {post.event_date && <p>Event Date: {new Date(post.event_date).toLocaleDateString()}</p>}
            </div>
            
            {/* Reactions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction('heart')}
              >
                <Heart className="w-4 h-4 mr-1" />
                {post.reaction_count || 0}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction('like')}
              >
                👍 {post.reaction_count || 0}
              </Button>
            </div>
            
            {/* Comments */}
            <div className="space-y-3">
              <h4 className="font-medium">Comments</h4>
              
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
  const { uploadFiles, loading } = useGalleryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 10)); // Max 10 files
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!files.length || !uploaderName.trim()) return;

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('uploaderName', uploaderName);
    if (relationship) formData.append('relationship', relationship);
    if (title) formData.append('title', title);
    if (caption) formData.append('caption', caption);
    if (tags) formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim())));
    formData.append('isPublic', isPublic.toString());

    try {
      await uploadFiles(formData);
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
      // Error is handled by the hook
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
            placeholder={t.gallery.uploaderName || "Your name *"}
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            required
          />
          
          <Input
            placeholder={t.gallery.uploaderRelationship || "Relationship (optional)"}
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
            disabled={!files.length || !uploaderName.trim() || loading}
            className="w-full"
          >
            {loading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Gallery = () => {
  const t = useTranslations();
  const { posts, loading, fetchPosts, pagination } = useGallery();
  const { stats } = useGalleryStats();
  const { tags } = useGalleryTags();
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedTags, setSelectedTags] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'event_date' | 'title'>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearch = () => {
    fetchPosts({
      search: searchTerm,
      type: selectedType === 'all' ? undefined : selectedType,
      tags: selectedTags,
      sortBy,
    });
  };

  const handlePageChange = (page: number) => {
    fetchPosts({
      page,
      search: searchTerm,
      type: selectedType === 'all' ? undefined : selectedType,
      tags: selectedTags,
      sortBy,
    });
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
            {t.gallery?.label || 'Memories Gallery'}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            {t.gallery?.title || 'Photo & Video Gallery'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.gallery?.description || 'Share and cherish memories through photos and videos'}
          </p>
          
          {stats && (
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_posts}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_images}</div>
                <div className="text-sm text-muted-foreground">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total_videos}</div>
                <div className="text-sm text-muted-foreground">Videos</div>
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
                  placeholder="Search gallery..."
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Latest</SelectItem>
                  <SelectItem value="event_date">Event Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
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
                    Upload
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
          
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Popular tags:</span>
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
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No memories shared yet</p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Be the first to share
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        )}
      </div>

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
    </section>
  );
};

export default Gallery;
