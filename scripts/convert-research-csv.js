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

const csvPath = path.join(
  __dirname,
  '..',
  'Netqorix_Lead_Website_Research_2026-09-20.csv'
);
const rawContent = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
const allRows = parseCSV(rawContent);

// The export carries a title block above the real header row
const headerIndex = allRows.findIndex(r => r[0] === 'No.');
if (headerIndex === -1) throw new Error('Could not locate the "No." header row');
const header = allRows[headerIndex];
console.log('Detected Header Columns (' + header.length + '):', header);

const dataRows = allRows.slice(headerIndex + 1);
console.log('Total research rows:', dataRows.length);

if (dataRows.length !== 913) {
  throw new Error(`Expected exactly 913 research rows, got ${dataRows.length}`);
}

const records = dataRows.map(r => ({
  region: r[1] || '',
  rank: parseInt(r[2], 10) || 0,
  business: r[4] || '',
  status: r[8] || '',
  websiteUrl: r[9] || '',
  otherLinkType: r[10] || '',
  otherLinkUrl: r[11] || '',
  evidenceUrl: r[12] || '',
  match: r[13] || '',
  note: r[14] || '',
  mapsUrl: r[15] || ''
}));

// Region + rank is the join key back onto the prospect list
const keys = new Set();
records.forEach(rec => {
  const key = `${rec.region}|${rec.rank}`;
  if (keys.has(key)) throw new Error(`Duplicate research key: ${key}`);
  keys.add(key);
});

const byRegion = {};
records.forEach(rec => {
  byRegion[rec.region] = (byRegion[rec.region] || 0) + 1;
});
console.log('Research rows per region:', byRegion);

if (byRegion['Chandigarh Tricity'] !== 307) throw new Error('Chandigarh research count mismatch');
if (byRegion['Hyderabad'] !== 302) throw new Error('Hyderabad research count mismatch');
if (byRegion['Mira Road-Vasai-Virar'] !== 304) throw new Error('Mira Road research count mismatch');

const NO_WEBSITE_STATUS = 'No convincing website found';
const PARKED_STATUS = 'Parked domain';

function groupFor(rec) {
  if (rec.status === PARKED_STATUS) return 'parked';
  if (rec.websiteUrl) return 'has-website';
  return 'none-found';
}

// The two representations must agree, otherwise the filters would lie
records.forEach(rec => {
  const hasUrl = Boolean(rec.websiteUrl);
  const claimsNone = rec.status === NO_WEBSITE_STATUS;
  if (hasUrl === claimsNone) {
    throw new Error(
      `Status/URL mismatch for ${rec.region} #${rec.rank} (${rec.business}): "${rec.status}"`
    );
  }
});

const noneFound = records.filter(r => groupFor(r) === 'none-found').length;
const hasWebsite = records.filter(r => groupFor(r) === 'has-website').length;
const parked = records.filter(r => groupFor(r) === 'parked').length;
const withOtherLink = records.filter(r => Boolean(r.otherLinkUrl)).length;
console.log({ noneFound, hasWebsite, parked, withOtherLink });

if (noneFound !== 886) throw new Error(`No-website count mismatch: ${noneFound} != 886`);
if (hasWebsite !== 26) throw new Error(`Has-website count mismatch: ${hasWebsite} != 26`);
if (parked !== 1) throw new Error(`Parked count mismatch: ${parked} != 1`);

// Long strings repeat across hundreds of rows, so intern them into lookup tables
function intern(values) {
  const table = [];
  const index = new Map();
  values.forEach(v => {
    if (!index.has(v)) {
      index.set(v, table.length);
      table.push(v);
    }
  });
  return { table, index };
}

const statuses = intern(records.map(r => r.status));
const matches = intern(records.map(r => r.match));
const linkTypes = intern(records.map(r => r.otherLinkType));
const notes = intern(records.map(r => r.note));

const rows = records.map(rec => [
  `${rec.region}|${rec.rank}`,
  statuses.index.get(rec.status),
  matches.index.get(rec.match),
  linkTypes.index.get(rec.otherLinkType),
  notes.index.get(rec.note),
  rec.websiteUrl,
  rec.otherLinkUrl,
  rec.evidenceUrl,
  // Empty means "same as the evidence URL" — they match on most rows
  rec.mapsUrl === rec.evidenceUrl ? '' : rec.mapsUrl
]);

const outPath = path.join(__dirname, '..', 'src', 'data', 'websiteResearch.ts');

const content = `import type { WebsiteResearch, WebsiteGroup } from '../types/prospect';

// GENERATED by scripts/convert-research-csv.js from
// Netqorix_Lead_Website_Research_2026-09-20.csv — do not edit by hand.

export const RESEARCH_CHECKED_ON = '20 Sep 2026';

export const RESEARCH_DISCLAIMER =
  'No convincing website found means no supported match in these searches; it does not prove a website does not exist.';

const STATUSES: string[] = ${JSON.stringify(statuses.table, null, 2)};

const MATCHES: string[] = ${JSON.stringify(matches.table, null, 2)};

const LINK_TYPES: string[] = ${JSON.stringify(linkTypes.table, null, 2)};

const NOTES: string[] = ${JSON.stringify(notes.table, null, 2)};

// [key, statusIdx, matchIdx, linkTypeIdx, noteIdx, websiteUrl, otherLinkUrl, evidenceUrl, mapsUrl]
type RawRow = [string, number, number, number, number, string, string, string, string];

const ROWS: RawRow[] = ${JSON.stringify(rows)};

function groupFor(status: string, websiteUrl: string): WebsiteGroup {
  if (status === 'Parked domain') return 'parked';
  if (websiteUrl) return 'has-website';
  return 'none-found';
}

export const websiteResearchMap: Record<string, WebsiteResearch> = {};

for (const [key, s, m, l, n, websiteUrl, otherLinkUrl, evidenceUrl, mapsUrl] of ROWS) {
  const status = STATUSES[s];
  websiteResearchMap[key] = {
    status,
    match: MATCHES[m],
    otherLinkType: LINK_TYPES[l],
    note: NOTES[n],
    websiteUrl,
    otherLinkUrl,
    evidenceUrl,
    mapsUrl: mapsUrl || evidenceUrl,
    group: groupFor(status, websiteUrl)
  };
}

export const RESEARCH_TOTALS = {
  checked: ${records.length},
  noneFound: ${noneFound},
  hasWebsite: ${hasWebsite},
  parked: ${parked},
  withOtherLink: ${withOtherLink}
};

export const RESEARCHED_REGIONS: string[] = ${JSON.stringify(Object.keys(byRegion))};
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log(`Wrote src/data/websiteResearch.ts (${records.length} records)`);
