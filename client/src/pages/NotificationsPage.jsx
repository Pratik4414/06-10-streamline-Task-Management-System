import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import { Bell, BellOff, CheckCircle2, Clock, AlertTriangle, Trash2, Check } from 'lucide-react';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 5 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every 10 seconds for real-time timestamp updates
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(timeInterval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real notifications from API
      const response = await getNotifications();
      
      if (response.data && response.data.success) {
        const apiNotifications = response.data.items || [];
        setNotifications(apiNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Call API to mark as read
      await markNotificationAsRead(notificationId);
      
      // Update state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Call API to mark all as read
      await markAllNotificationsAsRead();
      
      // Update state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <CheckCircle2 className="notification-icon task-assigned" />;
      case 'deadline_approaching':
        return <Clock className="notification-icon deadline" />;
      case 'task_completed':
        return <CheckCircle2 className="notification-icon completed" />;
      case 'comment':
        return <Bell className="notification-icon comment" />;
      default:
        return <Bell className="notification-icon" />;
    }
  };

  const getTimeAgo = (date) => {
    // Use currentTime state instead of new Date() for real-time updates
    const seconds = Math.floor((currentTime - new Date(date)) / 1000);
    
    if (seconds < 10) return 'Just now';
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';
    
    return Math.floor(seconds) + ' second' + (Math.floor(seconds) > 1 ? 's' : '') + ' ago';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-left">
          <Bell size={28} />
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        
        {notifications.length > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="mark-all-read-btn"
          >
            <Check size={18} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      <div className="notifications-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <BellOff size={64} />
            <h3>No notifications</h3>
            <p>
              {filter === 'unread' ? 
                "You're all caught up!" : 
                "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.priority || ''}`}
              onClick={() => !notification.read && handleMarkAsRead(notification._id)}
            >
              <div className="notification-icon-wrapper">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">
                    {getTimeAgo(notification.createdAt)}
                  </span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                {notification.task && (
                  <div className="notification-details">
                    <span className="detail-item">
                      <strong>Task:</strong> {notification.task.title}
                    </span>
                    {notification.task.dueDate && (
                      <span className="detail-item">
                        <Clock size={14} />
                        Due: {new Date(notification.task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {notification.project && (
                      <span className="detail-item">
                        <strong>Project:</strong> {notification.project.name}
                      </span>
                    )}
                  </div>
                )}
                
                {notification.priority === 'urgent' && (
                  <div className="urgent-badge">
                    <AlertTriangle size={16} />
                    Urgent
                  </div>
                )}
              </div>
              
              {!notification.read && (
                <div className="unread-indicator"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
