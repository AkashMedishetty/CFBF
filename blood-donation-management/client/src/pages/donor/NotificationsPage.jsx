import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Heart, 
  Droplet, 
  Calendar, 
  CheckCircle,
  X,
  Filter,
  Search
} from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import logger from '../../utils/logger';
import { authApi } from '../../utils/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logger.componentMount('NotificationsPage');
    fetchNotifications();
    
    return () => {
      logger.componentUnmount('NotificationsPage');
    };
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // Get current user id
      const me = await authApi.getCurrentUser();
      const u = me?.data?.user || me?.data;
      const userId = u?._id || u?.id || localStorage.getItem('userId');
      if (!userId) throw new Error('USER_ID_NOT_AVAILABLE');

      // Fetch notifications from API (replace with actual endpoint when available)
      const res = await fetch(`/api/v1/users/${userId}/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const apiItems = (data?.data?.notifications || data?.notifications || []).map((n, idx) => ({
        id: n.id || n._id || idx,
        type: n.type || 'system',
        title: n.title || n.message || 'Notification',
        message: n.message || '',
        timestamp: n.timestamp || n.createdAt || new Date().toISOString(),
        read: Boolean(n.read),
        priority: n.priority || 'normal',
        icon: (n.type === 'blood_request' ? Droplet : n.type === 'donation_reminder' ? Heart : n.type === 'appointment' ? Calendar : CheckCircle),
        color: (n.type === 'blood_request' ? 'red' : n.type === 'donation_reminder' ? 'green' : n.type === 'appointment' ? 'purple' : 'blue')
      }));

      setNotifications(apiItems);
      logger.success('Notifications loaded (API)', 'NOTIFICATIONS_PAGE');
    } catch (error) {
      logger.error('Failed to load notifications', 'NOTIFICATIONS_PAGE', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else {
        filtered = filtered.filter(n => n.type === filter);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getNotificationIcon = (notification) => {
    const IconComponent = notification.icon;
    const colorClasses = {
      red: 'text-red-600 bg-red-100',
      green: 'text-green-600 bg-green-100',
      blue: 'text-blue-600 bg-blue-100',
      purple: 'text-purple-600 bg-purple-100',
      yellow: 'text-yellow-600 bg-yellow-100'
    };
    
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[notification.color] || 'text-gray-600 bg-gray-100'}`}>
        <IconComponent className="h-5 w-5" />
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
              <Bell className="h-8 w-8" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="red" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Stay updated with blood requests and system updates
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark All Read</span>
            </Button>
          )}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="blood_request">Blood Requests</option>
                  <option value="donation_reminder">Reminders</option>
                  <option value="system">System</option>
                  <option value="appointment">Appointments</option>
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Bell className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'You\'re all caught up! New notifications will appear here.'
                }
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`p-4 transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {getNotificationIcon(notification)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${
                            !notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-slate-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.priority === 'high' && (
                              <Badge variant="red" size="sm">
                                High Priority
                              </Badge>
                            )}
                            {!notification.read && (
                              <Badge variant="blue" size="sm">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;