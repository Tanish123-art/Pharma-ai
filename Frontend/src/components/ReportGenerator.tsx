import { useState } from 'react';
import { FileText, Download, Save, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ReportGeneratorProps {
  sessionId: string;
  molecules: any[];
}

export default function ReportGenerator({ sessionId, molecules }: ReportGeneratorProps) {
  const { user } = useAuth();
  const [format, setFormat] = useState<'pdf' | 'pptx' | 'docx'>('pdf');
  const [sections, setSections] = useState({
    executive_summary: true,
    market_analysis: true,
    clinical_validation: true,
    patent_landscape: true,
    safety_profile: true,
    regulatory_pathway: true,
    risk_assessment: true,
    investment_recommendation: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGenerate = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const selectedSections = Object.entries(sections)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);

      const reportContent = {
        molecule: molecules[0],
        sections: selectedSections,
        generatedAt: new Date().toISOString()
      };

      await supabase.from('reports').insert({
        session_id: sessionId,
        user_id: user.id,
        title: `${molecules[0]?.name || 'Research'} - ${format.toUpperCase()} Report`,
        format,
        sections: selectedSections,
        content: reportContent
      });

      setTimeout(() => {
        setIsGenerating(false);
        setGenerated(true);
        setTimeout(() => setGenerated(false), 3000);
      }, 2000);
    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
    }
  };

  const sectionLabels = {
    executive_summary: 'Executive Summary',
    market_analysis: 'Market Opportunity Analysis',
    clinical_validation: 'Clinical Validation',
    patent_landscape: 'Patent Landscape',
    safety_profile: 'Safety Profile',
    regulatory_pathway: 'Regulatory Pathway',
    risk_assessment: 'Risk Assessment',
    investment_recommendation: 'Investment Recommendation'
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Generate Research Report</h2>
            <p className="text-sm text-slate-600">Customize your report sections and format</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-3">Report Sections</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(sectionLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleSection(key as keyof typeof sections)}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                    sections[key as keyof typeof sections]
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    sections[key as keyof typeof sections]
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {sections[key as keyof typeof sections] && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-3">Export Format</label>
            <div className="flex space-x-3">
              {(['pdf', 'pptx', 'docx'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                    format === fmt
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || generated}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : generated ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Generated!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Generate Report</span>
                </>
              )}
            </button>

            <button className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:border-slate-300 transition-colors flex items-center space-x-2">
              <Save className="w-5 h-5" />
              <span>Save Template</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8">
        <h3 className="font-semibold text-slate-900 mb-4">Report Preview</h3>
        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <h4 className="text-lg font-bold text-slate-900">{molecules[0]?.name || 'Molecule'} Research Report</h4>
            <p className="text-sm text-slate-600 mt-1">
              Generated on {new Date().toLocaleDateString()} - Format: {format.toUpperCase()}
            </p>
          </div>

          <div className="space-y-2">
            {Object.entries(sections)
              .filter(([_, enabled]) => enabled)
              .map(([key]) => (
                <div key={key} className="flex items-center space-x-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>{sectionLabels[key as keyof typeof sectionLabels]}</span>
                </div>
              ))}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              This report includes comprehensive analysis from patent, clinical, market, and safety databases.
              All sources are cited with direct links to original data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
