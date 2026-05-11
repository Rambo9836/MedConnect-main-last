import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { contactRequests } = useData();
  const [showNotifications, setShowNotifications] = useState(false);

  // Count pending notifications
  const pendingCount = contactRequests.filter(req => req.status === 'pending').length;

  const handleClick = () => {
    setShowNotifications(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default NotificationBell;
