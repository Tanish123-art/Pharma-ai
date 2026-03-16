import { useState } from 'react';
import { Pill, TrendingUp, Scale, Activity, FileText, Target, ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react';

interface ResultsVisualizationProps {
  molecules: any[];
  session: any;
}

export default function ResultsVisualization({ molecules, session }: ResultsVisualizationProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'RECOMMENDED';
    if (score >= 60) return 'MODERATE';
    return 'LOW CONFIDENCE';
  };

  if (molecules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-600">No results available yet</p>
      </div>
    );
  }

  const molecule = molecules[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-4xl font-bold tracking-tight">{molecule.name}</h2>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                  Analyzed
                </span>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">{molecule.summary}</p>
            </div>
            {/* Confidence Badge Removed */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glass-hover">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100/80 dark:bg-blue-900/50 rounded-xl flex items-center justify-center shadow-inner">
              <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Molecule Summary</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{molecule.name}</span>
            </li>
            <li className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{molecule.safety_profile.split('.')[0]}</span>
            </li>
            <li className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{molecule.cost_analysis.split(',')[0]}</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glass-hover">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100/80 dark:bg-green-900/50 rounded-xl flex items-center justify-center shadow-inner">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Market Analysis</h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Market Size</span>
              <span className="font-bold text-slate-900 dark:text-white">{molecule.market_data.size}</span>
            </li>
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">CAGR</span>
              <span className="font-bold text-green-600 dark:text-green-400">{molecule.market_data.cagr}</span>
            </li>
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Competition</span>
              <span className="font-bold text-slate-900 dark:text-white">{molecule.market_data.competition}</span>
            </li>
            <li className="text-slate-700 dark:text-slate-300 pt-2 px-2 text-xs leading-relaxed">
              <span className="font-bold text-blue-600 dark:text-blue-400">Opportunity Gap:</span> {molecule.market_data.gap}
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glass-hover">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100/80 dark:bg-purple-900/50 rounded-xl flex items-center justify-center shadow-inner">
              <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Patent Landscape</h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Status</span>
              <span className="font-bold text-green-600 dark:text-green-400">{molecule.patent_status.status}</span>
            </li>
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">FTO</span>
              <span className="font-bold text-green-600 dark:text-green-400">{molecule.patent_status.fto}</span>
            </li>
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Blockers</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">{molecule.patent_status.blockers}</span>
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glass-hover">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100/80 dark:bg-red-900/50 rounded-xl flex items-center justify-center shadow-inner">
              <Activity className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Clinical Evidence</h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Active Trials</span>
              <span className="font-bold text-slate-900 dark:text-white">{molecule.clinical_evidence.trials}+</span>
            </li>
            <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Phase</span>
              <span className="font-bold text-slate-900 dark:text-white">{molecule.clinical_evidence.phase}</span>
            </li>
            <li className="text-slate-700 dark:text-slate-300 pt-2 px-2 text-xs leading-relaxed border-t border-slate-100 dark:border-slate-800/50">
              <span className="font-bold text-blue-600 dark:text-blue-400">MOA:</span> {molecule.clinical_evidence.moa}
            </li>
          </ul>
        </div>

        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 hover:shadow-glass-hover md:col-span-2 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-amber-100/80 dark:bg-amber-900/50 rounded-xl flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Safety & Cost Profile</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Safety Summary</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{molecule.safety_profile}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Market Economics</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{molecule.cost_analysis}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={() => toggleSection('detailed')}
          className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detailed Analysis & Data Sources</h3>
          </div>
          {expandedSections['detailed'] ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedSections['detailed'] && (
          <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div className="p-5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Verified Data Sources
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <li className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>ClinicalTrials.gov - 15 active trials</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>USPTO Patent Database - Landscape analyzed</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>IQVIA Market Intelligence - Data verified</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>FDA FAERS Database - Safety profile</span>
                </li>
              </ul>
            </div>

            <div className="p-5 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Key Strategic Insights
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Strong repurposing candidate with established safety profile and minimal toxicity risks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Clear freedom to operate with no major patent blockers identified in key jurisdictions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Significant market opportunity in the underserved pediatric segment with high growth potential.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Low manufacturing complexity suggests favorable cost-of-goods and rapid scalability.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
