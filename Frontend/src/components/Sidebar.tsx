import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreVertical, Trash2, PanelLeft, Settings, LogOut, Sun, Moon } from 'lucide-react';
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

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    // Close menus when clicking outside
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
        <div className="w-80 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200 font-sans">
            {/* Header / New Chat */}
            {/* Header / New Chat */}
            <div className="p-3 pb-2 pt-4">
                {/* 1. Toggle Button (Top Right) */}
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onToggle}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Close Sidebar"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. New Research Button (Below) */}
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors font-medium shadow-sm hover:shadow"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Research</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors placeholder-slate-500"
                    />
                </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                {filteredSessions.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-slate-500 dark:text-slate-400 text-center flex flex-col items-center">
                        <p>No research found</p>
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

                        // Flag to track if we've shown the Clear History button
                        let clearHistoryShown = false;

                        return Object.entries(groups).map(([label, groupSessions]) => {
                            if (groupSessions.length === 0) return null;

                            // Decide if we show Clear History in this header
                            // We show it in the FIRST populated header
                            const showClearHere = !clearHistoryShown && onClearAll;
                            if (showClearHere) clearHistoryShown = true;

                            return (
                                <div key={label} className="mb-4">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            {label}
                                        </h3>
                                        {showClearHere && (
                                            <button
                                                onClick={handleClearAllClick}
                                                className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center space-x-1"
                                                title="Clear History"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>Clear History</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-0.5">
                                        {groupSessions.map((session) => (
                                            <div key={session.id} className="relative group px-2">
                                                <button
                                                    onClick={() => onSelectSession(session.id)}
                                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left pr-8 ${activeSessionId === session.id
                                                        ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm truncate">{session.title || 'Untitled Research'}</p>
                                                    </div>
                                                </button>

                                                {/* Three Dot Menu */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                                    }}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity ${menuOpenId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {menuOpenId === session.id && (
                                                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1 overflow-hidden">
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, session.id)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
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

            {/* Profile Section (Bottom) */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 relative">
                {isProfileMenuOpen && (
                    <div
                        ref={profileMenuRef}
                        className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl shadow-2xl p-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50 ring-1 ring-slate-900/5 dark:ring-white/10"
                    >
                        <div className="px-3 py-3 border-b border-slate-100 dark:border-white/10 mb-1">
                            <div className="font-medium text-sm">{user?.full_name || 'User'}</div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{user?.email || 'user@example.com'}</div>
                        </div>

                        <nav className="space-y-0.5">
                            <button
                                onClick={() => {
                                    toggleTheme();
                                }}
                                className="w-full text-left px-3 py-2.5 my-1 text-sm bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-900/80 rounded-lg flex items-center justify-between transition-colors group border border-slate-200 dark:border-white/5"
                            >
                                <div className="flex items-center space-x-2">
                                    {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                                    <span className="font-medium">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
                                </div>
                                {/* Simple Toggle Switch Graphic */}
                                <div className={`w-9 h-5 rounded-full relative transition-colors border border-transparent ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    onSettings();
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-white/10 my-1" />
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center space-x-2 transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Log out</span>
                            </button>
                        </nav>
                    </div>
                )}

                <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-full flex items-center p-2 rounded-xl transition-all ${isProfileMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                        {(user?.full_name || 'U').charAt(0)}
                    </div>
                    <div className="flex-1 text-left px-3 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.full_name || 'User'}</p>
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
