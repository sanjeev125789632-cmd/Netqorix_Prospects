import type { Prospect, ValidationSummary } from '../types/prospect';
import { prospectsChandigarh } from './prospectsChandigarh';
import { prospectsHyderabad } from './prospectsHyderabad';
import { prospectsMiraRoad } from './prospectsMiraRoad';
import { prospectsDelhi } from './prospectsDelhi';
import { prospectsAdditional } from './prospectsAdditional';
import { APP_CONFIG } from '../config';

// Preserve original order and IDs for existing local tracking; append the five new batches.
export const allProspects: Prospect[] = [
  ...prospectsChandigarh,
  ...prospectsHyderabad,
  ...prospectsMiraRoad,
  ...prospectsDelhi,
  ...prospectsAdditional
];

export function validateProspectsData(prospects: Prospect[] = allProspects): ValidationSummary {
  const errors: string[] = [];
  
  const total = prospects.length;
  const regionCounts: Record<string, number> = {};
  for (const p of prospects) regionCounts[p.region] = (regionCounts[p.region] || 0) + 1;
  const tierACount = prospects.filter(p => p.tier === 'A').length;
  const ids = prospects.map(p => p.id);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate lead IDs found');
  
  const nonePhoneListed = prospects.filter(
    p => !p.phone || p.phone.includes('none') || p.phone.includes('—') || p.phone === '-'
  ).length;
  const hasPhoneCount = total - nonePhoneListed;

  if (total !== APP_CONFIG.EXPECTED_TOTAL) {
    errors.push(`Total prospects count is ${total}, expected ${APP_CONFIG.EXPECTED_TOTAL}`);
  }
  for (const [region, expected] of Object.entries(APP_CONFIG.EXPECTED_COUNTS)) {
    if (regionCounts[region] !== expected) {
      errors.push(`${region} count is ${regionCounts[region] || 0}, expected ${expected}`);
    }
  }
  for (const region of Object.keys(regionCounts)) {
    if (!(region in APP_CONFIG.EXPECTED_COUNTS)) errors.push(`Unexpected region: ${region}`);
  }

  return {
    isValid: errors.length === 0,
    total,
    regionCounts,
    expectedCounts: APP_CONFIG.EXPECTED_COUNTS,
    tierA: tierACount,
    hasPhone: hasPhoneCount,
    noneListedPhone: nonePhoneListed,
    errors
  };
}
