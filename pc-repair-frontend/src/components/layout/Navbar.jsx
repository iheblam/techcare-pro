import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wrench, Menu, X, Home, MessageSquare, BookOpen, 
  Ticket, LayoutDashboard, User, LogOut, Settings, UserPlus, FileText, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { Badge } from '../common/Badge';
import { authAPI } from '../../services/apiService';
import logo from '../../assets/logo.jpg';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isTechnician, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingApplicationsCount();
    }
  }, [isAdmin]);

  const fetchPendingApplicationsCount = async () => {
    try {
      const response = await authAPI.getAdminApplications({ status: 'pending' });
      setPendingApplicationsCount(response.data.statistics?.pending || 0);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getUserTypeBadge = () => {
    if (!user?.user_type) return null;
    
    const badgeConfig = {
      admin: { variant: 'error', label: 'Admin' },
      technician: { variant: 'warning', label: 'Technician' },
      client: { variant: 'info', label: 'Client' }
    };

    const config = badgeConfig[user.user_type];
    return config ? <Badge variant={config.variant} size="sm">{config.label}</Badge> : null;
  };

  const isClient = user?.user_type === 'client';

  const navigation = [
    { name: 'Home', path: '/', icon: Home, show: true },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare, show: isAuthenticated },
    { name: 'Issue Library', path: '/issues', icon: BookOpen, show: true },
    { name: 'My Tickets', path: '/tickets', icon: Ticket, show: isAuthenticated },
    { name: 'Become a Technician', path: '/technician/apply', icon: UserPlus, show: isClient, highlight: true },
    { name: 'Application Status', path: '/technician/application-status', icon: FileText, show: isClient },
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, show: isAdmin },
    { name: 'Review Applications', path: '/admin/applications', icon: UserCheck, show: isAdmin, badge: pendingApplicationsCount },
    { name: 'Tech Dashboard', path: '/technician', icon: LayoutDashboard, show: isTechnician },
  ].filter(item => item.show);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={logo} 
              alt="TechCare Pro" 
              className="h-10 w-auto rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              TechCare Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : item.highlight
                      ? 'text-primary-600 hover:bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <Badge variant="error" size="sm">{item.badge}</Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.full_name || user.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      style={{ aspectRatio: '1/1' }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.first_name || user?.username || 'Profile'}
                    </span>
                    {getUserTypeBadge()}
                  </div>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : item.highlight
                      ? 'text-primary-600 hover:bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <Badge variant="error" size="sm">{item.badge}</Badge>
                  )}
                </Link>
              );
            })}
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.full_name || user.username}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                    )}
                    <span>{user?.first_name || user?.username || 'Profile'}</span>
                  </div>
                  {getUserTypeBadge()}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="ghost" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="primary" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
