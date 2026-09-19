import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Check
} from 'lucide-react';
import type { Prospect, LeadStatus, TierType } from '../types/prospect';
import { useTracking } from '../context/TrackingContext';
import {
  formatINR,
  getTelUrl,
  getWhatsAppUrl,
  isPhoneAvailable,
  truncate
} from '../utils/formatters';
import { evaluateCallWindow } from '../utils/callWindow';
import { Pagination } from './Pagination';
import { APP_CONFIG } from '../config';

interface ProspectsListViewProps {
  prospects: Prospect[];
  onSelectLead: (lead: Prospect) => void;
  initialFilters?: Partial<FilterState>;
}

export interface FilterState {
  search: string;
  region: string;
  city: string;
  locality: string;
  tier: string;
  segment: string;
  category: string;
  package: string;
  phoneFilter: string; // 'all' | 'has' | 'none'
  status: string; // 'all' | LeadStatus
  sortBy: 'fit' | 'rank' | 'rating' | 'reviews' | 'dealValue';
  sortOrder: 'asc' | 'desc';
}

export const ProspectsListView: React.FC<ProspectsListViewProps> = ({
  prospects,
  onSelectLead,
  initialFilters
}) => {
  const { trackingMap, quickSetStatus } = useTracking();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    region: 'all',
    city: 'all',
    locality: 'all',
    tier: 'all',
    segment: 'all',
    category: 'all',
    package: 'all',
    phoneFilter: 'all',
    status: 'all',
    sortBy: 'fit',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Derive unique options for filter dropdowns
  const filterOptions = useMemo(() => {
    const regions = Array.from(new Set(prospects.map((p) => p.region))).sort();
    
    // Dependent cities if region selected
    const filteredForCities =
      filters.region !== 'all'
        ? prospects.filter((p) => p.region === filters.region)
        : prospects;
    const cities = Array.from(new Set(filteredForCities.map((p) => p.city))).sort();

    // Dependent localities
    const filteredForLocalities =
      filters.city !== 'all'
        ? filteredForCities.filter((p) => p.city === filters.city)
        : filteredForCities;
    const localities = Array.from(
      new Set(filteredForLocalities.map((p) => p.locality))
    ).sort();

    const segments = Array.from(new Set(prospects.map((p) => p.segment))).sort();
    const categories = Array.from(new Set(prospects.map((p) => p.category))).sort();
    const packages = Array.from(new Set(prospects.map((p) => p.package))).sort();

    return { regions, cities, localities, segments, categories, packages };
  }, [prospects, filters.region, filters.city]);

  // Filter & Search Logic
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      // Global Search: business, category, locality, phone
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const b = p.business.toLowerCase();
        const c = p.category.toLowerCase();
        const l = p.locality.toLowerCase();
        const ph = p.phone.toLowerCase();
        const match =
          b.includes(query) ||
          c.includes(query) ||
          l.includes(query) ||
          ph.includes(query);
        if (!match) return false;
      }

      // Region
      if (filters.region !== 'all' && p.region !== filters.region) return false;

      // City
      if (filters.city !== 'all' && p.city !== filters.city) return false;

      // Locality
      if (filters.locality !== 'all' && p.locality !== filters.locality) return false;

      // Tier
      if (filters.tier !== 'all' && p.tier !== filters.tier) return false;

      // Segment
      if (filters.segment !== 'all' && p.segment !== filters.segment) return false;

      // Category
      if (filters.category !== 'all' && p.category !== filters.category) return false;

      // Package
      if (filters.package !== 'all' && p.package !== filters.package) return false;

      // Phone
      if (filters.phoneFilter === 'has' && !isPhoneAvailable(p.phone)) return false;
      if (filters.phoneFilter === 'none' && isPhoneAvailable(p.phone)) return false;

      // Tracking Status
      if (filters.status !== 'all') {
        const currentStatus = trackingMap[p.id]?.status || 'New';
        if (currentStatus !== filters.status) return false;
      }

      return true;
    });
  }, [prospects, filters, trackingMap]);

  // Sorting
  const sortedProspects = useMemo(() => {
    return [...filteredProspects].sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'fit':
          comparison = a.fit - b.fit;
          break;
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'reviews':
          comparison = a.reviews - b.reviews;
          break;
        case 'dealValue':
          comparison = a.dealValue - b.dealValue;
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredProspects, filters.sortBy, filters.sortOrder]);

  // Pagination (50 leads per page)
  const itemsPerPage = APP_CONFIG.ITEMS_PER_PAGE;
  const totalPages = Math.ceil(sortedProspects.length / itemsPerPage) || 1;
  const paginatedProspects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProspects.slice(start, start + itemsPerPage);
  }, [sortedProspects, currentPage, itemsPerPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.region !== 'all') count++;
    if (filters.city !== 'all') count++;
    if (filters.locality !== 'all') count++;
    if (filters.tier !== 'all') count++;
    if (filters.segment !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.package !== 'all') count++;
    if (filters.phoneFilter !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      search: '',
      region: 'all',
      city: 'all',
      locality: 'all',
      tier: 'all',
      segment: 'all',
      category: 'all',
      package: 'all',
      phoneFilter: 'all',
      status: 'all',
      sortBy: 'fit',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (status: LeadStatus) => {
    switch (status) {
      case 'Won':
        return 'bg-emerald-500 text-white';
      case 'Lost':
        return 'bg-rose-500 text-white';
      case 'Interested':
        return 'bg-cyan-500 text-white';
      case 'Proposal sent':
        return 'bg-brand-600 text-white';
      case 'Called':
        return 'bg-amber-500 text-white';
      case 'No answer':
        return 'bg-slate-500 text-white';
      case 'New':
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md p-3 sm:p-4 transition-all">
        {/* Row 1: Search, Layout switch, Mobile filter toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Global Search Bar */}
          <div className="relative w-full flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="Search business, category, locality, phone..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeFilterCount > 0
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-300 dark:border-brand-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })
                }
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="fit">Sort: Fit</option>
                <option value="rank">Sort: Rank</option>
                <option value="dealValue">Sort: Value</option>
                <option value="rating">Sort: Rating</option>
                <option value="reviews">Sort: Reviews</option>
              </select>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                  })
                }
                title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-mono font-bold"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* View Mode Switcher (Desktop) */}
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'table' || viewMode === 'auto'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Filter Selects (Collapsible or always visible on desktop) */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 mt-3 ${
            showFilterDrawer ? 'block' : 'hidden lg:grid'
          }`}
        >
          {/* Region */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  region: e.target.value,
                  city: 'all',
                  locality: 'all'
                });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Regions</option>
              {filterOptions.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => {
                setFilters({ ...filters, city: e.target.value, locality: 'all' });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Cities</option>
              {filterOptions.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Locality */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Locality
            </label>
            <select
              value={filters.locality}
              onChange={(e) => {
                setFilters({ ...filters, locality: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Localities</option>
              {filterOptions.localities.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Tier
            </label>
            <select
              value={filters.tier}
              onChange={(e) => {
                setFilters({ ...filters, tier: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Tiers</option>
              <option value="A">Tier A (High Fit)</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
            </select>
          </div>

          {/* Segment */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Segment
            </label>
            <select
              value={filters.segment}
              onChange={(e) => {
                setFilters({ ...filters, segment: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Segments</option>
              {filterOptions.segments.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Presence */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Has Phone
            </label>
            <select
              value={filters.phoneFilter}
              onChange={(e) => {
                setFilters({ ...filters, phoneFilter: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Leads</option>
              <option value="has">Has Phone Listed</option>
              <option value="none">None Listed</option>
            </select>
          </div>

          {/* Sales Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Called">Called</option>
              <option value="No answer">No answer</option>
              <option value="Interested">Interested</option>
              <option value="Proposal sent">Proposal sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Active Filter Pills and Reset */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <span className="text-slate-400 text-[11px]">Active:</span>
            {filters.region !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium">
                Region: {filters.region}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, region: 'all' })}
                />
              </span>
            )}
            {filters.city !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium">
                City: {filters.city}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, city: 'all' })}
                />
              </span>
            )}
            {filters.tier !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                Tier {filters.tier}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, tier: 'all' })}
                />
              </span>
            )}
            {filters.phoneFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                Phone: {filters.phoneFilter === 'has' ? 'Listed' : 'None'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, phoneFilter: 'all' })}
                />
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-medium">
                Status: {filters.status}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                />
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold ml-auto"
            >
              Reset All ({filteredProspects.length} matches)
            </button>
          </div>
        )}
      </div>

      {/* Main List Display: Card view on Mobile, Table on Desktop */}
      {paginatedProspects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No prospects match these filters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try resetting your search term or broadening your region, tier, or status filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-all cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* DESKTOP TABLE (Visible on md+ unless viewMode === 'cards') */}
          <div
            className={`${
              viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'
            } overflow-x-auto`}
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-3 w-16">Rank</th>
                  <th className="py-3 px-3">Business & Category</th>
                  <th className="py-3 px-3 w-20 text-center">Fit</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3 text-center">Reviews</th>
                  <th className="py-3 px-3">Value</th>
                  <th className="py-3 px-3">Call Window</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedProspects.map((lead) => {
                  const tracking = trackingMap[lead.id] || { status: 'New' };
                  const callWindow = evaluateCallWindow(lead.bestCallWindow, lead.segment);
                  const telUrl = getTelUrl(lead.phone);
                  const waUrl = getWhatsAppUrl(lead.phone);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Rank & Tier */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                              lead.tier === 'A'
                                ? 'bg-amber-500 text-slate-950'
                                : lead.tier === 'B'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {lead.tier}
                          </span>
                          <span className="font-mono text-slate-400 font-semibold">
                            #{lead.rank}
                          </span>
                        </div>
                      </td>

                      {/* Business */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate max-w-xs">
                          {lead.business}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {lead.category}
                        </div>
                      </td>

                      {/* Fit Score */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                            lead.fit >= 90
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : lead.fit >= 80
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {lead.fit}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[160px]">
                          {lead.locality}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {lead.city} • <span className="text-brand-600 dark:text-brand-400">{lead.region.split(' ')[0]}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        {isPhoneAvailable(lead.phone) ? (
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {lead.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            — none listed
                          </span>
                        )}
                      </td>

                      {/* Reviews / Rating */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {lead.rating}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {lead.reviews} rev
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatINR(lead.dealValue)}
                        </div>
                        <div className="text-[10px] text-slate-400">{lead.package}</div>
                      </td>

                      {/* Call Window */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${callWindow.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              callWindow.isCallNow ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{callWindow.statusText}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={tracking.status}
                          onChange={(e) =>
                            quickSetStatus(lead.id, e.target.value as LeadStatus)
                          }
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border-none focus:ring-1 focus:ring-brand-500 cursor-pointer ${getStatusBadgeColor(
                            tracking.status
                          )}`}
                        >
                          <option value="New">New</option>
                          <option value="Called">Called</option>
                          <option value="No answer">No answer</option>
                          <option value="Interested">Interested</option>
                          <option value="Proposal sent">Proposal</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {telUrl && (
                            <a
                              href={telUrl}
                              onClick={() => quickSetStatus(lead.id, 'Called')}
                              title="Direct Phone Call"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.mapsUrl && (
                            <a
                              href={lead.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Google Maps"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS (Visible on <md or if viewMode === 'cards') */}
          <div
            className={`${
              viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'
            } divide-y divide-slate-100 dark:divide-slate-800`}
          >
            {paginatedProspects.map((lead) => {
              const tracking = trackingMap[lead.id] || { status: 'New' };
              const callWindow = evaluateCallWindow(lead.bestCallWindow, lead.segment);
              const telUrl = getTelUrl(lead.phone);
              const waUrl = getWhatsAppUrl(lead.phone);

              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer space-y-3"
                >
                  {/* Card Header: Business, Tier badge, Fit */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                            lead.tier === 'A'
                              ? 'bg-amber-500 text-slate-950'
                              : lead.tier === 'B'
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {lead.tier}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {lead.business}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {lead.category} • {lead.locality}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        Fit {lead.fit}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        #{lead.rank}
                      </div>
                    </div>
                  </div>

                  {/* Pitch Angle Call Opener Preview */}
                  <div className="p-2.5 rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-900/40 text-xs italic text-slate-700 dark:text-slate-300">
                    "{truncate(lead.pitchAngle, 110)}"
                  </div>

                  {/* Metrics Row: Phone, Deal Value, Call Window */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      {isPhoneAvailable(lead.phone) ? (
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {lead.phone}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">— none listed</span>
                      )}
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatINR(lead.dealValue)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${callWindow.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            callWindow.isCallNow ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{callWindow.statusText}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {lead.bestCallWindow.split('(')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action & Status Bar */}
                  <div
                    className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={tracking.status}
                      onChange={(e) =>
                        quickSetStatus(lead.id, e.target.value as LeadStatus)
                      }
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border-none ${getStatusBadgeColor(
                        tracking.status
                      )}`}
                    >
                      <option value="New">New</option>
                      <option value="Called">Called</option>
                      <option value="No answer">No answer</option>
                      <option value="Interested">Interested</option>
                      <option value="Proposal sent">Proposal</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>

                    <div className="flex items-center gap-2">
                      {telUrl && (
                        <a
                          href={telUrl}
                          onClick={() => quickSetStatus(lead.id, 'Called')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
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
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {lead.mapsUrl && (
                        <a
                          href={lead.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedProspects.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}
    </div>
  );
};
