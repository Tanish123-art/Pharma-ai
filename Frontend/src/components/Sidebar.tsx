import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreVertical, Trash2, PanelLeft, Settings, LogOut, Sun, Moon, Heart } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
    sessions: any[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onSettings: () => void;
    onDeleteSession?: (id: string) => void;
    onClearAll?: () => void;
    onToggle: () => void;
    onLogout?: () => void;
}

export default function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat, onSettings, onDeleteSession, onClearAll, onToggle, onLogout }: SidebarProps) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredSessions = sessions.filter(s =>
        (s.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMenuOpenId(null);
        setSessionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;
        if (onDeleteSession) onDeleteSession(sessionToDelete);
        setSessionToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleClearAllClick = () => {
        setIsClearModalOpen(true);
    };

    const confirmClearAll = () => {
        if (onClearAll) onClearAll();
        setIsClearModalOpen(false);
    };

    return (
        <div className="w-80 h-screen bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/30 flex flex-col transition-all duration-300 font-sans">
            {/* Header */}
            <div className="p-3 pb-2 pt-4">
                {/* Toggle */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-medical-500 to-teal-500 flex items-center justify-center shadow-sm">
                            <Heart className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">PharmaAI</span>
                    </div>
                    <button
                        onClick={onToggle}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title="Close Sidebar"
                        id="sidebar-close"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* New Research Button */}
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-medical-500 to-teal-500 hover:from-medical-600 hover:to-teal-600 text-white py-3 rounded-xl transition-all duration-300 font-semibold shadow-medical hover:shadow-medical-lg hover:-translate-y-0.5 active:translate-y-0 text-sm"
                    id="new-research-button"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Research</span>
                </button>
            </div>

            {/* Search */}
            <div className="px-3 mb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200/60 dark:border-slate-700/40 focus:border-medical-300 dark:focus:border-medical-600/50 focus:ring-2 focus:ring-medical-500/10 focus:outline-none transition-all placeholder-slate-400"
                        id="sidebar-search"
                    />
                </div>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                {filteredSessions.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-slate-400 dark:text-slate-500 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                            <Search className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="font-medium">No research found</p>
                        <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">Start a new research session</p>
                    </div>
                ) : (
                    (() => {
                        const groups: Record<string, typeof sessions> = {
                            'Today': [],
                            'Yesterday': [],
                            'Previous 7 Days': [],
                            'Older': []
                        };

                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const lastWeek = new Date(today);
                        lastWeek.setDate(lastWeek.getDate() - 7);

                        filteredSessions.forEach(session => {
                            const date = new Date(session.created_at || new Date());
                            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                            if (dateOnly.getTime() === today.getTime()) {
                                groups['Today'].push(session);
                            } else if (dateOnly.getTime() === yesterday.getTime()) {
                                groups['Yesterday'].push(session);
                            } else if (dateOnly > lastWeek) {
                                groups['Previous 7 Days'].push(session);
                            } else {
                                groups['Older'].push(session);
                            }
                        });

                        let clearHistoryShown = false;

                        return Object.entries(groups).map(([label, groupSessions]) => {
                            if (groupSessions.length === 0) return null;

                            const showClearHere = !clearHistoryShown && onClearAll;
                            if (showClearHere) clearHistoryShown = true;

                            return (
                                <div key={label} className="mb-3">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            {label}
                                        </h3>
                                        {showClearHere && (
                                            <button
                                                onClick={handleClearAllClick}
                                                className="text-[11px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
                                                title="Clear History"
                                                id="clear-history-button"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>Clear</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-0.5">
                                        {groupSessions.map((session) => (
                                            <div key={session.id} className="relative group px-1">
                                                <button
                                                    onClick={() => onSelectSession(session.id)}
                                                    className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all text-left pr-8 text-sm ${
                                                        activeSessionId === session.id
                                                            ? 'bg-medical-50 dark:bg-medical-500/10 text-medical-700 dark:text-medical-300 border border-medical-200/50 dark:border-medical-500/20 shadow-sm'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                    }`}
                                                >
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="truncate font-medium">{session.title || 'Untitled Research'}</p>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                                    }}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all ${
                                                        menuOpenId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>

                                                {menuOpenId === session.id && (
                                                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-glass-md border border-slate-200/60 dark:border-slate-700/40 z-50 py-1 overflow-hidden animate-fade-in">
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, session.id)}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()
                )}
            </div>

            {/* Profile Section */}
            <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/30 relative">
                {isProfileMenuOpen && (
                    <div
                        ref={profileMenuRef}
                        className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-glass-lg p-1.5 overflow-hidden animate-slide-up z-50 border border-slate-200/60 dark:border-slate-700/40"
                    >
                        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700/50 mb-1">
                            <div className="font-semibold text-sm text-slate-800 dark:text-white">{user?.full_name || 'User'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || 'user@example.com'}</div>
                        </div>

                        <nav className="space-y-0.5">
                            <button
                                onClick={toggleTheme}
                                className="w-full text-left px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900/80 rounded-xl flex items-center justify-between transition-all group border border-slate-200/50 dark:border-slate-700/30"
                            >
                                <div className="flex items-center gap-2.5">
                                    {theme === 'dark' ? <Moon className="w-4 h-4 text-medical-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
                                </div>
                                <div className={`w-9 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-medical-500' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    onSettings();
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1" />

                            <button
                                onClick={onLogout}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl flex items-center gap-2.5 transition-colors text-red-600 dark:text-red-400"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Log out</span>
                            </button>
                        </nav>
                    </div>
                )}

                <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-full flex items-center p-2.5 rounded-xl transition-all ${
                        isProfileMenuOpen ? 'bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    id="profile-menu-button"
                >
                    <div className="w-9 h-9 bg-gradient-to-br from-medical-400 to-teal-400 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {(user?.full_name || 'U').charAt(0)}
                    </div>
                    <div className="flex-1 text-left px-3 overflow-hidden">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.full_name || 'User'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.email || ''}</p>
                    </div>
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete research?"
                message="This will permanently delete this research session."
                confirmText="Delete"
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={confirmClearAll}
                title="Clear all history?"
                message="Are you sure you want to delete ALL research sessions? This cannot be undone."
                confirmText="Clear All"
                isDestructive={true}
            />
        </div>
    );
}
