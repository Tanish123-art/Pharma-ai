import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, TrendingUp, CheckCircle, X } from 'lucide-react';
import api from '../lib/api';

interface NotificationsPanelProps {
  onClose: () => void;
  onUpdateCount: (count: number) => void;
}

export default function NotificationsPanel({ onClose, onUpdateCount }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/notifications');
      if (data) {
        setNotifications(data);
        const unreadCount = data.filter((n: any) => !n.is_read).length;
        onUpdateCount(unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      const unreadCount = notifications.filter(n => !n.is_read && n.id !== id).length;
      onUpdateCount(unreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await api.put('/notifications/read-all');
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        onUpdateCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        const unreadCount = notifications.filter(n => !n.is_read && n.id !== id).length;
        onUpdateCount(unreadCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'update':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'completion':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 h-full flex flex-col pointer-events-auto">
      {/* Main Panel */}
      <div className="relative flex-1 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl rounded-l-2xl border-l border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Activity Feed</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {notifications.filter(n => !n.is_read).length} new updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-500/20"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-white/5">
              <Bell className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">All caught up</p>
            <p className="text-slate-500 dark:text-slate-600 text-sm mt-1">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`group relative p-4 rounded-xl border transition-all duration-300 ${notification.is_read
                  ? 'bg-transparent border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-500/10 dark:to-blue-500/5 border-blue-100 dark:border-indigo-500/20 hover:border-blue-200 dark:hover:border-indigo-500/30'
                  }`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 p-2 rounded-lg h-fit border ${notification.is_read ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5' : 'bg-blue-100 dark:bg-indigo-500/20 border-blue-200 dark:border-indigo-500/20'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm truncate pr-2 ${notification.is_read ? 'font-medium text-slate-500 dark:text-slate-400' : 'font-bold text-slate-800 dark:text-slate-100'
                        }`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 uppercase tracking-wide"
                        >
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 uppercase tracking-wide transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>

                {/* Unread Indicator Dot */}
                {!notification.is_read && (
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Alerts Section (Footer) */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 border border-indigo-100 dark:border-white/5 p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              Intelligence Feed
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-default">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
                <span className="truncate">Phase III Metformin trials updated</span>
              </div>
              <div className="flex gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-default">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500/80 shrink-0 mt-0.5" />
                <span className="truncate">BioTech sector up 2.4% today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
