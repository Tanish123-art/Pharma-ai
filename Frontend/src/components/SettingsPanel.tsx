import { useState } from 'react';
import { X, User, Edit2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface SettingsPanelProps {
    onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
    const { user } = useAuth();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await api.put('/auth/profile', profileData);
            setIsEditingProfile(false);
            // Optionally refresh user data in AuthContext
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setProfileData({
            full_name: user?.full_name || '',
            email: user?.email || '',
        });
        setIsEditingProfile(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-200/50 dark:bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                                <User className="w-6 h-6 text-indigo-100" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
                                <p className="text-indigo-200 text-sm font-medium">Manage your profile and preferences</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
                    {/* Profile Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                                Profile Information
                            </h3>
                            {!isEditingProfile && (
                                <button
                                    onClick={() => setIsEditingProfile(true)}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all text-sm font-bold uppercase tracking-wide"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit Profile</span>
                                </button>
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-xl p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Full Name
                                </label>
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#020617] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none"
                                    />
                                ) : (
                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-lg">{user?.full_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                {isEditingProfile ? (
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#020617] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none"
                                    />
                                ) : (
                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-lg">{user?.email}</p>
                                )}
                            </div>

                            {isEditingProfile && (
                                <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-white/5">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm font-bold border border-slate-200 dark:border-white/5"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center pt-8 border-t border-slate-200 dark:border-white/5">
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-600">PharmaAI Research Platform v1.0.0</p>
                        <p className="text-xs text-slate-600 dark:text-slate-700 mt-1">© 2024 Neural Research Systems. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
