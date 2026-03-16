import { useState, useEffect, useRef } from 'react';
import { Download, Bot, User, Send, Square, Sparkles, TrendingUp, Heart, FlaskConical, Microscope, Pill, Activity, BarChart3, FileText, Shield } from 'lucide-react';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import AgentOutputs from './AgentOutputs';
import MermaidDiagram from './MermaidDiagram';


interface ResearchInterfaceProps {
  sessionId: string | null;
  onStartResearch: (query: string, title: string, id: string) => void;
}

/* ─── Animated Molecule SVG for Hero ─── */
function AnimatedMolecule() {
  return (
    <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05] pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 800 600">
        {/* Central hexagonal structure */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 400 + Math.cos(rad) * 100;
          const cy = 300 + Math.sin(rad) * 100;
          const nextRad = ((angle + 60) * Math.PI) / 180;
          const nx = 400 + Math.cos(nextRad) * 100;
          const ny = 300 + Math.sin(nextRad) * 100;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0ca5eb" strokeWidth="2" opacity="0.5" />
              <circle cx={cx} cy={cy} r="8" fill="#0ca5eb">
                <animate attributeName="r" values="8;10;8" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              {/* Branch atoms */}
              {i % 2 === 0 && (
                <g>
                  <line x1={cx} y1={cy} x2={cx + Math.cos(rad) * 60} y2={cy + Math.sin(rad) * 60} stroke="#14b8a6" strokeWidth="1.5" opacity="0.4" />
                  <circle cx={cx + Math.cos(rad) * 60} cy={cy + Math.sin(rad) * 60} r="5" fill="#14b8a6" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;0.9;0.6" dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              )}
            </g>
          );
        })}
        {/* Floating outer particles */}
        {[
          { cx: 150, cy: 100, r: 4, dur: 5 }, { cx: 650, cy: 150, r: 3, dur: 7 },
          { cx: 100, cy: 400, r: 5, dur: 6 }, { cx: 700, cy: 450, r: 4, dur: 8 },
          { cx: 300, cy: 500, r: 3, dur: 5.5 }, { cx: 550, cy: 80, r: 4, dur: 6.5 },
        ].map((p, i) => (
          <circle key={`outer-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={i % 2 === 0 ? '#0ca5eb' : '#14b8a6'} opacity="0.3">
            <animate attributeName="cy" values={`${p.cy};${p.cy - 20};${p.cy}`} dur={`${p.dur}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur={`${p.dur}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </div>
  );
}

/* ─── Feature Card Component ─── */
function FeatureCard({ icon: Icon, title, description, color, onClick }: {
  icon: any;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-medical-50 dark:bg-medical-500/10 text-medical-600 dark:text-medical-400 group-hover:bg-medical-100 dark:group-hover:bg-medical-500/15',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/15',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/15',
    teal: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-500/15',
  };

  const borderMap: Record<string, string> = {
    blue: 'hover:border-medical-300 dark:hover:border-medical-500/30',
    purple: 'hover:border-purple-300 dark:hover:border-purple-500/30',
    amber: 'hover:border-amber-300 dark:hover:border-amber-500/30',
    teal: 'hover:border-teal-300 dark:hover:border-teal-500/30',
  };

  return (
    <button
      onClick={onClick}
      className={`group feature-card text-left border border-slate-200/60 dark:border-slate-700/30 ${borderMap[color]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl feature-icon ${colorMap[color]} transition-colors duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-slate-800 dark:text-white text-sm">{title}</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </button>
  );
}

/* ─── Stat Card with Animated Bar ─── */
function StatCard({ label, value, percentage, color }: {
  label: string; value: string; percentage: number; color: string;
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 500);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}</span>
      </div>
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{
            width: `${animatedWidth}%`,
            background: color === 'medical' ? 'linear-gradient(90deg, #0ca5eb, #36bffa)' :
                        color === 'teal' ? 'linear-gradient(90deg, #14b8a6, #5eead4)' :
                        'linear-gradient(90deg, #22c55e, #86efac)'
          }}
        />
      </div>
    </div>
  );
}

export default function ResearchInterface({ sessionId, onStartResearch }: ResearchInterfaceProps) {
  const [session, setSession] = useState<any>(null);
  const [polling, setPolling] = useState(true);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isAutoSelect, setIsAutoSelect] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['web', 'iqvia', 'clinical', 'patent', 'exim', 'internal']);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      setSession(null);
      setPolling(true);
      loadSession(sessionId);
    } else {
      setSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionId && polling) {
      interval = setInterval(() => {
        loadSession(sessionId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [sessionId, polling]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node)) {
        setShowAgentMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSession = async (id: string) => {
    try {
      const { data } = await api.get(`/research/sessions/${id}`);
      setSession(data);
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        setPolling(false);
      }
    } catch (error) {
      console.error("Failed to load session", error);
      setPolling(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!session?.id) return;
    try {
      window.open(`http://127.0.0.1:8000/reports/${session.id}/download`, '_blank');
    } catch (error) {
      console.error("Failed to download", error);
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.id) return;
    try {
      await api.post(`/research/sessions/${session.id}/stop`);
      setSession((prev: any) => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      console.error("Failed to stop research", error);
    }
  };

  const toggleAgent = (agent: string) => {
    setSelectedAgents(prev =>
      prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const title = input.slice(0, 50) + (input.length > 50 ? '...' : '');
      const payload: any = { quote: input, title, query: input };
      if (!isAutoSelect) {
        payload.agents = selectedAgents;
      }
      const { data } = await api.post('/research/start', payload);
      onStartResearch(input, title, data.id);
      setInput('');
    } catch (error) {
      console.error("Failed to start research", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = session && (session.status === 'pending' || session.status === 'running');
  const [executionTime, setExecutionTime] = useState(0);
  const [longRunningNotified, setLongRunningNotified] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing) {
      timer = setInterval(() => {
        setExecutionTime(prev => prev + 1);
      }, 1000);

      if (executionTime > 45 && !longRunningNotified) {
        setLongRunningNotified(true);
        api.post('/notifications', {
          title: "Extended Analysis",
          message: "The current research task is complex and taking longer than usual. Please wait.",
          type: "alert"
        }).catch(console.error);
      }
    } else {
      setExecutionTime(0);
      setLongRunningNotified(false);
    }
    return () => clearInterval(timer);
  }, [isProcessing, executionTime, longRunningNotified]);

  const getCleanReport = () => {
    let report = session?.findings?.final_report || session?.findings?.summary;
    if (!report) return null;
    if (typeof report !== 'string') {
      if (typeof report === 'object' && report.summary) return report.summary;
      return "Reviewing the detailed findings below will provide the best insights. (Abstract generation pending)";
    }
    if (report.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(report);
        if (parsed.summary) return parsed.summary;
        if (parsed.final_report) return parsed.final_report;
        return "Reviewing the detailed findings below will provide the best insights. (Abstract generation pending)";
      } catch (e) {
        if (report.includes('": "') || report.includes('": [') || report.includes('": {')) {
          return "Reviewing the detailed findings below will provide the best insights.";
        }
      }
    }
    report = report.replace(/<\s*viz_data\s*>[\s\S]*?<\s*\/\s*viz_data\s*>/gi, '');
    report = report.replace(/<\s*viz_data\s*>[\s\S]*/gi, '');
    report = report.replace(/<\s*executive_summary\s*>/gi, '');
    report = report.replace(/<\s*\/\s*executive_summary\s*>/gi, '');
    report = report.replace(/\[executivesummary\]:?/gi, '');
    report = report.replace(/\[viz_data\]:?/gi, '');
    if (report.includes('Findings: {') || report.includes('"_plan": [')) {
      return "Reviewing the detailed findings below will provide the best insights. (Abstract generation pending)";
    }
    return report;
  };

  const finalReport = getCleanReport();

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Session Header */}
      {session && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/40 dark:border-slate-700/20 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {isProcessing ? (
              <div className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-medical-500" />
              </div>
            ) : (
              <div className="h-2.5 w-2.5 rounded-full bg-teal-500 flex-shrink-0 shadow-teal-glow" />
            )}
            <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {session.title || 'Ongoing Research'}
            </h2>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8 pb-2">

          {/* ═══════════ HOME / WELCOME SCREEN ═══════════ */}
          {!session && !sessionId && (
            <div className="flex flex-col items-center justify-start pt-8 text-center space-y-10 px-4 animate-fade-in-up relative">
              <AnimatedMolecule />

              {/* Hero */}
              <div className="space-y-5 relative z-10">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto" style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 8px 40px rgba(6, 182, 212, 0.25), 0 0 0 4px rgba(6, 182, 212, 0.1)',
                }}>
                  <Heart className="w-10 h-10 text-white animate-heartbeat" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                  PharmaAI Research
                  <span style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}> Agent</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-base leading-relaxed">
                  Deep-dive market analysis, patent landscapes, and clinical trial intelligence powered by advanced AI.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-xl relative z-10">
                <StatCard label="Active Trials" value="12,847" percentage={78} color="medical" />
                <StatCard label="Patents Indexed" value="2.1M+" percentage={92} color="teal" />
                <StatCard label="Molecules" value="48,392" percentage={65} color="green" />
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left relative z-10">
                <FeatureCard
                  icon={TrendingUp}
                  title="Market Analysis"
                  description="Analyze global market for GLP-1 agonists"
                  color="blue"
                  onClick={() => setInput("Analyze global market for GLP-1 agonists")}
                />
                <FeatureCard
                  icon={FlaskConical}
                  title="Drug Repurposing"
                  description="Find new indications for Metformin"
                  color="purple"
                  onClick={() => setInput("Find new indications for Metformin")}
                />
                <FeatureCard
                  icon={FileText}
                  title="Patent Search"
                  description="Overview of CRISPR delivery patents"
                  color="amber"
                  onClick={() => setInput("Overview of CRISPR delivery patents")}
                />
                <FeatureCard
                  icon={Microscope}
                  title="Clinical Intel"
                  description="List ongoing Phase 3 Alzheimer's trials"
                  color="teal"
                  onClick={() => setInput("List ongoing Phase 3 Alzheimer's trials")}
                />
              </div>

              {/* Capabilities Strip */}
              <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
                {[
                  { icon: BarChart3, label: 'Market Data' },
                  { icon: Pill, label: 'Drug Intel' },
                  { icon: Activity, label: 'Clinical Trials' },
                  { icon: Shield, label: 'Patent DB' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/30 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Icon className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ MESSAGES ═══════════ */}
          {session && (
            <>
              {/* User Query */}
              <div className="flex justify-end px-4 animate-fade-in-up">
                <div className="flex gap-3 max-w-[85%] flex-row-reverse group">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-300/20 dark:border-slate-600/30 shadow-card group-hover:scale-105 transition-transform duration-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="chat-user">
                    <p className="font-medium tracking-wide">{session.query?.query || session.query?.quote}</p>
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start px-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <div className="flex gap-3 w-full max-w-full">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-medical-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-2 shadow-medical ring-2 ring-medical-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 space-y-4 max-w-[95%] min-w-0">
                    <div className="chat-ai group">
                      {isProcessing && !finalReport ? (
                        <div className="flex items-center gap-4 py-2">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-medical-400 rounded-full animate-[blink_1.4s_infinite_both]" />
                            <div className="w-2 h-2 bg-medical-400 rounded-full animate-[blink_1.4s_infinite_both_0.2s]" />
                            <div className="w-2 h-2 bg-medical-400 rounded-full animate-[blink_1.4s_infinite_both_0.4s]" />
                          </div>
                          <span className="text-sm font-medium text-medical-500 dark:text-medical-400 animate-pulse tracking-wide">
                            {executionTime > 30 ? "Analyzing complex data..." : "Orchestrating research agents..."}
                          </span>
                        </div>
                      ) : finalReport ? (
                        <div className="space-y-6 relative z-10">
                          <div className="prose-medical">
                            <ReactMarkdown
                              components={{
                                code(props) {
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                  const { children, className, node, ...rest } = props;
                                  const match = /language-(\w+)/.exec(className || '');
                                  if (match && match[1] === 'mermaid') {
                                    return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                                  }
                                  return (
                                    <code className={`${className} bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-medical-600 dark:text-medical-400 text-sm border border-slate-200/50 dark:border-slate-700/30`} {...rest}>
                                      {children}
                                    </code>
                                  );
                                },
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-6 mb-4 tracking-tight" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-3 border-b border-slate-200 dark:border-slate-700/30 pb-2" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-medical-600 dark:text-medical-400" {...props} />,
                                ul: ({ node, ...props }) => <ul className="space-y-2 my-4" {...props} />,
                                li: ({ node, ...props }) => <li className="text-slate-600 dark:text-slate-300" {...props} />,
                              }}
                            >
                              {finalReport}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Analysis failed or no report generated.</span>
                      )}

                      {/* Export */}
                      {session.findings?.final_report && (
                        <div className="flex justify-end pt-5 mt-5 border-t border-slate-200/50 dark:border-slate-700/20">
                          <button
                            onClick={handleDownloadReport}
                            className="group/btn flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-medical-50 dark:hover:bg-medical-500/10 border border-slate-200/60 dark:border-slate-700/30 hover:border-medical-300 dark:hover:border-medical-500/30 px-4 py-2 rounded-xl transition-all"
                            id="export-report-button"
                          >
                            <Download className="w-3.5 h-3.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            <span>Export Report</span>
                          </button>
                        </div>
                      )}

                      {/* Agent Findings */}
                      {session.findings && (
                        <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/20">
                          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Intelligence Sources</h3>
                          <AgentOutputs findings={session.findings} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* ═══════════ INPUT BAR ═══════════ */}
      <div className="p-4 bg-gradient-to-t from-white dark:from-[#0a1628] via-white/90 dark:via-[#0a1628]/90 to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">

          {/* Agent Menu */}
          {showAgentMenu && (
            <div ref={agentMenuRef} className="absolute bottom-20 left-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/40 rounded-2xl shadow-glass-lg p-4 w-72 z-50 animate-slide-up">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/30">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Research Agents</span>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-200/50 dark:border-teal-500/20">PRO</span>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                <label className="flex items-center gap-3 cursor-pointer group p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isAutoSelect ? 'bg-gradient-to-br from-medical-500 to-teal-500 shadow-medical' : 'border border-slate-300 dark:border-slate-600 group-hover:border-medical-400'}`}>
                    {isAutoSelect && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="hidden" checked={isAutoSelect} onChange={() => setIsAutoSelect(!isAutoSelect)} />
                  <div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Auto-Pilot</span>
                    <span className="text-xs text-slate-400">AI selects optimal agents</span>
                  </div>
                </label>
                {!isAutoSelect && (
                  <div className="space-y-1 mt-2">
                    {[
                      { id: 'web', label: 'Web Search', icon: '🌐' },
                      { id: 'iqvia', label: 'Market Data', icon: '📊' },
                      { id: 'clinical', label: 'Clinical Trials', icon: '🏥' },
                      { id: 'patent', label: 'Patent DB', icon: '📜' }
                    ].map(agent => (
                      <label key={agent.id} className="flex items-center gap-3 cursor-pointer p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                        <input type="checkbox" className="rounded-md border-slate-300 dark:border-slate-600 bg-transparent text-medical-500 focus:ring-offset-0" checked={selectedAgents.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                        <span className="text-sm text-slate-600 dark:text-slate-300">{agent.icon} {agent.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="chat-input group">
            <button
              type="button"
              onClick={() => setShowAgentMenu(!showAgentMenu)}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${showAgentMenu ? 'bg-medical-50 dark:bg-medical-500/10 text-medical-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Select Data Sources"
              disabled={isProcessing}
              id="agent-menu-toggle"
            >
              <Sparkles className={`w-5 h-5 ${isAutoSelect ? 'text-teal-500' : ''}`} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sessionId ? "Ask a follow-up question..." : "Ask about a molecule, disease, or repurposing idea..."}
              disabled={!!sessionId || isSubmitting}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium px-2"
              id="research-input"
            />

            <button
              type="submit"
              disabled={(!isProcessing && !!sessionId) || (!input.trim() && !isProcessing)}
              className="btn-send relative overflow-hidden group/send"
              onClick={isProcessing ? handleStop : undefined}
              id="research-submit"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/send:translate-y-0 transition-transform duration-300" />
              {isProcessing ? (
                <Square className="w-4 h-4 fill-current animate-pulse" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          <div className="text-center mt-3 h-4 flex justify-center items-center gap-2">
            {!isProcessing && !sessionId && (
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                {isAutoSelect ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    Auto-Pilot Active
                  </>
                ) : (
                  <>
                    <span>Active agents:</span>
                    <span className="text-medical-500 font-bold">{selectedAgents.length}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
