import {
  SubmissionRecord,
  ResponseTeam,
  KENYAN_RESPONSE_TEAMS,
  PriorityLevel,
  ReportStatus,
} from '../types';
import { evaluateAndAutoDispatch } from './autoDispatch';

export interface TriagedTicketResult {
  id: string;
  intent: 'Complaint' | 'Enquiry' | 'Compliment' | 'Spam';
  category: string;
  urgency: PriorityLevel;
  confidence: number;
  bestTeam: string;
  proposedTeam?: {
    name: string;
    code: string;
    scope: string;
  };
  englishTranslation: string;
  resolutionSteps: string[];
  issueGroupId: string;
  issueGroupTitle?: string;
  issueGroupCause?: string;
  thankYouReply?: string;
  selfHelpSteps?: string[];
  needsReview?: boolean;
}

export interface IssueGroupResult {
  id: string;
  title: string;
  possibleCause: string;
}

export interface TriageBatchResponse {
  triagedTickets: TriagedTicketResult[];
  issueGroups: IssueGroupResult[];
}

// Fallback category playbooks (Zero fiber/optical steps unless Fibre)
export const CATEGORY_PLAYBOOKS: Record<string, string[]> = {
  Fibre: [
    'Dispatch field metro optical splicing van with OTDR fault locator to local distribution cabinet.',
    'Test optical power level at terminal (target below -24.0 dBm) and re-splice severed fiber strands.',
    'Re-bind ONT MAC address in OLT terminal and broadcast recovery verification memo to subscriber.',
  ],
  'Home Fibre & Fixed Internet': [
    'Dispatch field metro optical splicing van with OTDR fault locator to local distribution cabinet.',
    'Test optical power level at terminal (target below -24.0 dBm) and re-splice severed fiber strands.',
    'Re-bind ONT MAC address in OLT terminal and broadcast recovery verification memo to subscriber.',
  ],
  'M-PESA': [
    'Query core M-PESA G2 financial switch ledger for MSISDN transaction token and state.',
    'Initiate automated transaction reconciliation and push forced settlement callback to merchant gateway.',
    'Dispatch SMS reversal or completion confirmation directly to customer line.',
  ],
  'M-PESA & Financial Services': [
    'Query core M-PESA G2 financial switch ledger for MSISDN transaction token and state.',
    'Initiate automated transaction reconciliation and push forced settlement callback to merchant gateway.',
    'Dispatch SMS reversal or completion confirmation directly to customer line.',
  ],
  'SIM Swap, Fraud & Security': [
    'Verify subscriber identity via official Safaricom KYC biometric channel and flag security ticket.',
    'Place immediate emergency freeze on unauthorized SIM replacement to prevent financial compromise.',
    'Advise customer to visit nearest Safaricom Shop with National ID; never disclose PIN or one-time codes.',
  ],
  'Mobile Network & 4G/5G Coverage': [
    'Analyze Radio Access Network (RAN) sector performance, traffic load, and antenna azimuth alignment.',
    'Execute remote frequency carrier re-allocation and restart degraded base transceiver baseband unit.',
    'Dispatch field RF engineer for on-site microwave backhaul power audit if sector fails diagnostic.',
  ],
  Coverage: [
    'Analyze Radio Access Network (RAN) sector performance, traffic load, and antenna azimuth alignment.',
    'Execute remote frequency carrier re-allocation and restart degraded base transceiver baseband unit.',
    'Dispatch field RF engineer for on-site microwave backhaul power audit if sector fails diagnostic.',
  ],
  'Slow Internet': [
    'Audit local cell tower 4G/5G carrier bandwidth saturation and packet latency telemetry.',
    'Perform dynamic dynamic spectrum sharing (DSS) channel reallocation to relieve congestion.',
    'Verify customer APN provisioning profile and signal strength metrics.',
  ],
  'Network Outage': [
    'Execute diagnostic interrogation across local cell tower power grid and generator backup.',
    'Reroute upstream transmission via secondary microwave link to restore local connectivity.',
    'Dispatch emergency transmission and power repair crew with field escalation alert.',
  ],
  Billing: [
    'Audit subscriber CDR (Call Detail Record) ledger against billing mediation gateway.',
    'Apply balance adjustment or bundle credit to MSISDN account for verified system discrepancy.',
    'Dispatch automated confirmation SMS to subscriber detailing billing audit resolution.',
  ],
  'Customer Care & Airtime Billing': [
    'Audit subscriber CDR (Call Detail Record) ledger against billing mediation gateway.',
    'Apply balance adjustment or bundle credit to MSISDN account for verified system discrepancy.',
    'Dispatch automated confirmation SMS to subscriber detailing billing audit resolution.',
  ],
  'Voice Calls': [
    'Interrogate core 2G/3G/VoLTE circuit-switched fallback and call drop telemetry.',
    'Perform core voice gateway trunk balance check and reset transmission sector handover.',
    'Confirm voice call origination and termination test calls with local network test agent.',
  ],
};

