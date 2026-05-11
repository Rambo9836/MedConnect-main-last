import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">MedConnect</span>
            </Link>
            
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-8 ml-8">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActivePage('/dashboard')
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/search"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActivePage('/search')
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  {user?.userType === 'patient' ? 'Find Studies' : 'Find Patients'}
                </Link>
                <Link
                  to="/community"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname.startsWith('/community')
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  Communities
                </Link>
                <Link
                  to="/profile"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActivePage('/profile')
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full capitalize">
                      {user?.userType}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;