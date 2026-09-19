export type TierType = 'A' | 'B' | 'C';

export interface Prospect {
  id: string; // Unique generated or composite key e.g. "reg-rank"
  region: string;
  rank: number;
  tier: TierType;
  fit: number; // Fit /100
  business: string;
  category: string;
  segment: string;
  locality: string;
  city: string;
  phone: string;
  rating: number;
  reviews: number;
  package: string;
  listPrice: string;
  dealValue: number; // Deal value in INR
  bestCallWindow: string; // e.g. "Tue-Thu 11:00-16:00"
  pitchAngle: string;
  intent: number;
  volume: number;
  ratingPts: number;
  reach: number;
  mapsUrl: string;
}

export type LeadStatus =
  | 'New'
  | 'Called'
  | 'No answer'
  | 'Interested'
  | 'Proposal sent'
  | 'Won'
  | 'Lost';

export interface LeadTracking {
  status: LeadStatus;
  notes: string;
  followUpDate: string; // YYYY-MM-DD or empty
  email: string; // editable email
  finalDealValue: number | null; // custom deal value if negotiated
  updatedAt: string;
}

export interface ValidationSummary {
  isValid: boolean;
  total: number;
  chandigarhTricity: number;
  hyderabad: number;
  miraRoadVasaiVirar: number;
  delhi: number;
  tierA: number;
  hasPhone: number;
  noneListedPhone: number;
  errors: string[];
}
