import { useState, useEffect, useRef } from 'react';
import { Download, Bot, User, Send, Square, Sparkles, TrendingUp, Search } from 'lucide-react';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import AgentOutputs from './AgentOutputs';
import MermaidDiagram from './MermaidDiagram';


interface ResearchInterfaceProps {
  sessionId: string | null;
  onStartResearch: (query: string, title: string, id: string) => void;
}

export default function ResearchInterface({ sessionId, onStartResearch }: ResearchInterfaceProps) {
  const [session, setSession] = useState<any>(null);
  const [polling, setPolling] = useState(true);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Agent Selection State
  const [isAutoSelect, setIsAutoSelect] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['web', 'iqvia', 'clinical', 'patent', 'exim', 'internal']);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  // Initial Load & Polling
  useEffect(() => {
    if (sessionId) {
      setSession(null); // Clear previous to prevent flickering old data
      setPolling(true);
      loadSession(sessionId);
    } else {
      setSession(null); // Reset for new chat
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionId && polling) {
      interval = setInterval(() => {
        loadSession(sessionId);
      }, 3000); // 3s polling
    }
    return () => clearInterval(interval);
  }, [sessionId, polling]);

  // Click Outside to close Agent Menu
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
      // Optimistically update status to avoid race conditions with polling
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

    if (sessionId) {
      // logic for follow up if needed
    }

    setIsSubmitting(true);
    try {
      const title = input.slice(0, 50) + (input.length > 50 ? '...' : '');

      // Prepare payload
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

      // Trigger notification if running > 45s and not yet notified
      if (executionTime > 45 && !longRunningNotified) {
        setLongRunningNotified(true);
        // Send notification to backend
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

  // Safe report extraction with fallback cleaning
  const getCleanReport = () => {
    let report = session?.findings?.final_report || session?.findings?.summary;
    if (!report) return null;

    if (typeof report !== 'string') {
      // If it's an object, try to extract summary
      if (typeof report === 'object' && report.summary) return report.summary;
      // Do NOT dump JSON stringified
      return "Reviewing the detailed findings below will provide the best insights. (Abstract generation pending)";
    }

    // Check if the report is actually a JSON string (LLM failure to separate)
    if (report.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(report);
        if (parsed.summary) return parsed.summary;
        if (parsed.final_report) return parsed.final_report;
        // If it's the raw/findings dict, don't show it
        return "Reviewing the detailed findings below will provide the best insights. (Abstract generation pending)";
      } catch (e) {
        // Not valid JSON, continue
        // If it looks like JSON but failed parsing, it might be partial. 
        // Safer to hide it if it looks completely like code.
        if (report.includes('": "') || report.includes('": [') || report.includes('": {')) {
          return "Reviewing the detailed findings below will provide the best insights.";
        }
      }
    }

    // Clean visualization data artifacts if leaked
    report = report.replace(/<\s*viz_data\s*>[\s\S]*?<\s*\/\s*viz_data\s*>/gi, '');
    report = report.replace(/<\s*viz_data\s*>[\s\S]*/gi, ''); // Handle incomplete tag

    // Clean executive summary tags
    report = report.replace(/<\s*executive_summary\s*>/gi, '');
    report = report.replace(/<\s*\/\s*executive_summary\s*>/gi, '');
    report = report.replace(/\[executivesummary\]:?/gi, '');
    report = report.replace(/\[viz_data\]:?/gi, '');

    // Fallback: If report still contains the prompt artifact "Findings: {"
    if (report.includes('Findings: {') || report.includes('"_plan": [')) {
      return "Reviewing the detailed findings below will provide the best insights. (Abstract generation pending)";
    }

    return report;
  };

  const finalReport = getCleanReport();

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Header (Only if session active) */}
      {session && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-slate-700/30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isProcessing ? (
              <div className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </div>
            ) : (
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            )}
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate shadow-sm">
              {session.title || 'Ongoing Research'}
            </h2>
          </div>
        </div>
      )}

      {/* Content / Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8 pb-2">

          {!session && !sessionId && (
            <div className="flex flex-col items-center justify-start pt-12 text-center space-y-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 ring-4 ring-white/20 backdrop-blur-sm">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white tracking-tight drop-shadow-sm">
                  PharmaAI Research Agent
                </h1>
                <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto text-lg font-medium">
                  Deep-dive market analysis, patent landscapes, and clinical trial intelligence in seconds.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
                <button onClick={() => setInput("Analyze global market for GLP-1 agonists")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-blue-100/80 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">Market Analysis</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">"Analyze global market for GLP-1 agonists"</p>
                </button>

                <button onClick={() => setInput("Find new indications for Metformin")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-purple-100/80 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">Repurposing</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">"Find new indications for Metformin"</p>
                </button>

                <button onClick={() => setInput("Overview of CRISPR delivery patents")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-amber-100/80 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">Patent Search</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">"Overview of CRISPR delivery patents"</p>
                </button>

                <button onClick={() => setInput("List ongoing Phase 3 Alzheimer's trials")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Bot className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">Clinical Intel</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">"List ongoing Phase 3 Alzheimer's trials"</p>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {/* Messages */}
          {session && (
            <>
              {/* User Query */}
              <div className="flex justify-end px-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
                <div className="flex space-x-4 max-w-[85%] flex-row-reverse space-x-reverse group">
                  <div className="w-10 h-10 bg-slate-800/50 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <User className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div className="chat-user">
                    <p className="font-medium tracking-wide">{session.query?.query || session.query?.quote}</p>
                    <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-white/10 blur-2xl rounded-full -z-10 group-hover:bg-white/20 transition-all" />
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start px-4 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-150">
                <div className="flex space-x-4 w-full max-w-full">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-1 ring-white/30 animate-pulse-slow">
                    <Bot className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 space-y-4 max-w-[95%] min-w-0">
                    <div className="chat-ai group">
                      {isProcessing && !finalReport ? (
                        <div className="flex items-center gap-4 py-2">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-[blink_1.4s_infinite_both]"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-[blink_1.4s_infinite_both_0.2s]"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-[blink_1.4s_infinite_both_0.4s]"></div>
                          </div>
                          <span className="text-sm font-medium text-cyan-300 animate-pulse tracking-wide font-mono">
                            {executionTime > 30 ? "ANALYZING_COMPLEX_DATA..." : "ORCHESTRATING_AGENTS..."}
                          </span>
                        </div>
                      ) : finalReport ? (
                        <div className="space-y-6 relative z-10">
                          {/* Clean Text Summary */}
                          <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-cyan-300 max-w-none leading-relaxed">
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
                                    <code className={`${className} bg-black/30 px-1.5 py-0.5 rounded text-cyan-200 border border-cyan-500/20`} {...rest}>
                                      {children}
                                    </code>
                                  );
                                },
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mt-6 mb-4 tracking-tight" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-slate-100 mt-6 mb-3 border-b border-white/5 pb-2 flex items-center gap-2" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-indigo-300" {...props} />,
                                ul: ({ node, ...props }) => <ul className="space-y-2 my-4" {...props} />,
                                li: ({ node, ...props }) => <li className="flex gap-2 text-slate-300" {...props} />,
                              }}
                            >
                              {finalReport}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Analysis failed or no report generated.</span>
                      )}

                      {/* Download Button */}
                      {session.findings?.final_report && (
                        <div className="flex justify-end pt-5 mt-5 border-t border-white/5">
                          <button
                            onClick={handleDownloadReport}
                            className="group/btn flex items-center gap-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-all"
                          >
                            <Download className="w-3.5 h-3.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            <span>EXPORT REPORT</span>
                          </button>
                        </div>
                      )}

                      {/* Individual Agent Findings */}
                      {session.findings && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Intelligence Sources</h3>
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

      {/* Input Bar (Fixed Bottom) */}
      <div className="p-4 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent z-20">
        <div className="max-w-3xl mx-auto relative content-center">

          {/* Agent Menu Popover */}
          {showAgentMenu && (
            <div ref={agentMenuRef} className="absolute bottom-20 left-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] p-4 w-72 z-50 animate-in slide-in-from-bottom-2 duration-200">
              {/* Keep agent menu content same but styled dark */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-white/5">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Active Research Agents</span>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/50">PRO</span>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {/* Re-implementing the list for clarity in this view */}
                <label className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isAutoSelect ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'border border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                    {isAutoSelect && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="hidden" checked={isAutoSelect} onChange={() => setIsAutoSelect(!isAutoSelect)} />
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">Auto-Pilot</span>
                  </div>
                </label>
                {!isAutoSelect && (
                  <div className="space-y-1 mt-2 ml-1">
                    {[{ id: 'web', label: 'Web Search', icon: '🌐' }, { id: 'iqvia', label: 'Market Data', icon: '📊' }, { id: 'clinical', label: 'Clinical Trials', icon: '🏥' }, { id: 'patent', label: 'Patent DB', icon: '📜' }].map(agent => (
                      <label key={agent.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-indigo-500 focus:ring-offset-0" checked={selectedAgents.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                        <span className="text-sm text-slate-600 dark:text-slate-300">{agent.icon} {agent.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="chat-input group focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:ring-indigo-500/20">
            {/* Tools Button */}
            <button
              type="button"
              onClick={() => setShowAgentMenu(!showAgentMenu)}
              className={`p-2 rounded-xl transition-all active:scale-95 ${showAgentMenu ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              title="Select Data Sources"
              disabled={isProcessing}
            >
              <Sparkles className={`w-5 h-5 ${isAutoSelect ? 'text-cyan-500 dark:text-cyan-400 filter drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sessionId ? "Ask a follow-up question..." : "Ask about a molecule, disease, or repurposing idea..."}
              disabled={!!sessionId || isSubmitting}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base font-medium px-2"
            />

            <button
              type="submit"
              disabled={(!isProcessing && !!sessionId) || (!input.trim() && !isProcessing)}
              className="btn-send relative overflow-hidden group/send"
              onClick={isProcessing ? handleStop : undefined}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/send:translate-y-0 transition-transform duration-300" />
              {isProcessing ? (
                <Square className="w-5 h-5 fill-current animate-pulse" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </form>
          <div className="text-center mt-3 h-4 flex justify-center items-center gap-2">
            {!isProcessing && !sessionId && (
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                {isAutoSelect ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Auto-Pilot Active
                  </>
                ) : (
                  <>
                    <span>Active Agents:</span>
                    <span className="text-slate-500 dark:text-slate-400">{selectedAgents.length}</span>
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