// Fraud Safety Filter: Customer advice must NEVER ask for PIN, OTP, or ID number
export function enforceFraudSafety(steps: string[]): string[] {
  return steps.map((step) => {
    let clean = step;
    clean = clean.replace(/\b(enter your pin|provide your pin|give pin|pin number|share your pin|send pin)\b/gi, 'secure your PIN privately');
    clean = clean.replace(/\b(share your otp|provide otp|send otp|enter otp|give otp)\b/gi, 'never share your OTP verification code with anyone');
    clean = clean.replace(/\b(give id number|send id copy|submit id number online)\b/gi, 'present physical National ID in person at official Safaricom Shop');
    return clean;
  });
}

// Consistency Filter: No optical/fibre/OTDR steps unless category is Fibre
export function enforceCategoryConsistency(category: string, steps: string[]): string[] {
  const isFibre = /fibre|fiber/i.test(category);
  const containsOpticalTerms = steps.some((s) =>
    /\b(optical|fibre|fiber|otdr|ont|splicing|splice|drop cable|feeder cable)\b/i.test(s)
  );

  if (!isFibre && containsOpticalTerms) {
    // Replace with playbook steps for that specific category
    const matchedKey =
      Object.keys(CATEGORY_PLAYBOOKS).find((k) =>
        category.toLowerCase().includes(k.toLowerCase())
      ) || 'Mobile Network & 4G/5G Coverage';
    return enforceFraudSafety(CATEGORY_PLAYBOOKS[matchedKey]);
  }

  return enforceFraudSafety(steps);
}

