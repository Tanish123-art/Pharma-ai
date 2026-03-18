import React, { useState } from 'react';
import { TrendingUp, Globe, Activity, Search, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AgentOutputsProps {
    findings: any;
}

const AGENT_CONFIG = {
    iqvia: {
        icon: TrendingUp,
        label: "IQVIA Market",
        accent: "from-blue-500 via-indigo-500 to-sky-500",
        glow: "shadow-blue-500/30",
    },
    exim: {
        icon: Globe,
        label: "Export / Import",
        accent: "from-green-500 via-emerald-500 to-lime-500",
        glow: "shadow-green-500/30",
    },
    patent: {
        icon: ShieldCheck,
        label: "Patent Landscape",
        accent: "from-purple-500 via-fuchsia-500 to-pink-500",
        glow: "shadow-purple-500/30",
    },
    clinical: {
        icon: Activity,
        label: "Clinical Trials",
        accent: "from-rose-500 via-red-500 to-orange-500",
        glow: "shadow-rose-500/30",
    },
    web: {
        icon: Search,
        label: "Web Intelligence",
        accent: "from-sky-500 via-cyan-500 to-teal-500",
        glow: "shadow-sky-500/30",
    },
    internal_rag: {
        icon: ShieldCheck,
        label: "Your Documents",
        accent: "from-amber-500 via-orange-500 to-rose-500",
        glow: "shadow-amber-500/30",
    },
};

export default function AgentOutputs({ findings }: AgentOutputsProps) {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    if (!findings) return null;

    const validAgents = Object.keys(AGENT_CONFIG).filter(key => {
        const data = findings[key];
        if (!data) return false;
        if (typeof data === 'string' && data.toLowerCase().includes('error')) return false;
        return true;
    });

    if (validAgents.length === 0) return null;

    const getContent = (agentKey: string) =>
        findings[agentKey][`${agentKey}_output`] ?? findings[agentKey];

    const renderContent = (content: any): React.ReactNode => {
        if (!content) return null;

        if (typeof content === 'string') {
            return (
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-slate-700 dark:text-slate-300">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            );
        }

        if (Array.isArray(content)) {
            return (
                <ul className="space-y-3 pl-5 list-disc marker:text-slate-400">
                    {content.map((item, i) => (
                        <li key={i} className="text-sm">{renderContent(item)}</li>
                    ))}
                </ul>
            );
        }

        if (typeof content === 'object') {
            return (
                <div className="grid gap-4">
                    {Object.entries(content).map(([k, v]) => {
                        if (!v || typeof v === 'object') return null;
                        return (
                            <div key={k}>
                                <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                                    {k.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                    {renderContent(v)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    return (
        <section className="mt-12 relative">
            {/* Glow Background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/60 dark:from-slate-900/40 dark:to-slate-800/40 blur-3xl rounded-3xl" />

            <h3 className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase mb-6">
                Source Intelligence
            </h3>

            {/* Agent Pills */}
            <div className="flex flex-wrap gap-4 mb-8">
                {validAgents.map(agentKey => {
                    const cfg = AGENT_CONFIG[agentKey as keyof typeof AGENT_CONFIG];
                    const isActive = activeTab === agentKey;

                    return (
                        <button
                            key={agentKey}
                            onClick={() => setActiveTab(isActive ? null : agentKey)}
                            className={`
                                relative group rounded-2xl px-5 py-3 transition-all duration-300
                                ${isActive
                                    ? `bg-gradient-to-br ${cfg.accent} text-white shadow-2xl ${cfg.glow} scale-105`
                                    : `bg-white/70 dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-slate-700 hover:scale-105 hover:shadow-xl`
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <cfg.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                <span className="font-semibold text-sm">
                                    {cfg.label}
                                </span>
                            </div>

                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-white/10 to-transparent" />
                        </button>
                    );
                })}
            </div>

            {/* Content Card */}
            {activeTab && (
                <div className="relative rounded-3xl p-8 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Accent Bar */}
                    <div
                        className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${AGENT_CONFIG[activeTab as keyof typeof AGENT_CONFIG].accent}`}
                    />

                    <div className="flex items-center gap-4 mb-6">
                        {React.createElement(
                            AGENT_CONFIG[activeTab as keyof typeof AGENT_CONFIG].icon,
                            { className: "w-7 h-7 text-slate-400" }
                        )}
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white">
                            {AGENT_CONFIG[activeTab as keyof typeof AGENT_CONFIG].label}
                        </h4>
                    </div>

                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-6 border border-slate-100 dark:border-slate-800">
                        {renderContent(getContent(activeTab))}
                    </div>
                </div>
            )}
        </section>
    );
}
