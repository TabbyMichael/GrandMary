import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, Users, MessageSquare, Eye, Trash2, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";

interface DashboardStats {
  tributes: {
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
    type: 'tribute' | 'candle';
    id: number;
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

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tributes, setTributes] = useState<TributesResponse | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  const [loading, setLoading] = useState(true);
  const [tributeFilter, setTributeFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'tributes') {
      fetchTributes();
    }
  }, [activeTab, tributeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/dashboard');
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
      const response = await api.get(`/api/admin/tributes${status ? `?status=${status}` : ''}`);
      setTributes(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tributes",
        variant: "destructive",
      });
    }
  };

  const approveTribute = async (id: number) => {
    try {
      await api.put(`/api/admin/tributes/${id}/approve`);
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
      await api.delete(`/api/admin/tributes/${id}`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tributes">Tributes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tributes</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.tributes.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tributes.this_week || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats?.tributes.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tributes.approved || 0} approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Candles Lit</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.candles.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.candles.unique_visitors || 0} unique visitors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.analytics.unique_visitors || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.analytics.today || 0} today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest tributes and candle activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity.slice(0, 10).map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {activity.type === 'tribute' ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={activity.approved ? "default" : "secondary"}>
                      {activity.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tributes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={tributeFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setTributeFilter('pending')}
              >
                Pending ({stats?.tributes.pending || 0})
              </Button>
              <Button
                variant={tributeFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setTributeFilter('approved')}
              >
                Approved ({stats?.tributes.approved || 0})
              </Button>
              <Button
                variant={tributeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setTributeFilter('all')}
              >
                All ({stats?.tributes.total || 0})
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tribute Management</CardTitle>
              <CardDescription>Review and manage tribute submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tributes?.tributes.map((tribute) => (
                    <TableRow key={tribute.id}>
                      <TableCell className="font-medium">{tribute.name}</TableCell>
                      <TableCell>{tribute.relationship}</TableCell>
                      <TableCell className="max-w-xs truncate">{tribute.message}</TableCell>
                      <TableCell>{formatDate(tribute.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={tribute.approved ? "default" : "secondary"}>
                          {tribute.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!tribute.approved && (
                            <Button
                              size="sm"
                              onClick={() => approveTribute(tribute.id)}
                              className="bg-green-600 hover:bg-green-700"
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
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {tributes.tributes.length} of {tributes.pagination.totalItems} tributes
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Visitor engagement and activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.analytics.total_events || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.analytics.unique_visitors || 0}</div>
                  <p className="text-sm text-muted-foreground">Unique Visitors</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.analytics.today || 0}</div>
                  <p className="text-sm text-muted-foreground">Today's Activity</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.analytics.this_week || 0}</div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
