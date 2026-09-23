import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import type { ValidationSummary } from '../types/prospect';

interface ValidationBannerProps {
  summary: ValidationSummary;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({ summary }) => {
  const [expanded, setExpanded] = useState(false);

  // If validation fails, ALWAYS show a prominent sticky RED banner
  if (!summary.isValid) {
    return (
      <div className="w-full bg-rose-600 text-white shadow-lg border-b border-rose-700 py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white/20 rounded-md">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">
                CRITICAL DATA VALIDATION ERROR
              </div>
              <div className="text-xs text-rose-100">
                Dataset does not match required baseline counts. Review errors below.
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs bg-white text-rose-700 font-semibold px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors self-end sm:self-auto"
          >
            {expanded ? 'Hide Details' : 'View Errors'}
          </button>
        </div>
        {expanded && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-rose-900/60 rounded-xl text-xs space-y-1 font-mono">
            {summary.errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-rose-300">•</span>
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // When valid, show a subtle collapsible integrity chip or banner
  return (
    <div className="w-full bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs py-1.5 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold">Dataset loaded:</strong>{' '}
            <strong className="font-mono">{summary.total.toLocaleString('en-IN')}</strong> prospects across{' '}
            {Object.keys(summary.regionCounts).length} regions · Tier A: {summary.tierA}.
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 flex items-center gap-1 font-medium text-[11px] ml-2"
        >
          <span>{expanded ? 'Less' : 'Details'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      {expanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-500/20">
            Total Leads: <strong className="text-emerald-700 dark:text-emerald-300">{summary.total} / {Object.values(summary.expectedCounts).reduce((a, b) => a + b, 0)}</strong>
          </div>
          {Object.entries(summary.expectedCounts).map(([region, count]) => (
            <div key={region} className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-500/20">
              {region}: <strong className="text-emerald-700 dark:text-emerald-300">{summary.regionCounts[region] || 0} / {count}</strong>
            </div>
          ))}
          <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-500/20">
            Tier A (High Fit): <strong className="text-emerald-700 dark:text-emerald-300">{summary.tierA}</strong>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-500/20">
            Listed Phone: <strong className="text-emerald-700 dark:text-emerald-300">{summary.hasPhone}</strong>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-500/20">
            No Phone Listed: <strong className="text-emerald-700 dark:text-emerald-300">{summary.noneListedPhone}</strong>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-emerald-500/20">
            Integrity Check: <strong className="text-emerald-600 dark:text-emerald-400">PASSED 100%</strong>
          </div>
        </div>
      )}
    </div>
  );
};
