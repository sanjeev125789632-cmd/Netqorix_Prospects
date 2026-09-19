import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let inQuotes = false;
  let val = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        val += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(val);
      val = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(val);
      val = '';
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
    } else {
      val += c;
    }
  }
  if (val || row.length > 0) {
    row.push(val);
    if (row.some(x => x.trim())) rows.push(row);
  }
  return rows;
}

const csvPath = path.join(__dirname, '..', 'Netqorix_All_Prospects_913.csv');
const rawContent = fs.readFileSync(csvPath, 'utf8');
const allRows = parseCSV(rawContent);

const header = allRows[0];
console.log('Detected Header Columns (' + header.length + '):', header);

const dataRows = allRows.slice(1);
console.log('Total data rows:', dataRows.length);

if (dataRows.length !== 913) {
  throw new Error(`Expected exactly 913 data rows, got ${dataRows.length}`);
}

const prospects = dataRows.map((r, idx) => {
  return {
    id: `lead-${idx + 1}`,
    region: r[0] || '',
    rank: parseInt(r[1], 10) || 0,
    tier: r[2] || '',
    fit: parseInt(r[3], 10) || 0,
    business: r[4] || '',
    category: r[5] || '',
    segment: r[6] || '',
    locality: r[7] || '',
    city: r[8] || '',
    phone: r[9] || '— none listed',
    rating: parseFloat(r[10]) || 0,
    reviews: parseInt(r[11], 10) || 0,
    package: r[12] || '',
    listPrice: r[13] || '',
    dealValue: parseFloat(String(r[14]).replace(/[^0-9.]/g, '')) || 0,
    bestCallWindow: r[15] || '',
    pitchAngle: r[16] || '',
    intent: parseInt(r[17], 10) || 0,
    volume: parseInt(r[18], 10) || 0,
    ratingPts: parseInt(r[19], 10) || 0,
    reach: parseInt(r[20], 10) || 0,
    mapsUrl: r[21] || ''
  };
});

// Group by region
const chandigarh = prospects.filter(p => p.region === 'Chandigarh Tricity');
const hyderabad = prospects.filter(p => p.region === 'Hyderabad');
const miraRoad = prospects.filter(p => p.region === 'Mira Road-Vasai-Virar');

console.log('Chandigarh count:', chandigarh.length);
console.log('Hyderabad count:', hyderabad.length);
console.log('Mira Road count:', miraRoad.length);

const tierACount = prospects.filter(p => p.tier === 'A').length;
console.log('Tier A count:', tierACount);

// Assertions
if (chandigarh.length !== 307) throw new Error(`Chandigarh count mismatch: ${chandigarh.length} != 307`);
if (hyderabad.length !== 302) throw new Error(`Hyderabad count mismatch: ${hyderabad.length} != 302`);
if (miraRoad.length !== 304) throw new Error(`Mira Road count mismatch: ${miraRoad.length} != 304`);
if (tierACount !== 189) throw new Error(`Tier A count mismatch: ${tierACount} != 189`);

const outDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function writeRegionFile(filename, varName, data) {
  const content = `import type { Prospect } from '../types/prospect';\n\nexport const ${varName}: Prospect[] = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
  console.log(`Wrote ${filename} (${data.length} records)`);
}

writeRegionFile('prospectsChandigarh.ts', 'prospectsChandigarh', chandigarh);
writeRegionFile('prospectsHyderabad.ts', 'prospectsHyderabad', hyderabad);
writeRegionFile('prospectsMiraRoad.ts', 'prospectsMiraRoad', miraRoad);

// Write prospects.ts which merges them and includes the validation logic
const aggregatorContent = `import type { Prospect, ValidationSummary } from '../types/prospect';
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
    errors.push(\`Total prospects count is \${total}, expected \${APP_CONFIG.EXPECTED_TOTAL}\`);
  }
  if (chandigarhCount !== APP_CONFIG.EXPECTED_CHANDIGARH) {
    errors.push(\`Chandigarh Tricity count is \${chandigarhCount}, expected \${APP_CONFIG.EXPECTED_CHANDIGARH}\`);
  }
  if (hyderabadCount !== APP_CONFIG.EXPECTED_HYDERABAD) {
    errors.push(\`Hyderabad count is \${hyderabadCount}, expected \${APP_CONFIG.EXPECTED_HYDERABAD}\`);
  }
  if (miraRoadCount !== APP_CONFIG.EXPECTED_MIRA_ROAD) {
    errors.push(\`Mira Road-Vasai-Virar count is \${miraRoadCount}, expected \${APP_CONFIG.EXPECTED_MIRA_ROAD}\`);
  }
  if (tierACount !== APP_CONFIG.EXPECTED_TIER_A) {
    errors.push(\`Tier A count is \${tierACount}, expected \${APP_CONFIG.EXPECTED_TIER_A}\`);
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
`;

fs.writeFileSync(path.join(outDir, 'prospects.ts'), aggregatorContent, 'utf8');
console.log('Wrote prospects.ts with validation engine');
console.log('All data files successfully generated!');
