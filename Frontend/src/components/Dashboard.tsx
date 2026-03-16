import { useState, useEffect } from 'react';
import { Bell, Menu, Sparkles } from 'lucide-react';
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
    <div className="flex h-screen ai-bg overflow-hidden relative text-slate-800 dark:text-slate-200 font-sans selection:bg-primary-500/30 transition-colors duration-500">
      {/* Sidebar (Left) - Glassmorphism */}
      <div className={`${isSidebarOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10'} transition-all duration-500 ease-out border-r border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-2xl shadow-2xl z-20`}>
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

      {/* Main Content (Right) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header - Glassmorphism */}
        <div className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl flex items-center justify-between px-6 z-[60] sticky top-0 transition-colors duration-500">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-100 dark:to-slate-400">
                RESEARCH<span className="font-light opacity-70">AGENT</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg transition-colors group ${showNotifications ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
              )}
            </button>


          </div>
        </div>

        {/* Content Area - Transparent to let mesh show */}
        <div className="flex-1 overflow-hidden relative scroll-smooth bg-transparent">
          <ResearchInterface
            sessionId={activeSessionId}
            onStartResearch={startNewResearch}
          />
        </div>

        {/* Overlays */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md h-full animate-in slide-in-from-right duration-300">
              <NotificationsPanel onClose={() => setShowNotifications(false)} onUpdateCount={setUnreadCount} />
            </div>
            <div className="flex-1" onClick={() => setShowNotifications(false)} />
          </div>
        )}

        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}

      </div>
    </div>
  );
}
