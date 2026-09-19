import type { Prospect, LeadTracking } from '../types/prospect';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // Always wrap in quotes and escape internal quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportProspectsToCsv(
  prospects: Prospect[],
  trackingMap: Record<string, LeadTracking>,
  filename: string = 'netqorix_prospects_export.csv'
) {
  const headers = [
    'Region',
    'Rank',
    'Tier',
    'Fit /100',
    'Business',
    'Category',
    'Segment',
    'Locality',
    'City',
    'Phone',
    'Rating',
    'Reviews',
    'Package',
    'List price',
    'Deal value (₹)',
    'Best call window (IST)',
    'Pitch angle',
    'Intent',
    'Volume',
    'Rating pts',
    'Reach',
    'Maps URL',
    // Sales Tracking columns
    'Status',
    'Captured Email',
    'Follow-up Date',
    'Final Deal Value (₹)',
    'Notes',
    'Last Updated'
  ];

  const rows = prospects.map((p) => {
    const t = trackingMap[p.id];
    return [
      escapeCsvCell(p.region),
      escapeCsvCell(p.rank),
      escapeCsvCell(p.tier),
      escapeCsvCell(p.fit),
      escapeCsvCell(p.business),
      escapeCsvCell(p.category),
      escapeCsvCell(p.segment),
      escapeCsvCell(p.locality),
      escapeCsvCell(p.city),
      escapeCsvCell(p.phone),
      escapeCsvCell(p.rating),
      escapeCsvCell(p.reviews),
      escapeCsvCell(p.package),
      escapeCsvCell(p.listPrice),
      escapeCsvCell(p.dealValue),
      escapeCsvCell(p.bestCallWindow),
      escapeCsvCell(p.pitchAngle),
      escapeCsvCell(p.intent),
      escapeCsvCell(p.volume),
      escapeCsvCell(p.ratingPts),
      escapeCsvCell(p.reach),
      escapeCsvCell(p.mapsUrl),
      // Tracking
      escapeCsvCell(t?.status || 'New'),
      escapeCsvCell(t?.email || ''),
      escapeCsvCell(t?.followUpDate || ''),
      escapeCsvCell(t?.finalDealValue ?? p.dealValue),
      escapeCsvCell(t?.notes || ''),
      escapeCsvCell(t?.updatedAt || '')
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
