import type { Prospect, ValidationSummary } from '../types/prospect';
import { prospectsChandigarh } from './prospectsChandigarh';
import { prospectsHyderabad } from './prospectsHyderabad';
import { prospectsMiraRoad } from './prospectsMiraRoad';
import { APP_CONFIG } from '../config';

// All 913 prospects strictly merged in original order without truncation or omission
export const allProspects: Prospect[] = [
  ...prospectsChandigarh,
  ...prospectsHyderabad,
  ...prospectsMiraRoad
];

export function validateProspectsData(prospects: Prospect[] = allProspects): ValidationSummary {
  const errors: string[] = [];
  
  const total = prospects.length;
  const chandigarhCount = prospects.filter(p => p.region === 'Chandigarh Tricity').length;
  const hyderabadCount = prospects.filter(p => p.region === 'Hyderabad').length;
  const miraRoadCount = prospects.filter(p => p.region === 'Mira Road-Vasai-Virar').length;
  const tierACount = prospects.filter(p => p.tier === 'A').length;
  
  const nonePhoneListed = prospects.filter(
    p => !p.phone || p.phone.includes('none') || p.phone.includes('—') || p.phone === '-'
  ).length;
  const hasPhoneCount = total - nonePhoneListed;

  if (total !== APP_CONFIG.EXPECTED_TOTAL) {
    errors.push(`Total prospects count is ${total}, expected ${APP_CONFIG.EXPECTED_TOTAL}`);
  }
  if (chandigarhCount !== APP_CONFIG.EXPECTED_CHANDIGARH) {
    errors.push(`Chandigarh Tricity count is ${chandigarhCount}, expected ${APP_CONFIG.EXPECTED_CHANDIGARH}`);
  }
  if (hyderabadCount !== APP_CONFIG.EXPECTED_HYDERABAD) {
    errors.push(`Hyderabad count is ${hyderabadCount}, expected ${APP_CONFIG.EXPECTED_HYDERABAD}`);
  }
  if (miraRoadCount !== APP_CONFIG.EXPECTED_MIRA_ROAD) {
    errors.push(`Mira Road-Vasai-Virar count is ${miraRoadCount}, expected ${APP_CONFIG.EXPECTED_MIRA_ROAD}`);
  }
  if (tierACount !== APP_CONFIG.EXPECTED_TIER_A) {
    errors.push(`Tier A count is ${tierACount}, expected ${APP_CONFIG.EXPECTED_TIER_A}`);
  }

  return {
    isValid: errors.length === 0,
    total,
    chandigarhTricity: chandigarhCount,
    hyderabad: hyderabadCount,
    miraRoadVasaiVirar: miraRoadCount,
    tierA: tierACount,
    hasPhone: hasPhoneCount,
    noneListedPhone: nonePhoneListed,
    errors
  };
}
