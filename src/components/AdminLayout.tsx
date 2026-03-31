import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useApi";
import { LogOut, Menu, X, Home, Users, MessageSquare, BarChart3, Settings, Image, Activity } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, loading, logout, checkAuth } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const menuItems = [
    { icon: Activity, label: "Overview", path: "/admin" },
    { icon: MessageSquare, label: "Tributes", path: "/admin?tab=tributes" },
    { icon: Image, label: "Gallery", path: "/admin?tab=gallery" },
    { icon: BarChart3, label: "Analytics", path: "/admin?tab=analytics" },
    { icon: Settings, label: "Settings", path: "/admin?tab=settings" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" && !location.search;
    }
    return location.pathname + location.search === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:border-r lg:border-gray-200
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Everbloom</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`
                    w-full justify-start h-11 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white">
          <Button
            variant="outline"
            className="w-full justify-start h-11 rounded-lg border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">Welcome to Admin Panel</span>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200"
                onClick={() => window.open('/', '_blank')}
              >
                <Home className="h-4 w-4 mr-2" />
                View Site
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
