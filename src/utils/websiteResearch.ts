import type { Prospect, WebsiteGroup, WebsiteResearch } from '../types/prospect';
import { websiteResearchMap, RESEARCHED_REGIONS } from '../data/websiteResearch';

/** The research export is joined back onto the lead list on region + rank. */
export function researchKey(prospect: Prospect): string {
  return `${prospect.region}|${prospect.rank}`;
}

export function getWebsiteResearch(prospect: Prospect): WebsiteResearch | undefined {
  return websiteResearchMap[researchKey(prospect)];
}

export function getWebsiteGroup(prospect: Prospect): WebsiteGroup {
  return getWebsiteResearch(prospect)?.group || 'not-researched';
}

export function isRegionResearched(region: string): boolean {
  return RESEARCHED_REGIONS.includes(region);
}

export const WEBSITE_GROUP_LABEL: Record<WebsiteGroup, string> = {
  'none-found': 'No website found',
  'has-website': 'Has website',
  parked: 'Parked domain',
  'not-researched': 'Not researched'
};

/** Short label for the dense table/card badges. */
export const WEBSITE_GROUP_SHORT: Record<WebsiteGroup, string> = {
  'none-found': 'No site',
  'has-website': 'Has site',
  parked: 'Parked',
  'not-researched': 'Unchecked'
};

export const WEBSITE_GROUP_BADGE: Record<WebsiteGroup, string> = {
  // No website found is the strongest pitch signal, so it reads as the positive one
  'none-found':
    'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-800',
  'has-website':
    'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300/70 dark:border-rose-800',
  parked:
    'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/70 dark:border-amber-800',
  'not-researched':
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300/70 dark:border-slate-700'
};

/** Matches the ProspectsListView websiteFilter values against a lead. */
export function matchesWebsiteFilter(prospect: Prospect, filter: string): boolean {
  if (filter === 'all') return true;
  const research = getWebsiteResearch(prospect);
  if (filter === 'other-link') return Boolean(research?.otherLinkUrl);
  return (research?.group || 'not-researched') === filter;
}
