export type LanguageCode = 'auto' | 'en' | 'sw' | 'sheng';

export type DetectedLanguageLabel = 'English' | 'Kiswahili' | 'Sheng';

export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Routine';

export type ReportStatus = 'Received' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Feedback';

export type CitizenSentiment = 'Frustrated' | 'Distressed' | 'Angry' | 'Urgent' | 'Neutral' | 'Constructive';

export type TensionLevel = 'High' | 'Elevated' | 'Standard';

export interface SentimentAnalysis {
  sentiment: CitizenSentiment;
  tensionLevel: TensionLevel;
  frustrationScore: number; // 0 to 100
  isHighTension: boolean;
  tensionFactors: string[];
  tensionNotes?: string;
}

export interface AIClassification {
  category: string;
  urgency: PriorityLevel;
  recommendedTeam: string;
  rationale: string;
  estimatedSLA: string;
  confidenceScore?: number;
  sentiment?: CitizenSentiment;
  tensionLevel?: TensionLevel;
  frustrationScore?: number;
  isHighTension?: boolean;
  tensionFactors?: string[];
  tensionNotes?: string;
}

export type InflowChannel =
  | 'Call Center CRM'
  | 'WhatsApp'
  | 'Twitter (X)'
  | 'LinkedIn'
  | 'Instagram'
  | 'Email'
  | 'Web Voice Portal'
  | 'Zuri'
  | 'One App'
  | 'USSD';

export type OperationalCategory =
  | 'Network Outage'
  | 'Slow Internet'
  | 'Voice Calls'
  | 'M-PESA'
  | 'Fibre'
  | 'Billing'
  | 'Coverage';

export interface SubmissionRecord {
  id: string;
  referenceCode: string;
  text: string;
  detectedLanguage: DetectedLanguageLabel;
  englishTranslation?: string;
  category: string;
  countyOrWard: string;
  contactInfo?: string;
  captureMethod: 'voice' | 'text' | 'hybrid' | 'image';
  attachedImages?: string[];
  imageAnalysis?: string;
  aiCommitmentResponse: string;
  status: ReportStatus;
  createdAt: string;
  assignedTeam?: string;
  assignedOfficer?: string;
  assignedOfficerEmail?: string;
  priority?: PriorityLevel;
  aiClassification?: AIClassification;
  adminNotes?: string;
  resolvedAt?: string;
  emailAlertSent?: boolean;
  emailAlertRecipient?: string;
  emailAlertSentAt?: string;
  emailAlertSubject?: string;
  emailAlertBody?: string;
  // Multi-Channel Feed, Categorization & Location
  channel?: InflowChannel;
  operationalCategory?: OperationalCategory;
  locationTown?: string;
  handle?: string;
  latitude?: number;
  longitude?: number;
  source?: 'synced' | 'live';
  isSyncedFeed?: boolean;
  // AI Resolution Insights
  aiResolutionSteps?: string[];
  aiRootCause?: string;
  // Smart Triage & Linking
  intent?: 'Complaint' | 'Enquiry' | 'Compliment' | 'Spam';
  issueGroupId?: string;
  issueGroupTitle?: string;
  issueGroupCause?: string;
  thankYouReply?: string;
  selfHelpSteps?: string[];
  confidence?: number;
  proposedTeam?: { name: string; code: string; scope: string };
  // Sentiment Analysis & High Tension Flagging
  sentiment?: CitizenSentiment;
  tensionLevel?: TensionLevel;
  frustrationScore?: number;
  isHighTension?: boolean;
  tensionFactors?: string[];
  tensionNotes?: string;
  // Automatic Dispatch & SLA Tracking
  needsReview?: boolean;
  slaStartedAt?: string;
}

export interface EmailDispatchLog {
  id: string;
  submissionId: string;
  referenceCode: string;
  toEmail: string;
  officerName: string;
  teamName: string;
  category: string;
  priority: PriorityLevel;
  subject: string;
  body: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Simulated';
}

export interface ResponseTeam {
  id: string;
  name: string;
  shortCode: string;
  department: string;
  leadOfficer: string;
  email: string;
  phone: string;
  activeCount: number;
  color: 'emerald' | 'sky' | 'amber' | 'rose' | 'teal' | 'lime' | 'indigo';
  isAiSuggested?: boolean;
  scope?: string;
}

export const KENYAN_RESPONSE_TEAMS: ResponseTeam[] = [
  {
    id: 'team-fibre',
    name: 'Safaricom Home Fibre & Enterprise NOC',
    shortCode: 'SAF-FIBRE',
    department: 'Home Fibre & Fixed Internet',
    leadOfficer: 'Eng. Dennis Kiprono',
    email: 'dennis.kiprono@safaricom.co.ke',
    phone: '400 / 0722 002 400',
    activeCount: 14,
    color: 'emerald',
  },
  {
    id: 'team-mpesa',
    name: 'M-PESA Escalations & Reversals Operations',
    shortCode: 'MPESA-OPS',
    department: 'M-PESA & Financial Services',
    leadOfficer: 'Officer Grace Mwangi',
    email: 'grace.mwangi@safaricom.co.ke',
    phone: '234 / 0722 002 234',
    activeCount: 18,
    color: 'sky',
  },
  {
    id: 'team-ran',
    name: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
    shortCode: 'SAF-RAN',
    department: 'Mobile Network & 4G/5G Coverage',
    leadOfficer: 'Supervisor Brian Otieno',
    email: 'brian.otieno@safaricom.co.ke',
    phone: '100 / 0722 002 100',
    activeCount: 12,
    color: 'amber',
  },
  {
    id: 'team-fraud',
    name: 'SIM Swap, Identity Protection & Cyber-Fraud Unit',
    shortCode: 'SAF-FRAUD',
    department: 'SIM Swap, Fraud & Security',
    leadOfficer: 'Insp. Hassan Ali',
    email: 'hassan.ali@safaricom.co.ke',
    phone: '333 / 0722 000 333',
    activeCount: 9,
    color: 'rose',
  },
  {
    id: 'team-care',
    name: 'Customer Experience & Airtime Billing Desk',
    shortCode: 'SAF-CARE',
    department: 'Customer Care & Airtime Billing',
    leadOfficer: 'Coordinator Agnes Muthoni',
    email: 'agnes.muthoni@safaricom.co.ke',
    phone: '200 / 0722 002 200',
    activeCount: 7,
    color: 'indigo',
  },
  {
    id: 'team-ent',
    name: 'Enterprise Business Solutions & Cloud Desk',
    shortCode: 'SAF-ENT',
    department: 'Enterprise & Cloud Solutions',
    leadOfficer: 'Dr. Faith Wanjiku',
    email: 'faith.wanjiku@safaricom.co.ke',
    phone: '0722 002 222',
    activeCount: 6,
    color: 'teal',
  },
  {
    id: 'team-merch',
    name: 'Lipa Na M-PESA & Merchant Services Desk',
    shortCode: 'SAF-MERCH',
    department: 'Lipa Na M-PESA & Merchant Services',
    leadOfficer: 'Lead John Kimani',
    email: 'john.kimani@safaricom.co.ke',
    phone: '0722 000 000',
    activeCount: 8,
    color: 'lime',
  },
];

export interface TypewriterPhrase {
  langCode: 'en' | 'sw' | 'sheng';
  langLabel: DetectedLanguageLabel;
  regionNote: string;
  headline: string;
  placeholder: string;
  ctaLabel: string;
}