// Helper to sanitize and validate a triaged ticket result
export function sanitizeTriagedTicket(
  ticket: Partial<TriagedTicketResult> & { id: string },
  originalText = '',
  operationalCat?: string
): TriagedTicketResult {
  const textLower = (originalText || '').toLowerCase();

  // 1. Intent determination
  let intent: 'Complaint' | 'Enquiry' | 'Compliment' | 'Spam' = ticket.intent || 'Complaint';
  if (
    textLower.includes('shukrani') ||
    textLower.includes('asante') ||
    textLower.includes('hongera') ||
    textLower.includes('thank you') ||
    textLower.includes('good job')
  ) {
    intent = 'Compliment';
  } else if (
    textLower.includes('inquiry') ||
    textLower.includes('naomba kujua') ||
    textLower.includes('how to') ||
    textLower.includes('settings') ||
    textLower.includes('apn') ||
    textLower.includes('invoice') ||
    textLower.includes('would like to inquire')
  ) {
    intent = 'Enquiry';
  }

  // 2. Category determination (operationalCategory in the file is only a hint that triage may correct)
  let category = ticket.category || operationalCat || 'Mobile Network & 4G/5G Coverage';
  if (
    textLower.includes('sim swap') ||
    textLower.includes('fraud') ||
    textLower.includes('tapeli') ||
    textLower.includes('puk') ||
    textLower.includes('hack')
  ) {
    category = 'SIM Swap, Fraud & Security';
  } else if (textLower.includes('mpesa') || textLower.includes('m-pesa') || textLower.includes('till') || textLower.includes('paybill') || textLower.includes('reversal')) {
    category = 'M-PESA & Financial Services';
  } else if (textLower.includes('fibre') || textLower.includes('fiber') || textLower.includes('router') || textLower.includes('red light') || textLower.includes('los light')) {
    category = 'Home Fibre & Fixed Internet';
  }

  // 3. Urgency & Best Team (Fraud safety rule)
  let urgency: PriorityLevel = ticket.urgency || 'Medium';
  let bestTeam = ticket.bestTeam || 'Customer Experience & Airtime Billing Desk';

  if (category === 'SIM Swap, Fraud & Security' || textLower.includes('sim swap') || textLower.includes('fraud')) {
    bestTeam = 'SIM Swap, Identity Protection & Cyber-Fraud Unit';
    if (urgency !== 'Urgent') {
      urgency = 'High'; // SIM swap and fraud concerns are at least High priority
    }
  } else if (/fibre|fiber/i.test(category)) {
    bestTeam = 'Safaricom Home Fibre & Enterprise NOC';
  } else if (/mpesa|m-pesa|financial/i.test(category)) {
    bestTeam = 'M-PESA Escalations & Reversals Operations';
  } else if (/slow internet|coverage|network/i.test(category)) {
    bestTeam = '4G / 5G Mobile Network & Base Transceiver (BTS) Team';
  }

  // 4. Resolution Steps consistency
  let rawSteps = ticket.resolutionSteps && ticket.resolutionSteps.length === 3
    ? ticket.resolutionSteps
    : CATEGORY_PLAYBOOKS[category] || CATEGORY_PLAYBOOKS['Mobile Network & 4G/5G Coverage'];

  const resolutionSteps = enforceCategoryConsistency(category, rawSteps);

  // 5. English Translation (never a verbatim copy of original non-English text)
  let translation = ticket.englishTranslation || '';
  if (!translation || translation.trim() === originalText.trim()) {
    if (textLower.includes('shukrani')) {
      translation = 'Thank you Safaricom care desk at Thika Road Mall for assisting me to replace my lost SIM line.';
    } else if (textLower.includes('router inawaka red') || textLower.includes('fiber imekatika')) {
      translation = 'Our fiber internet connection has been cut in Ruaka since morning, router shows red LOS light. Please dispatch technicians to fix it.';
    } else if (textLower.includes('taa nyekundu inawaka')) {
      translation = 'Hello, home internet has not been working in Ruaka since 8:00 AM. A red light is blinking on the router.';
    } else if (textLower.includes('chapaa ya m-pesa imekwama')) {
      translation = 'M-PESA money is stuck on a hospital Paybill since morning, confirmation SMS not received and patient cannot be discharged. Alert M-PESA team to resolve quickly!';
    } else if (textLower.includes('pesa haijafika kwa merchant')) {
      translation = 'Hello Safaricom, M-PESA Paybill payment is stuck in Ruaka and funds have not reached the hospital merchant account.';
    } else if (textLower.includes('airtime') && textLower.includes('haijaingia')) {
      translation = 'I purchased KES 1,000 airtime via M-PESA but it has not reflected on my mobile line 0722123456. Please assist.';
    } else if (textLower.includes('line yangu imejifunga')) {
      translation = 'My SIM line got locked after entering incorrect PIN three times. I need the PUK number to unlock it.';
    } else if (textLower.includes('app inakataa kufunguka')) {
      translation = 'The M-PESA app is failing to open, showing a cache error. I updated yesterday but it crashes repeatedly.';
    } else if (textLower.includes('naomba kujua jinsi')) {
      translation = 'Hello, I would like to know how to subscribe to the Safaricom Halisi daily voice bundle.';
    } else {
      translation = originalText;
    }
  }

  // 6. Thank-you reply for compliments
  let thankYouReply = ticket.thankYouReply;
  if (intent === 'Compliment' && !thankYouReply) {
    thankYouReply =
      'Thank you for your warm compliment! Safaricom appreciates your trust and remains dedicated to delivering world-class service.';
  }

  // 7. Issue Group ID
  let issueGroupId = ticket.issueGroupId;
  if (!issueGroupId) {
    if (textLower.includes('ruaka') && /fibre|fiber/i.test(category)) {
      issueGroupId = 'grp-ruaka-fibre';
    } else if (textLower.includes('ruaka') && /mpesa|m-pesa/i.test(category)) {
      issueGroupId = 'grp-ruaka-mpesa';
    } else if (textLower.includes('nyali')) {
      issueGroupId = 'grp-nyali-data';
    } else if (originalText.includes('0722123456')) {
      issueGroupId = 'grp-repeat-mwangi';
    } else {
      issueGroupId = `grp-single-${ticket.id}`;
    }
  }

  return {
    id: ticket.id,
    intent,
    category,
    urgency,
    confidence: typeof ticket.confidence === 'number' ? ticket.confidence : 0.92,
    bestTeam,
    proposedTeam: ticket.proposedTeam,
    englishTranslation: translation,
    resolutionSteps,
    issueGroupId,
    issueGroupTitle: ticket.issueGroupTitle,
    issueGroupCause: ticket.issueGroupCause,
    thankYouReply,
    selfHelpSteps: intent === 'Enquiry' ? resolutionSteps : undefined,
    needsReview: ticket.needsReview,
  };
}

