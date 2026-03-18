import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, Loader, XCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../lib/api';

interface ResearchHistoryProps {
  onOpenSession: (sessionId: string) => void;
}

export default function ResearchHistory({ onOpenSession }: ResearchHistoryProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [statusFilter]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/sessions');
      let filtered = data;

      if (statusFilter !== 'all') {
        filtered = filtered.filter((s: any) => s.status === statusFilter);
      }

      setSessions(filtered);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (created: string, completed: string | null) => {
    if (!completed) return 'In progress';
    const start = new Date(created).getTime();
    const end = new Date(completed).getTime();
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes}m`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-panel rounded-2xl p-8 border border-slate-200 dark:border-white/5 relative overflow-hidden group bg-white/40 dark:bg-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-primary-500/20 transition-all duration-700" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-6 sm:space-y-0 mb-8 relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight text-glow">Research History</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-light">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} archived
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white/50 dark:bg-[#0a0a0f]/40 p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner backdrop-blur-sm transition-colors duration-300">
            <div className="relative flex-1 sm:flex-initial group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-primary-500 dark:group-focus-within/search:text-primary-400 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sessions..."
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white/50 dark:focus:bg-white/5 rounded-lg transition-all"
              />
            </div>

            <div className="w-px h-6 bg-slate-300 dark:bg-white/10" />

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-3 pr-8 py-2.5 bg-transparent text-sm text-slate-600 dark:text-slate-300 font-medium focus:outline-none cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors appearance-none"
              >
                <option value="all" className="bg-white dark:bg-[#1a1a24]">All Status</option>
                <option value="completed" className="bg-white dark:bg-[#1a1a24]">Completed</option>
                <option value="processing" className="bg-white dark:bg-[#1a1a24]">Processing</option>
                <option value="failed" className="bg-white dark:bg-[#1a1a24]">Failed</option>
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 drop-shadow-sm" />
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Loader className="w-4 h-4 text-primary-500 dark:text-primary-400 animate-spin-slow" />
            <span>Processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Failed</span>
          </div>
          <div className="ml-auto flex items-center space-x-4 opacity-70">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span>High Confidence</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Medium</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 glass-panel rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-transparent">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 animate-pulse text-sm font-medium">Loading archives...</p>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-transparent">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/5">
            <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">No sessions found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session, idx) => (
            <button
              key={session.id}
              onClick={() => onOpenSession(session.id)}
              className="group w-full bg-white/40 dark:bg-transparent backdrop-blur-md rounded-xl p-6 text-left border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] transition-all duration-300 relative overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center space-x-3 mb-2.5">
                    {getStatusIcon(session.status)}
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                      {session.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-light leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {session.query}
                  </p>
                  <div className="flex items-center space-x-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(session.created_at)}</span>
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                      {formatDuration(session.created_at, session.completed_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3 pl-4 border-l border-slate-200 dark:border-white/5">
                  <span className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full border ${session.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                    session.status === 'processing' ? 'bg-blue-50 dark:bg-primary-500/10 text-blue-600 dark:text-primary-400 border-blue-200 dark:border-primary-500/20' :
                      session.status === 'failed' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                        'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                    }`}>
                    {session.status}
                  </span>

                  {session.confidence_score > 0 && (
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${session.confidence_score >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                      session.confidence_score >= 60 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400' :
                        'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                      }`}>
                      {getConfidenceIcon(session.confidence_score)}
                      <span className="text-sm font-bold font-mono">{session.confidence_score}%</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
