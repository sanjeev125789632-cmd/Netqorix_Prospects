import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Phone,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Mail,
  DollarSign,
  FileText,
  UserCheck
} from 'lucide-react';
import type { Prospect, LeadStatus } from '../types/prospect';
import { useTracking } from '../context/TrackingContext';
import {
  formatINR,
  getTelUrl,
  getWhatsAppUrl,
  isPhoneAvailable
} from '../utils/formatters';
import { getISTDate } from '../utils/callWindow';

interface FollowUpsViewProps {
  prospects: Prospect[];
  onSelectLead: (lead: Prospect) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  prospects,
  onSelectLead
}) => {
  const { trackingMap, quickSetStatus } = useTracking();
  const [filterType, setFilterType] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');

  // Today's date string YYYY-MM-DD based on IST
  const todayStr = useMemo(() => {
    const d = getISTDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Filter prospects that have a followUpDate
  const allFollowUps = useMemo(() => {
    return prospects
      .map((p) => {
        const tracking = trackingMap[p.id];
        return {
          prospect: p,
          tracking,
          followUpDate: tracking?.followUpDate || ''
        };
      })
      .filter((item) => !!item.followUpDate)
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  }, [prospects, trackingMap]);

  // Bucketing
  const dueToday = allFollowUps.filter((item) => item.followUpDate === todayStr);
  const overdue = allFollowUps.filter((item) => item.followUpDate < todayStr);
  const upcoming = allFollowUps.filter((item) => item.followUpDate > todayStr);

  const displayedList = useMemo(() => {
    switch (filterType) {
      case 'today':
        return dueToday;
      case 'overdue':
        return overdue;
      case 'upcoming':
        return upcoming;
      case 'all':
      default:
        return allFollowUps;
    }
  }, [filterType, allFollowUps, dueToday, overdue, upcoming]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 border border-brand-400/30 text-brand-300 mb-2">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Follow-Up Scheduling & Task Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Follow-ups & Scheduled Cadence
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Never drop a warm lead. Scheduled follow-ups synced directly in your local sales workspace.
          </p>
        </div>

        {/* Quick Tabs */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setFilterType('today')}
            className={`p-3 rounded-xl text-left transition-all ${
              filterType === 'today'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Due Today</div>
            <div className="text-xl font-bold font-mono">{dueToday.length}</div>
          </button>

          <button
            onClick={() => setFilterType('overdue')}
            className={`p-3 rounded-xl text-left transition-all ${
              filterType === 'overdue'
                ? 'bg-rose-600 text-white font-bold shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Overdue</div>
            <div className="text-xl font-bold font-mono">{overdue.length}</div>
          </button>

          <button
            onClick={() => setFilterType('upcoming')}
            className={`p-3 rounded-xl text-left transition-all ${
              filterType === 'upcoming'
                ? 'bg-brand-500 text-white font-bold shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Upcoming</div>
            <div className="text-xl font-bold font-mono">{upcoming.length}</div>
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`p-3 rounded-xl text-left transition-all ${
              filterType === 'all'
                ? 'bg-slate-200 text-slate-900 font-bold shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">All Scheduled</div>
            <div className="text-xl font-bold font-mono">{allFollowUps.length}</div>
          </button>
        </div>
      </div>

      {/* Content */}
      {displayedList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CalendarClock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No follow-ups found in this view
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            To schedule a follow-up, click on any lead in the Prospects list or "Call First" page,
            pick a date in the Lead Detail drawer, and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedList.map(({ prospect, tracking, followUpDate }) => {
            const isToday = followUpDate === todayStr;
            const isOverdue = followUpDate < todayStr;
            const telUrl = getTelUrl(prospect.phone);
            const waUrl = getWhatsAppUrl(prospect.phone);

            return (
              <div
                key={prospect.id}
                onClick={() => onSelectLead(prospect)}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : isToday
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : isToday
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isOverdue ? 'Overdue: ' : isToday ? 'Due Today: ' : 'Follow-up: '}
                        {followUpDate}
                      </span>

                      <span className="text-xs px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold">
                        Tier {prospect.tier} • Fit {prospect.fit}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                      {prospect.business}
                    </h3>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {prospect.category} • {prospect.locality}, {prospect.city}
                    </div>

                    {/* Notes if available */}
                    {tracking?.notes && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">{tracking.notes}</span>
                      </div>
                    )}

                    {/* Email if captured */}
                    {tracking?.email && (
                      <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium">
                        <Mail className="w-3 h-3" />
                        <span>{tracking.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div
                    className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {prospect.phone}
                      </div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatINR(tracking?.finalDealValue ?? prospect.dealValue)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={tracking?.status || 'New'}
                        onChange={(e) =>
                          quickSetStatus(prospect.id, e.target.value as LeadStatus)
                        }
                        className="text-xs font-bold py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
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
                          onClick={() => quickSetStatus(prospect.id, 'Called')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
