import React from 'react';
import {
  TrendingUp,
  Users,
  Phone,
  PhoneOff,
  ShieldAlert,
  Award,
  DollarSign,
  PieChart,
  MapPin,
  Building2,
  Package,
  Layers,
  CheckCircle,
  Clock,
  Globe,
  ArrowUpRight
} from 'lucide-react';
import type { Prospect } from '../types/prospect';
import { useTracking } from '../context/TrackingContext';
import { formatINR, isPhoneAvailable } from '../utils/formatters';
import { getWebsiteGroup } from '../utils/websiteResearch';
import { RESEARCH_CHECKED_ON, RESEARCH_TOTALS } from '../data/websiteResearch';

interface DashboardViewProps {
  prospects: Prospect[];
  onNavigateToFilter: (filters: {
    region?: string;
    city?: string;
    locality?: string;
    tier?: string;
    segment?: string;
    package?: string;
    phoneFilter?: string;
    websiteFilter?: string;
  }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  prospects,
  onNavigateToFilter
}) => {
  const { trackingMap } = useTracking();

  // Baseline metrics
  const totalLeads = prospects.length;
  const tierA = prospects.filter((p) => p.tier === 'A');
  const tierB = prospects.filter((p) => p.tier === 'B');
  const tierC = prospects.filter((p) => p.tier === 'C');

  const withPhone = prospects.filter((p) => isPhoneAvailable(p.phone));
  const nonePhone = prospects.filter((p) => !isPhoneAvailable(p.phone));

  const totalPipelineINR = prospects.reduce((acc, p) => acc + (p.dealValue || 0), 0);

  // Website research outcomes (20 Sep 2026 export, 913 of the leads)
  const noWebsiteLeads = prospects.filter((p) => getWebsiteGroup(p) === 'none-found');
  const hasWebsiteLeads = prospects.filter((p) => getWebsiteGroup(p) === 'has-website');
  const notResearchedLeads = prospects.filter((p) => getWebsiteGroup(p) === 'not-researched');
  const mapsNoButtonLeads = prospects.filter((p) => getWebsiteGroup(p) === 'maps-no-button');
  const researchedCount = totalLeads - notResearchedLeads.length - mapsNoButtonLeads.length;
  const noWebsitePipelineINR = noWebsiteLeads.reduce((acc, p) => acc + (p.dealValue || 0), 0);

  // Sales Tracking metrics from localStorage
  const trackedStatuses = Object.values(trackingMap);
  const wonLeads = prospects.filter((p) => trackingMap[p.id]?.status === 'Won');
  const wonValueINR = wonLeads.reduce((acc, p) => {
    const finalVal = trackingMap[p.id]?.finalDealValue;
    return acc + (finalVal !== null && finalVal !== undefined ? finalVal : p.dealValue);
  }, 0);

  const inProgressLeads = prospects.filter((p) => {
    const s = trackingMap[p.id]?.status;
    return s === 'Interested' || s === 'Proposal sent' || s === 'Called';
  });

  // Helper to aggregate data
  const aggregateBy = (key: keyof Prospect) => {
    const map = new Map<string, { count: number; pipeline: number }>();
    prospects.forEach((p) => {
      const val = String(p[key] || 'Unspecified').trim();
      const curr = map.get(val) || { count: 0, pipeline: 0 };
      curr.count += 1;
      curr.pipeline += p.dealValue || 0;
      map.set(val, curr);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  };

  const regionData = aggregateBy('region');
  const cityData = aggregateBy('city').slice(0, 10);
  const localityData = aggregateBy('locality').slice(0, 10);
  const segmentData = aggregateBy('segment');
  const packageData = aggregateBy('package');

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 border border-brand-400/30 text-brand-300 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>High-Velocity Prospecting Pipeline</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 mb-2 ml-0 sm:ml-2">
            <Globe className="w-3.5 h-3.5" />
            <span>
              {noWebsiteLeads.length} of {researchedCount} checked leads have no website ·{' '}
              {RESEARCH_CHECKED_ON}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Netqorix Prospects Command Center
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            {totalLeads.toLocaleString('en-IN')} prospects across {regionData.length} regions.
            Track calls, log follow-ups, and review each source before outreach.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigateToFilter({ tier: 'A' })}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>Call Tier A First ({tierA.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Leads & Tier Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Prospects</span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {totalLeads}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => onNavigateToFilter({ tier: 'A' })}
              className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 hover:scale-105 transition-transform"
            >
              Tier A: {tierA.length}
            </button>
            <button
              onClick={() => onNavigateToFilter({ tier: 'B' })}
              className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50 hover:scale-105 transition-transform"
            >
              Tier B: {tierB.length}
            </button>
            <button
              onClick={() => onNavigateToFilter({ tier: 'C' })}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:scale-105 transition-transform"
            >
              Tier C: {tierC.length}
            </button>
          </div>
        </div>

        {/* Total Pipeline Sum */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pipeline Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {formatINR(totalPipelineINR)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Lead: <strong>{formatINR(Math.round(totalPipelineINR / totalLeads))}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{totalLeads.toLocaleString('en-IN')} estimates</span>
          </div>
        </div>

        {/* Contact Readiness (Phone vs None) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-accent-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Phone Outreach Ready</span>
            <div className="p-2 rounded-xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400">
              <Phone className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {withPhone.length}
            <span className="text-sm font-normal text-slate-400 ml-1.5">
              ({Math.round((withPhone.length / totalLeads) * 100)}%)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateToFilter({ phoneFilter: 'has' })}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              ✓ {withPhone.length} Listed
            </button>
            <button
              onClick={() => onNavigateToFilter({ phoneFilter: 'none' })}
              className="text-slate-500 dark:text-slate-400 hover:underline font-semibold"
            >
              — {nonePhone.length} None Listed
            </button>
          </div>
        </div>

        {/* Website Gap (from the website research export) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">No Website Found</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {noWebsiteLeads.length}
            <span className="text-sm font-normal text-slate-400 ml-1.5">
              of {researchedCount} checked
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateToFilter({ websiteFilter: 'none-found' })}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              ✓ {formatINR(noWebsitePipelineINR)} open
            </button>
            <button
              onClick={() => onNavigateToFilter({ websiteFilter: 'has-website' })}
              className="text-slate-500 dark:text-slate-400 hover:underline font-semibold"
            >
              {hasWebsiteLeads.length} already online
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Checked {RESEARCH_CHECKED_ON} • {RESEARCH_TOTALS.withOtherLink} leads have only a
            third-party link
            {' • '}
            <button
              onClick={() => onNavigateToFilter({ websiteFilter: 'maps-no-button' })}
              className="hover:underline font-semibold"
            >
              {mapsNoButtonLeads.length} from newer Maps source lists
            </button>
            {notResearchedLeads.length > 0 && (
              <>
                {' • '}
                <button
                  onClick={() => onNavigateToFilter({ websiteFilter: 'not-researched' })}
                  className="hover:underline font-semibold"
                >
                  {notResearchedLeads.length} not researched
                </button>
              </>
            )}
          </div>
        </div>

        {/* Closed Won / Active Progress */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Deals Won / In Flight</span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 font-mono">
            {formatINR(wonValueINR)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span><strong>{wonLeads.length}</strong> Won</span>
            <span><strong>{inProgressLeads.length}</strong> In Outreach</span>
          </div>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Region Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Region Breakdown</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{regionData.length} Regions</span>
          </div>
          <div className="space-y-3">
            {regionData.map((item) => {
              const pct = Math.round((item.count / totalLeads) * 100);
              return (
                <div
                  key={item.name}
                  onClick={() => onNavigateToFilter({ region: item.name })}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {item.count} leads
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
                    <span>{formatINR(item.pipeline)}</span>
                    <span>{pct}% of list</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 dark:bg-brand-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Segment Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              <span>Segment Breakdown</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{segmentData.length} Segments</span>
          </div>
          <div className="space-y-3">
            {segmentData.map((item) => {
              const pct = Math.round((item.count / totalLeads) * 100);
              return (
                <div
                  key={item.name}
                  onClick={() => onNavigateToFilter({ segment: item.name })}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-accent-50/50 dark:hover:bg-accent-950/40 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {item.count} leads
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
                    <span>{formatINR(item.pipeline)}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Package Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Package Breakdown</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{packageData.length} Packages</span>
          </div>
          <div className="space-y-3">
            {packageData.map((item) => {
              const pct = Math.round((item.count / totalLeads) * 100);
              return (
                <div
                  key={item.name}
                  onClick={() => onNavigateToFilter({ package: item.name })}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {item.count} leads
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
                    <span>{formatINR(item.pipeline)}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Cities & Top Localities Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Top Cities</span>
            </h2>
            <span className="text-xs text-slate-400">Top 10 Cities</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cityData.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigateToFilter({ city: item.name })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                  {item.name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  <span>{item.count} leads</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatINR(item.pipeline)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top Localities Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              <span>Top Localities</span>
            </h2>
            <span className="text-xs text-slate-400">Top 10 Clusters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {localityData.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigateToFilter({ locality: item.name })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-accent-50/50 dark:hover:bg-accent-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-accent-600 dark:group-hover:text-accent-400 truncate">
                  {item.name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  <span>{item.count} leads</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatINR(item.pipeline)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
