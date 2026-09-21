import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Clock,
  MapPin,
  Calendar,
  Mail,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Activity,
  Globe,
  Search,
  Link2,
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
import {
  getWebsiteResearch,
  getWebsiteGroup,
  WEBSITE_GROUP_BADGE,
  WEBSITE_GROUP_LABEL
} from '../utils/websiteResearch';
import { RESEARCH_CHECKED_ON, RESEARCH_DISCLAIMER } from '../data/websiteResearch';

interface LeadDetailModalProps {
  prospect: Prospect | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const ALL_STATUSES: LeadStatus[] = [
  'New',
  'Called',
  'No answer',
  'Interested',
  'Proposal sent',
  'Won',
  'Lost'
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  prospect,
  onClose,
  onNavigate,
  hasPrev,
  hasNext
}) => {
  if (!prospect) return null;

  const { getTracking, updateTracking } = useTracking();
  const tracking = getTracking(prospect.id);

  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Tracking form states
  const [status, setStatus] = useState<LeadStatus>(tracking.status);
  const [email, setEmail] = useState(tracking.email);
  const [followUpDate, setFollowUpDate] = useState(tracking.followUpDate);
  const [notes, setNotes] = useState(tracking.notes);
  const [finalDealValue, setFinalDealValue] = useState<string>(
    tracking.finalDealValue !== null && tracking.finalDealValue !== undefined
      ? String(tracking.finalDealValue)
      : String(prospect.dealValue)
  );

  // Sync state when active prospect changes
  useEffect(() => {
    const t = getTracking(prospect.id);
    setStatus(t.status);
    setEmail(t.email);
    setFollowUpDate(t.followUpDate);
    setNotes(t.notes);
    setFinalDealValue(
      t.finalDealValue !== null && t.finalDealValue !== undefined
        ? String(t.finalDealValue)
        : String(prospect.dealValue)
    );
  }, [prospect.id, trackingMapKey(tracking)]);

  function trackingMapKey(t: any) {
    return `${t.status}_${t.email}_${t.followUpDate}_${t.notes}_${t.finalDealValue}`;
  }

  const handleSave = (fieldUpdates: Partial<typeof tracking>) => {
    updateTracking(prospect.id, fieldUpdates);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(prospect.pitchAngle);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleCopyPhone = () => {
    if (isPhoneAvailable(prospect.phone)) {
      navigator.clipboard.writeText(prospect.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const callWindowInfo = evaluateCallWindow(prospect.bestCallWindow, prospect.segment);
  const research = getWebsiteResearch(prospect);
  const websiteGroup = getWebsiteGroup(prospect);
  const telUrl = getTelUrl(prospect.phone);
  const waUrl = getWhatsAppUrl(prospect.phone);

  const getTierBadge = (t: string) => {
    if (t === 'A')
      return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40';
    if (t === 'B')
      return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40';
    return 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Sticky Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border ${getTierBadge(
                prospect.tier
              )}`}
            >
              {prospect.tier}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  {prospect.business}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 shrink-0">
                  Fit {prospect.fit}/100
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                <span>{prospect.category}</span>
                <span>•</span>
                <span>{prospect.locality}, {prospect.city}</span>
                <span>•</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">{prospect.region}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('prev')}
                  disabled={!hasPrev}
                  title="Previous Lead (Up Arrow)"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('next')}
                  disabled={!hasNext}
                  title="Next Lead (Down Arrow)"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Action Row: Call / WhatsApp / Maps */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contact:</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {prospect.phone}
              </span>
              {isPhoneAvailable(prospect.phone) && (
                <button
                  onClick={handleCopyPhone}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Copy Phone Number"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {telUrl ? (
                <a
                  href={telUrl}
                  onClick={() => {
                    handleSave({ status: 'Called' });
                    setStatus('Called');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed">
                  No Phone Listed
                </span>
              )}

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (status === 'New') {
                      handleSave({ status: 'Called' });
                      setStatus('Called');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              {prospect.mapsUrl && (
                <a
                  href={prospect.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Prominent Pitch Angle Card (Call Opener) */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-slate-900 border-2 border-brand-300/80 dark:border-brand-800/80 shadow-md shadow-brand-500/5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-extrabold text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Recommended Pitch Angle (Call Opener)</span>
              </div>
              <button
                onClick={handleCopyPitch}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-sm hover:bg-brand-50 dark:hover:bg-brand-900/40 flex items-center gap-1.5 transition-all"
              >
                {copiedPitch ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Opener</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed italic bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-brand-200/60 dark:border-brand-900/60">
              "{prospect.pitchAngle}"
            </p>
          </div>

          {/* Website Research Findings (20 Sep 2026 export) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-500" />
                <span>Website Research</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${WEBSITE_GROUP_BADGE[websiteGroup]}`}
              >
                {research ? research.status : WEBSITE_GROUP_LABEL[websiteGroup]}
              </span>
            </div>

            {research ? (
              <>
                {research.websiteUrl && (
                  <a
                    href={research.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{research.websiteUrl}</span>
                  </a>
                )}

                {research.otherLinkUrl && (
                  <a
                    href={research.otherLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:underline break-all"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>
                      <strong>{research.otherLinkType || 'Other link'}:</strong>{' '}
                      {research.otherLinkUrl}
                    </span>
                  </a>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {research.note}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Match: <strong className="text-slate-700 dark:text-slate-200">{research.match}</strong>
                  </span>
                  <span>
                    Checked: <strong className="text-slate-700 dark:text-slate-200">{RESEARCH_CHECKED_ON}</strong>
                  </span>
                  {research.evidenceUrl && (
                    <a
                      href={research.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                    >
                      <Search className="w-3 h-3" />
                      <span>Evidence</span>
                    </a>
                  )}
                </div>

                {websiteGroup === 'none-found' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    {RESEARCH_DISCLAIMER}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This region was not part of the {RESEARCH_CHECKED_ON} website research export, so no
                website check has been recorded for this lead.
              </p>
            )}
          </div>

          {/* Best Call Window Card with Live Status Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                  <span>Best Call Window (IST)</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {prospect.bestCallWindow}
                </div>
              </div>

              <div className="flex flex-col sm:items-end">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${callWindowInfo.badgeClass}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callWindowInfo.isCallNow ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span>{callWindowInfo.statusText}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {callWindowInfo.reason} ({callWindowInfo.istTimeString})
                </span>
              </div>
            </div>
          </div>

          {/* Sales Tracking & Lead State Box */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Sales Outreach & Tracking</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Pipeline Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as LeadStatus;
                    setStatus(newStatus);
                    handleSave({ status: newStatus });
                  }}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Editable Captured Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>Captured Email</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleSave({ email: e.target.value });
                  }}
                  placeholder="e.g. contact@business.com"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Follow-up Date</span>
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => {
                    setFollowUpDate(e.target.value);
                    handleSave({ followUpDate: e.target.value });
                  }}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Negotiated / Final Deal Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-slate-400" />
                  <span>Final Deal Value (₹)</span>
                </label>
                <input
                  type="number"
                  value={finalDealValue}
                  onChange={(e) => {
                    setFinalDealValue(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    handleSave({ finalDealValue: isNaN(parsed) ? null : parsed });
                  }}
                  placeholder="e.g. 120000"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Notes textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Sales Notes & Meeting Feedback</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  handleSave({ notes: e.target.value });
                }}
                rows={3}
                placeholder="Log call outcome, decision maker name, objections, or next steps..."
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* All 22 Raw CSV Fields Grid */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <span>Comprehensive Data Profile</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rank</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">#{prospect.rank}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tier</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Tier {prospect.tier}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Fit Score</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.fit} / 100</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Package</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.package}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">List Price</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.listPrice}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Deal Value</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {formatINR(prospect.dealValue)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Google Rating</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{prospect.rating}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Reviews Count</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.reviews} reviews</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Intent Score</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.intent}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.volume}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rating Pts</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.ratingPts}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Reach Pts</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{prospect.reach}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
