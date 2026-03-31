import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageSquare, 
  Eye, 
  Trash2, 
  TrendingUp, 
  Calendar,
  Heart,
  Image,
  Video,
  Activity,
  BarChart3,
  Settings,
  Home,
  LogOut,
  Menu,
  X,
  Filter,
  Search,
  Download,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";

interface DashboardStats {
  tributes: {
    total: number;
    approved: number;
    pending: number;
    this_week: number;
  };
  gallery?: {
    total: number;
    approved: number;
    pending: number;
    this_week: number;
  };
  candles: {
    total: number;
    unique_visitors: number;
    this_week: number;
  };
  analytics: {
    total_events: number;
    unique_visitors: number;
    today: number;
    this_week: number;
  };
  recentActivity: Array<{
    type: 'tribute' | 'candle' | 'gallery';
    id: number | string;
    title: string;
    approved: boolean;
    created_at: string;
  }>;
}

interface Tribute {
  id: number;
  name: string;
  relationship: string;
  message: string;
  email: string;
  approved: boolean;
  ip_address: string;
  created_at: string;
  updated_at: string;
}

interface GalleryPost {
  id: number | string;
  uploader_name: string;
  title: string;
  caption: string;
  file_name: string;
  file_type: 'image' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface TributesResponse {
  tributes: Tribute[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface GalleryResponse {
  posts: GalleryPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tributes, setTributes] = useState<TributesResponse | null>(null);
  const [gallery, setGallery] = useState<GalleryResponse | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  const [loading, setLoading] = useState(true);
  const [tributeFilter, setTributeFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'tributes') {
      fetchTributes();
    } else if (activeTab === 'gallery') {
      fetchGallery();
    }
  }, [activeTab, tributeFilter, galleryFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTributes = async () => {
    try {
      const status = tributeFilter === 'all' ? undefined : tributeFilter;
      const response = await api.get(`/admin/tributes${status ? `?status=${status}` : ''}`);
      setTributes(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tributes",
        variant: "destructive",
      });
    }
  };

  const fetchGallery = async () => {
    try {
      const status = galleryFilter === 'all' ? undefined : galleryFilter;
      const response = await api.get(`/admin/gallery${status ? `?status=${status}` : ''}`);
      setGallery(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch gallery posts",
        variant: "destructive",
      });
    }
  };

