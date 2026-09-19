import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  Sparkles,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import type { Prospect, LeadStatus } from '../types/prospect';
import { useTracking } from '../context/TrackingContext';
import {
  formatINR,
  getTelUrl,
  getWhatsAppUrl,
  isPhoneAvailable
} from '../utils/formatters';
import { evaluateCallWindow } from '../utils/callWindow';
import { Pagination } from './Pagination';
import { APP_CONFIG } from '../config';

interface CallFirstViewProps {
  prospects: Prospect[];
  onSelectLead: (lead: Prospect) => void;
}

export const CallFirstView: React.FC<CallFirstViewProps> = ({
  prospects,
  onSelectLead
}) => {
  const { trackingMap, quickSetStatus } = useTracking();

  const [search, setSearch] = useState('');
  const [onlyInWindow, setOnlyInWindow] = useState(false);
  const [onlyWithPhone, setOnlyWithPhone] = useState(true);
  const [regionFilter, setRegionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Strictly filter for Tier A leads only, sorted by Fit descending
  const tierALeads = useMemo(() => {
    return prospects
      .filter((p) => p.tier === 'A')
      .sort((a, b) => b.fit - a.fit || a.rank - b.rank);
  }, [prospects]);

  // Secondary interactive filters inside Tier A
  const filteredTierALeads = useMemo(() => {
    return tierALeads.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          p.business.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.phone.includes(q);
        if (!match) return false;
      }

      if (regionFilter !== 'all' && p.region !== regionFilter) return false;
      if (onlyWithPhone && !isPhoneAvailable(p.phone)) return false;

      if (onlyInWindow) {
        const cw = evaluateCallWindow(p.bestCallWindow, p.segment);
        if (!cw.isCallNow) return false;
      }

      return true;
    });
  }, [tierALeads, search, regionFilter, onlyWithPhone, onlyInWindow]);

  // Pagination (50 leads per page)
  const itemsPerPage = APP_CONFIG.ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredTierALeads.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTierALeads.slice(start, start + itemsPerPage);
  }, [filteredTierALeads, currentPage, itemsPerPage]);

  // Tier A Statistics
  const totalTierACount = tierALeads.length;
  const inWindowCount = tierALeads.filter(
    (p) => evaluateCallWindow(p.bestCallWindow, p.segment).isCallNow
  ).length;
  const phoneReadyCount = tierALeads.filter((p) => isPhoneAvailable(p.phone)).length;
  const calledCount = tierALeads.filter((p) => {
    const s = trackingMap[p.id]?.status;
    return s && s !== 'New';
  }).length;

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 border border-amber-300/30 text-amber-200 mb-2">
            <Award className="w-4 h-4" />
            <span>Priority Queue • Tier A Accounts ({totalTierACount} Leads)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tier A "Call First" Workspace
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-2xl">
            Highest-intent business prospects sorted strictly by Fit Score descending.
            Review the tailored pitch angle and connect via one-tap phone call or WhatsApp.
          </p>
        </div>

        {/* Quick KPI badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-amber-200">Total Tier A</div>
            <div className="text-xl font-bold font-mono">{totalTierACount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-amber-200">With Phone</div>
            <div className="text-xl font-bold font-mono">{phoneReadyCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-amber-200">Live "Call Now"</div>
            <div className="text-xl font-bold font-mono text-emerald-300">{inWindowCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-amber-200">Outreach Logged</div>
            <div className="text-xl font-bold font-mono text-cyan-300">{calledCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Quick Toggle Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Tier A leads..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Region filter */}
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border-none cursor-pointer"
          >
            <option value="all">All Regions</option>
            <option value="Chandigarh Tricity">Chandigarh Tricity</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Mira Road-Vasai-Virar">Mira Road-Vasai-Virar</option>
          </select>

          {/* Only in Window toggle */}
          <button
            onClick={() => {
              setOnlyInWindow(!onlyInWindow);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyInWindow
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Call Now Only ({inWindowCount})</span>
          </button>

          {/* Only with Phone */}
          <button
            onClick={() => {
              setOnlyWithPhone(!onlyWithPhone);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              onlyWithPhone
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Has Phone</span>
          </button>
        </div>
      </div>

      {/* Cards Stream */}
      {paginated.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Tier A leads match this criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try turning off the "Call Now Only" filter or clearing the search.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((lead) => {
            const tracking = trackingMap[lead.id] || { status: 'New' };
            const callWindow = evaluateCallWindow(lead.bestCallWindow, lead.segment);
            const telUrl = getTelUrl(lead.phone);
            const waUrl = getWhatsAppUrl(lead.phone);

            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/40 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                        A
                      </span>
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {lead.business}
                      </h3>
                      <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60">
                        Fit {lead.fit}/100
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        #{lead.rank}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead.category}
                      </span>
                      <span>•</span>
                      <span>{lead.locality}, {lead.city}</span>
                      <span>•</span>
                      <span className="text-brand-600 dark:text-brand-400 font-semibold">{lead.region}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <strong>{lead.rating}</strong> ({lead.reviews} rev)
                      </span>
                    </div>

                    {/* Prominent Pitch Angle */}
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>"{lead.pitchAngle}"</span>
                    </div>
                  </div>

                  {/* Right Action Stack */}
                  <div
                    className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Deal Value & Live Window Badge */}
                    <div className="flex items-center lg:flex-col lg:items-end gap-2">
                      <div className="font-extrabold font-mono text-base text-emerald-600 dark:text-emerald-400">
                        {formatINR(lead.dealValue)}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${callWindow.badgeClass}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            callWindow.isCallNow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{callWindow.statusText}</span>
                      </span>
                    </div>

                    {/* Phone number display */}
                    <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {lead.phone}
                    </div>

                    {/* Quick Call & Status Controls */}
                    <div className="flex items-center gap-2">
                      <select
                        value={tracking.status}
                        onChange={(e) =>
                          quickSetStatus(lead.id, e.target.value as LeadStatus)
                        }
                        className="text-xs font-bold py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        <option value="New">New</option>
                        <option value="Called">Called</option>
                        <option value="No answer">No answer</option>
                        <option value="Interested">Interested</option>
                        <option value="Proposal sent">Proposal</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>

                      {telUrl && (
                        <a
                          href={telUrl}
                          onClick={() => quickSetStatus(lead.id, 'Called')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTierALeads.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}
    </div>
  );
};
