import { useState, useEffect } from 'react';
import { Bell, Menu, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Sidebar from './Sidebar';
import ResearchInterface from './ResearchInterface';
import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentSessions();
      loadNotificationCount();
    }
  }, [user]);

  const loadRecentSessions = async () => {
    try {
      const { data } = await api.get('/research/sessions?limit=50');
      setRecentSessions(data);
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  };

  const loadNotificationCount = async () => {
    setUnreadCount(0);
  };

  const startNewResearch = (_query: string, _title: string, id: string) => {
    if (id === 'NEW') {
      setActiveSessionId(null);
    } else {
      setActiveSessionId(id);
    }
    loadRecentSessions();
  };

  const openSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  const deleteSession = async (id: string) => {
    try {
      await api.delete(`/research/sessions/${id}`);
      setRecentSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to delete session", error);
      setRecentSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) handleNewChat();
    }
  };

  const clearAllSessions = async () => {
    try {
      await api.delete('/research/sessions');
      setRecentSessions([]);
      handleNewChat();
    } catch (error) {
      console.error("Failed to clear sessions", error);
      setRecentSessions([]);
      handleNewChat();
    }
  };

  return (
    <div className="flex h-screen medical-bg overflow-hidden relative text-slate-800 dark:text-slate-200 font-sans selection:bg-medical-500/20 transition-colors duration-500">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'} transition-all duration-500 ease-in-out z-20 flex-shrink-0 overflow-hidden`}>
        <Sidebar
          sessions={recentSessions}
          activeSessionId={activeSessionId}
          onSelectSession={openSession}
          onNewChat={handleNewChat}
          onSettings={() => setShowSettings(true)}
          onDeleteSession={deleteSession}
          onClearAll={clearAllSessions}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header */}
        <div className="h-16 border-b border-slate-200/60 dark:border-slate-700/30 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6 z-[60] sticky top-0 transition-colors duration-500">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:shadow-sm"
              id="sidebar-toggle"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-medical-500 to-teal-500 flex items-center justify-center shadow-medical">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wide text-slate-800 dark:text-white text-sm">
                  PHARMA
                </span>
                <span className="font-light text-medical-500 text-sm">AI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition-all group ${
                showNotifications
                  ? 'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
              }`}
              id="notifications-toggle"
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-medical-400 to-teal-400 flex items-center justify-center text-white font-semibold text-xs shadow-sm cursor-default">
              {(user?.full_name || 'U').charAt(0)}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative scroll-smooth bg-transparent">
          <ResearchInterface
            sessionId={activeSessionId}
            onStartResearch={startNewResearch}
          />
        </div>
      </div>

      {/* Overlays (Notifications & Settings) Moved outside main content to handle z-index correctly */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-black/10 dark:bg-black/30 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full animate-slide-down">
            <NotificationsPanel onClose={() => setShowNotifications(false)} onUpdateCount={setUnreadCount} />
          </div>
          <div className="flex-1" onClick={() => setShowNotifications(false)} />
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[100]">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
}