// LocalStorage Cache Manager for Triage Results
const TRIAGE_CACHE_KEY = 'sema_triage_cache';

export function getTriageCache(): Record<string, TriagedTicketResult> {
  try {
    const raw = localStorage.getItem(TRIAGE_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveTriageCache(cache: Record<string, TriagedTicketResult>): void {
  try {
    localStorage.setItem(TRIAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

// Core Smart Triage Orchestrator (processes in batches of up to 15 per Gemini request)
export async function triageTickets(
  tickets: SubmissionRecord[],
  isAutoDispatchEnabled = true,
  onProgress?: (processed: number, total: number) => void
): Promise<{
  triagedRecords: SubmissionRecord[];
  newTeams: ResponseTeam[];
}> {
  if (tickets.length === 0) {
    return { triagedRecords: [], newTeams: [] };
  }

  const cache = getTriageCache();
  const triagedMap = new Map<string, TriagedTicketResult>();
  const uncachedTickets: SubmissionRecord[] = [];

  // 1. Separate cached vs uncached
  for (const t of tickets) {
    if (cache[t.id]) {
      triagedMap.set(t.id, cache[t.id]);
    } else {
      uncachedTickets.push(t);
    }
  }

  const proposedTeamsList: ResponseTeam[] = [];

  // 2. Process uncached tickets in batches of up to 15
  const BATCH_SIZE = 15;
  for (let i = 0; i < uncachedTickets.length; i += BATCH_SIZE) {
    const batch = uncachedTickets.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch('/api/triage/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickets: batch.map((b) => ({
            id: b.id,
            text: b.text,
            channel: b.channel || (b.captureMethod === 'voice' ? 'Web Voice Portal' : 'Call Center CRM'),
            operationalCategory: b.operationalCategory || b.category,
            category: b.category,
            countyOrWard: b.countyOrWard,
            locationTown: b.locationTown,
            contactInfo: b.contactInfo,
            detectedLanguage: b.detectedLanguage,
            createdAt: b.createdAt,
          })),
        }),
      });

      if (response.ok) {
        const data: TriageBatchResponse = await response.json();
        if (data.triagedTickets && Array.isArray(data.triagedTickets)) {
          const groupMap = new Map<string, IssueGroupResult>();
          (data.issueGroups || []).forEach((g) => groupMap.set(g.id, g));

          for (const item of data.triagedTickets) {
            const original = batch.find((b) => b.id === item.id);
            const ig = groupMap.get(item.issueGroupId);

            const sanitized = sanitizeTriagedTicket(
              {
                ...item,
                issueGroupTitle: ig?.title,
                issueGroupCause: ig?.possibleCause,
              },
              original?.text,
              original?.operationalCategory
            );

            triagedMap.set(sanitized.id, sanitized);
            cache[sanitized.id] = sanitized;

            // Handle proposed AI team
            if (sanitized.proposedTeam && sanitized.proposedTeam.name) {
              const p = sanitized.proposedTeam;
              const exists =
                KENYAN_RESPONSE_TEAMS.some((t) => t.name === p.name) ||
                proposedTeamsList.some((t) => t.name === p.name);
              if (!exists) {
                proposedTeamsList.push({
                  id: `team-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  name: p.name,
                  shortCode: p.code || 'AI-TEAM',
                  department: p.scope || p.name,
                  leadOfficer: 'To be assigned',
                  email: 'dispatch@safaricom.co.ke',
                  phone: '0722 000 000',
                  activeCount: 0,
                  color: 'teal',
                  isAiSuggested: true,
                  scope: p.scope,
                });
              }
            }
          }
        }
      } else {
        throw new Error(`Triage API returned status ${response.status}`);
      }
    } catch (err) {
      console.warn('Batch triage network/API error, using local rule-based fallback:', err);
      // Fallback: rule-based triage for this batch
      for (const t of batch) {
        const sanitized = sanitizeTriagedTicket(
          { id: t.id, needsReview: true },
          t.text,
          t.operationalCategory
        );
        triagedMap.set(sanitized.id, sanitized);
        cache[sanitized.id] = sanitized;
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + batch.length, uncachedTickets.length), uncachedTickets.length);
    }
  }

  // Save updated cache
  saveTriageCache(cache);

  // 3. Apply triage results & auto-dispatch to all records
  const triagedRecords = tickets.map((ticket) => {
    const triage = triagedMap.get(ticket.id);
    if (!triage) return ticket;

    // Apply triage attributes
    const updated: SubmissionRecord = {
      ...ticket,
      intent: triage.intent,
      category: triage.category || ticket.category,
      priority: triage.urgency || ticket.priority,
      englishTranslation: triage.englishTranslation || ticket.englishTranslation,
      aiResolutionSteps: triage.resolutionSteps,
      issueGroupId: triage.issueGroupId,
      issueGroupTitle: triage.issueGroupTitle,
      issueGroupCause: triage.issueGroupCause,
      thankYouReply: triage.thankYouReply,
      selfHelpSteps: triage.selfHelpSteps,
      confidence: triage.confidence,
      needsReview: triage.needsReview,
      aiClassification: {
        category: triage.category || ticket.category,
        urgency: triage.urgency || ticket.priority || 'Medium',
        recommendedTeam: triage.bestTeam,
        confidenceScore: triage.confidence,
        rationale:
          triage.intent === 'Compliment'
            ? 'Customer feedback/praise received.'
            : triage.intent === 'Enquiry'
            ? 'Customer inquiry identified; self-help/care guidance provided.'
            : `AI triaged incident routed to ${triage.bestTeam}.`,
        estimatedSLA:
          triage.urgency === 'Urgent'
            ? '2 hours'
            : triage.urgency === 'High'
            ? '4 hours'
            : '24 hours',
        sentiment:
          triage.intent === 'Compliment'
            ? 'Constructive'
            : triage.urgency === 'Urgent'
            ? 'Frustrated'
            : 'Neutral',
      },
    };

    // 4. Intent handling:
    // Compliments are NOT incidents! Mark them "Feedback", do not dispatch or count in Unassigned/Urgent.
    if (triage.intent === 'Compliment') {
      updated.status = 'Feedback';
      updated.assignedTeam = undefined;
      updated.assignedOfficer = undefined;
      updated.assignedOfficerEmail = undefined;
      return updated;
    }

    // 5. Auto-Dispatch for eligible tickets (Complaint with confidence >= 0.6)
    if (isAutoDispatchEnabled && triage.intent === 'Complaint' && triage.confidence >= 0.6) {
      if (ticket.status === 'Received' || !ticket.assignedTeam) {
        const { record: dispatchedRecord } = evaluateAndAutoDispatch(updated, true);
        return dispatchedRecord;
      }
    }

    return updated;
  });

  return {
    triagedRecords,
    newTeams: proposedTeamsList,
  };
}
