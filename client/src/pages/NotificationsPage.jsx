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

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Get read state from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      
      // Demo notifications for presentation
      const demoNotifications = [
        {
          _id: '1',
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: 'You have been assigned to "Shopping Cart & Checkout Flow"',
          task: {
            title: 'Shopping Cart & Checkout Flow',
            dueDate: new Date(Date.now() + 5 * 60 * 60 * 1000) // 5 hours from now
          },
          project: { name: 'E-commerce Website' },
          isRead: readNotifications.includes('1'),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          type: 'deadline_approaching',
          title: 'Deadline Alert - 1 Hour Left!',
          message: 'Task "Payment Gateway Integration" is due in 1 hour',
          task: {
            title: 'Payment Gateway Integration',
            dueDate: new Date(Date.now() + 60 * 60 * 1000)
          },
          project: { name: 'E-commerce Website' },
          isRead: readNotifications.includes('2'),
          priority: 'urgent',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          type: 'task_completed',
          title: 'Task Completed',
          message: 'Task "Project Planning & Analysis" has been marked as complete',
          task: { title: 'Project Planning & Analysis' },
          project: { name: 'Mobile App Development' },
          isRead: readNotifications.includes('3'),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '4',
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: 'You have been assigned to "Real-time Chat System"',
          task: {
            title: 'Real-time Chat System',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
          },
          project: { name: 'Mobile App Development' },
          isRead: readNotifications.includes('4'),
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '5',
          type: 'comment',
          title: 'New Comment',
          message: 'John Manager commented on "Shopping Cart & Checkout Flow"',
          task: { title: 'Shopping Cart & Checkout Flow' },
          project: { name: 'E-commerce Website' },
          isRead: readNotifications.includes('5'),
          createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
        }
      ];

      setNotifications(demoNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Update state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Persist to localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Update state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Persist to localStorage
      const allIds = notifications.map(n => n._id);
      localStorage.setItem('readNotifications', JSON.stringify(allIds));
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
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              className={`notification-item ${!notification.isRead ? 'unread' : ''} ${notification.priority || ''}`}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
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
              
              {!notification.isRead && (
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