  const approveTribute = async (id: number) => {
    try {
      await api.put(`/admin/tributes/${id}/approve`);
      toast({
        title: "Success",
        description: "Tribute approved successfully",
      });
      fetchTributes();
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve tribute",
        variant: "destructive",
      });
    }
  };

  const deleteTribute = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tribute?")) return;
    
    try {
      await api.delete(`/admin/tributes/${id}`);
      toast({
        title: "Success",
        description: "Tribute deleted successfully",
      });
      fetchTributes();
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tribute",
        variant: "destructive",
      });
    }
  };

  const approveGalleryPost = async (id: number | string) => {
    try {
      await api.put(`/admin/gallery/${id}/approve`);
      toast({
        title: "Success",
        description: "Gallery post approved successfully",
      });
      fetchGallery();
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve gallery post",
        variant: "destructive",
      });
    }
  };

  const deleteGalleryPost = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this gallery post?")) return;
    
    try {
      await api.delete(`/admin/gallery/${id}`);
      toast({
        title: "Success",
        description: "Gallery post deleted successfully",
      });
      fetchGallery();
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gallery post",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getFileUrl = (fileName: string) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}/uploads/gallery/${fileName}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your memorial platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={fetchDashboardData} 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => window.open('/', '_blank')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Home className="h-4 w-4 mr-2" />
                View Site
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg"
            >
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="tributes" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Tributes
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg"
            >
              <Image className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Tributes</CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.tributes.total || 0}</div>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {stats?.tributes.this_week || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{(stats?.tributes.pending || 0) + (stats?.gallery?.pending || 0)}</div>
                <p className="text-sm text-gray-500">Items awaiting approval</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Gallery Posts</CardTitle>
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Image className="h-5 w-5 text-pink-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.gallery?.total || 0}</div>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {stats?.gallery?.this_week || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Visitors</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.analytics.unique_visitors || 0}</div>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {stats?.analytics.today || 0} today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription>Latest tributes and gallery submissions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {stats?.recentActivity.slice(0, 8).map((activity, index) => (
                  <div 
                    key={`${activity.type}-${activity.id}`} 
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'tribute' ? 'bg-purple-100' : 
                        activity.type === 'gallery' ? 'bg-pink-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'tribute' ? (
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        ) : activity.type === 'gallery' ? (
                          <Image className="h-4 w-4 text-pink-600" />
                        ) : (
                          <Heart className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={activity.approved ? "default" : "secondary"}
                      className={activity.approved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                    >
                      {activity.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tributes" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Tribute Management</CardTitle>
                    <CardDescription>Review and manage tribute submissions</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={tributeFilter === 'pending' ? 'default' : 'outline'}
                      onClick={() => setTributeFilter('pending')}
                      className={tributeFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Pending ({stats?.tributes.pending || 0})
                    </Button>
                    <Button
                      variant={tributeFilter === 'approved' ? 'default' : 'outline'}
                      onClick={() => setTributeFilter('approved')}
                      className={tributeFilter === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approved ({stats?.tributes.approved || 0})
                    </Button>
                    <Button
                      variant={tributeFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setTributeFilter('all')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      All ({stats?.tributes.total || 0})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">Name</TableHead>
                      <TableHead className="font-semibold text-gray-900">Relationship</TableHead>
                      <TableHead className="font-semibold text-gray-900">Message</TableHead>
                      <TableHead className="font-semibold text-gray-900">Date</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tributes?.tributes.map((tribute) => (
                      <TableRow key={tribute.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">{tribute.name}</TableCell>
                        <TableCell className="text-gray-600">{tribute.relationship}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-gray-600 truncate">{tribute.message}</p>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(tribute.created_at)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={tribute.approved ? "default" : "secondary"}
                            className={tribute.approved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                          >
                            {tribute.approved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!tribute.approved && (
                              <Button
                                size="sm"
                                onClick={() => approveTribute(tribute.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteTribute(tribute.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {tributes && (
                  <div className="p-4 text-sm text-gray-500 border-t border-gray-100">
                    Showing {tributes.tributes.length} of {tributes.pagination.totalItems} tributes
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Gallery Management</CardTitle>
                    <CardDescription>Review and manage photo and video submissions</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={galleryFilter === 'pending' ? 'default' : 'outline'}
                      onClick={() => setGalleryFilter('pending')}
                      className={galleryFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Pending ({stats?.gallery?.pending || 0})
                    </Button>
                    <Button
                      variant={galleryFilter === 'approved' ? 'default' : 'outline'}
                      onClick={() => setGalleryFilter('approved')}
                      className={galleryFilter === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approved ({stats?.gallery?.approved || 0})
                    </Button>
                    <Button
                      variant={galleryFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setGalleryFilter('all')}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      All ({stats?.gallery?.total || 0})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">Preview</TableHead>
                      <TableHead className="font-semibold text-gray-900">Uploader</TableHead>
                      <TableHead className="font-semibold text-gray-900">Title/Caption</TableHead>
                      <TableHead className="font-semibold text-gray-900">Type</TableHead>
                      <TableHead className="font-semibold text-gray-900">Date</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gallery?.posts.map((post) => (
                      <TableRow key={post.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {post.file_type === 'image' ? (
                              <img 
                                src={getFileUrl(post.file_name)} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{post.uploader_name}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{post.title || 'Untitled'}</p>
                            <p className="text-sm text-gray-500 truncate">{post.caption}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              post.file_type === 'image' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'
                            }
                          >
                            {post.file_type === 'image' ? (
                              <><Image className="h-3 w-3 mr-1" />Image</>
                            ) : (
                              <><Video className="h-3 w-3 mr-1" />Video</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(post.created_at)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={post.status === 'approved' ? "default" : "secondary"}
                            className={post.status === 'approved' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                          >
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {post.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => approveGalleryPost(post.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteGalleryPost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {gallery && (
                  <div className="p-4 text-sm text-gray-500 border-t border-gray-100">
                    Showing {gallery.posts.length} of {gallery.pagination.totalItems} posts
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-900">Visitor Analytics</CardTitle>
                  <CardDescription>Track visitor engagement and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats?.analytics.unique_visitors || 0}</div>
                      <p className="text-sm text-gray-600">Unique Visitors</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats?.analytics.today || 0}</div>
                      <p className="text-sm text-gray-600">Today's Activity</p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">{stats?.analytics.this_week || 0}</div>
                      <p className="text-sm text-gray-600">This Week</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats?.analytics.total_events || 0}</div>
                      <p className="text-sm text-gray-600">Total Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-900">Content Statistics</CardTitle>
                  <CardDescription>Overview of platform content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Total Tributes</p>
                          <p className="text-sm text-gray-500">All time submissions</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{stats?.tributes.total || 0}</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Image className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Gallery Posts</p>
                          <p className="text-sm text-gray-500">Photos and videos</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-pink-600">{stats?.gallery?.total || 0}</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Heart className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Digital Candles</p>
                          <p className="text-sm text-gray-500">Memorial candles lit</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats?.candles.total || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
