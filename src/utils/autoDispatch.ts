import { SubmissionRecord, EmailDispatchLog, KENYAN_RESPONSE_TEAMS, PriorityLevel } from '../types';

export function getShortTeamName(teamName: string): string {
  if (teamName.includes('Fibre')) return 'Home Fibre NOC';
  if (teamName.includes('M-PESA Escalations')) return 'M-PESA Escalations';
  if (teamName.includes('Mobile Network') || teamName.includes('RAN') || teamName.includes('BTS')) return '4G/5G Network Team';
  if (teamName.includes('SIM Swap') || teamName.includes('Fraud')) return 'Cyber-Fraud Unit';
  if (teamName.includes('Customer Experience') || teamName.includes('Billing')) return 'Customer Experience Desk';
  if (teamName.includes('Enterprise')) return 'Enterprise Cloud Desk';
  if (teamName.includes('Merchant')) return 'Merchant Services Desk';
  return teamName.split('&')[0].trim();
}

export function mapCategoryToResponseTeam(
  category?: string,
  operationalCategory?: string,
  text?: string
): typeof KENYAN_RESPONSE_TEAMS[0] | null {
  const combined = `${category || ''} ${operationalCategory || ''} ${text || ''}`.toLowerCase();

  // 1. Home Fibre
  if (
    combined.includes('fibre') ||
    combined.includes('fiber') ||
    combined.includes('router') ||
    combined.includes('ont') ||
    combined.includes('los light') ||
    combined.includes('red light')
  ) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fibre') || KENYAN_RESPONSE_TEAMS[0];
  }

  // 2. Lipa Na M-PESA & Merchant
  if (
    combined.includes('merchant') ||
    (combined.includes('till') && !combined.includes('reversal')) ||
    combined.includes('lipa na m-pesa')
  ) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-merch') || KENYAN_RESPONSE_TEAMS[1];
  }

  // 3. M-PESA & Financial Services
  if (
    combined.includes('m-pesa') ||
    combined.includes('mpesa') ||
    combined.includes('reversal') ||
    combined.includes('fuliza') ||
    combined.includes('send money')
  ) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-mpesa') || KENYAN_RESPONSE_TEAMS[1];
  }

  // 4. Mobile Network & 4G/5G Coverage
  if (
    combined.includes('mobile network') ||
    combined.includes('coverage') ||
    combined.includes('network outage') ||
    combined.includes('slow internet') ||
    combined.includes('voice calls') ||
    combined.includes('4g') ||
    combined.includes('5g') ||
    combined.includes('signal') ||
    combined.includes('bts') ||
    combined.includes('mast') ||
    combined.includes('emergency calls')
  ) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-ran') || KENYAN_RESPONSE_TEAMS[2];
  }

  // 5. SIM Swap, Fraud & Security
  if (
    combined.includes('sim swap') ||
    combined.includes('fraud') ||
    combined.includes('security') ||
    combined.includes('puk') ||
    combined.includes('tapeli') ||
    combined.includes('hack') ||
    combined.includes('theft')
  ) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fraud') || KENYAN_RESPONSE_TEAMS[3];
  }

  // 6. Customer Care & Airtime Billing
  if (
    combined.includes('billing') ||
    combined.includes('airtime') ||
    combined.includes('bonga') ||
    combined.includes('bundle') ||
    combined.includes('invoice') ||
    combined.includes('balance') ||
    combined.includes('customer care')
  ) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-care') || KENYAN_RESPONSE_TEAMS[4];
  }

  // 7. Enterprise & Cloud
  if (combined.includes('enterprise') || combined.includes('cloud') || combined.includes('leased line')) {
    return KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-ent') || KENYAN_RESPONSE_TEAMS[5];
  }

  return null;
}

export interface AutoDispatchEvaluation {
  record: SubmissionRecord;
  dispatched: boolean;
  needsReview: boolean;
  toastMessage?: string;
  emailLog?: EmailDispatchLog;
}

export function evaluateAndAutoDispatch(
  ticket: SubmissionRecord,
  isAutoDispatchEnabled: boolean
): AutoDispatchEvaluation {
  // Do not re-dispatch tickets already assigned or restored from localStorage / duplicate alert protection
  if (
    ticket.status === 'Assigned' ||
    ticket.status === 'In Progress' ||
    ticket.status === 'Resolved' ||
    ticket.status === 'Closed' ||
    ticket.emailAlertSent
  ) {
    return {
      record: ticket,
      dispatched: false,
      needsReview: !!ticket.needsReview,
    };
  }

  // If Auto-dispatch is OFF: tickets stay Received as they do today
  if (!isAutoDispatchEnabled) {
    return {
      record: {
        ...ticket,
        status: 'Received',
        assignedTeam: undefined,
        assignedOfficer: undefined,
        assignedOfficerEmail: undefined,
        emailAlertSent: false,
      },
      dispatched: false,
      needsReview: false,
    };
  }

  // Safety rule check:
  // 1. AI confidence is below 0.6
  // 2. Or the category is unknown / undetermined
  const confidence = ticket.aiClassification?.confidenceScore;
  const isConfidenceTooLow = typeof confidence === 'number' && confidence < 0.6;

  let matchedTeam = mapCategoryToResponseTeam(
    ticket.category,
    ticket.operationalCategory,
    ticket.text
  );

  // Fraud Safety rule: SIM swap and fraud concerns ALWAYS route to Cyber-Fraud Unit
  const textLower = (ticket.text || '').toLowerCase();
  if (
    ticket.category === 'SIM Swap, Fraud & Security' ||
    textLower.includes('sim swap') ||
    textLower.includes('fraud') ||
    textLower.includes('tapeli') ||
    textLower.includes('puk') ||
    textLower.includes('theft')
  ) {
    const fraudTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fraud') || KENYAN_RESPONSE_TEAMS[3];
    matchedTeam = fraudTeam;
  }

  // AI-suggested / proposed team fallback
  if (!matchedTeam && ticket.proposedTeam && ticket.proposedTeam.name) {
    matchedTeam = {
      id: `team-ai-${ticket.proposedTeam.code.toLowerCase()}`,
      name: ticket.proposedTeam.name,
      shortCode: ticket.proposedTeam.code || 'AI-TEAM',
      department: ticket.proposedTeam.scope || ticket.proposedTeam.name,
      leadOfficer: 'To be assigned',
      email: 'dispatch@safaricom.co.ke',
      phone: '0722 000 000',
      activeCount: 0,
      color: 'teal',
      isAiSuggested: true,
      scope: ticket.proposedTeam.scope,
    };
  } else if (!matchedTeam && ticket.aiClassification?.recommendedTeam) {
    const recName = ticket.aiClassification.recommendedTeam;
    const found = KENYAN_RESPONSE_TEAMS.find((t) => t.name === recName);
    matchedTeam = found || {
      id: `team-${recName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: recName,
      shortCode: 'AI-TEAM',
      department: ticket.category || 'Operational Unit',
      leadOfficer: 'To be assigned',
      email: 'dispatch@safaricom.co.ke',
      phone: '0722 000 000',
      activeCount: 0,
      color: 'teal',
      isAiSuggested: true,
    };
  }

  const isCategoryUnknown =
    !ticket.category ||
    ticket.category.toLowerCase().includes('unknown') ||
    ticket.category.toLowerCase().includes('other') ||
    !matchedTeam;

  if (isConfidenceTooLow || isCategoryUnknown || !matchedTeam) {
    // Leave the ticket Unassigned for manual triage and show a "Needs review" badge
    const reviewRecord: SubmissionRecord = {
      ...ticket,
      status: 'Received',
      assignedTeam: undefined,
      assignedOfficer: undefined,
      assignedOfficerEmail: undefined,
      needsReview: true,
      adminNotes: isConfidenceTooLow
        ? `Safety Rule: Flagged for manual review. AI confidence score (${Math.round((confidence || 0) * 100)}%) is below the 60% threshold.`
        : 'Safety Rule: Flagged for manual review. Category is unknown or unverified.',
    };

    return {
      record: reviewRecord,
      dispatched: false,
      needsReview: true,
      toastMessage: `Ticket ${ticket.referenceCode} flagged: Needs review (Manual triage required)`,
    };
  }

  // Successful Auto-Dispatch:
  // 1. Set status to Assigned
  // 2. Start SLA timer (slaStartedAt)
  // 3. Create officer alert (email log entry)
  const slaStartedAt = ticket.slaStartedAt || new Date().toISOString();
  const urgency = ticket.priority || ticket.aiClassification?.urgency || 'Medium';
  const targetSLA =
    ticket.aiClassification?.estimatedSLA ||
    (urgency === 'Urgent' ? '2 hours' : urgency === 'High' ? '6 hours' : '24 hours');

  const emailSubject = `[SAFARICOM NOC AUTO-DISPATCH] ${ticket.referenceCode} - ${matchedTeam.department} (${urgency} Priority)`;
  const emailBody = `======================================================
SAFARICOM PLC - RAPID INCIDENT AUTO-DISPATCH NOTICE
Network Operations Center (NOC) & Customer Escalations
======================================================

INCIDENT REFERENCE: ${ticket.referenceCode}
STATUS:             ASSIGNED (AUTO-DISPATCH)
SLA CLOCK STARTED:  ${new Date(slaStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
TARGET SLA:         ${targetSLA}
CATEGORY:           ${ticket.category || matchedTeam.department}
LOCATION:           ${ticket.countyOrWard}

ASSIGNED FIELD OFFICER:
  Lead Officer:  ${matchedTeam.leadOfficer}
  Email:         ${matchedTeam.email}
  Response Team: ${matchedTeam.name}

------------------------------------------------------
CUSTOMER INCIDENT REPORT:
------------------------------------------------------
"${ticket.text}"
Language: ${ticket.detectedLanguage} (Capture Method: ${ticket.captureMethod || 'text'})
${ticket.englishTranslation ? `\nEnglish Translation:\n"${ticket.englishTranslation}"\n` : ''}
${ticket.imageAnalysis ? `\nAI Visual Diagnosis / Likely Issue:\n"${ticket.imageAnalysis}"\n` : ''}
${ticket.attachedImages && ticket.attachedImages.length > 0 ? `\nAttached Screenshots/Photos: ${ticket.attachedImages.length} image(s) attached by customer\n` : ''}
${ticket.contactInfo ? `Customer Line / Contact: ${ticket.contactInfo}` : 'Customer Contact: Digital Web Portal'}

------------------------------------------------------
AUTOMATED ROUTING DIRECTIVES:
------------------------------------------------------
Routing Mapping: ${ticket.category || matchedTeam.department} -> ${matchedTeam.name}
Confidence:      ${confidence !== undefined ? `${Math.round(confidence * 100)}% (Verified)` : 'Rule-mapped'}
Directives:      ${ticket.aiClassification?.rationale || 'Auto-dispatched via Safaricom operational rule engine.'}

Automated alert dispatched by Safaricom SEMA Intelligent NOC Operations.
======================================================`;

  const emailLog: EmailDispatchLog = {
    id: `email-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    submissionId: ticket.id,
    referenceCode: ticket.referenceCode,
    toEmail: matchedTeam.email,
    officerName: matchedTeam.leadOfficer,
    teamName: matchedTeam.name,
    category: ticket.category || matchedTeam.department,
    priority: urgency as PriorityLevel,
    subject: emailSubject,
    body: emailBody,
    sentAt: slaStartedAt,
    status: 'Delivered',
  };

  const shortName = getShortTeamName(matchedTeam.name);

  const dispatchedRecord: SubmissionRecord = {
    ...ticket,
    status: 'Assigned',
    assignedTeam: matchedTeam.name,
    assignedOfficer: matchedTeam.leadOfficer,
    assignedOfficerEmail: matchedTeam.email,
    slaStartedAt,
    needsReview: false,
    emailAlertSent: true,
    emailAlertRecipient: matchedTeam.email,
    emailAlertSentAt: slaStartedAt,
    emailAlertSubject: emailSubject,
    emailAlertBody: emailBody,
    adminNotes: `Auto-dispatched to ${matchedTeam.name} (Officer: ${matchedTeam.leadOfficer}). Target SLA: ${targetSLA}. SLA clock started.`,
  };

  return {
    record: dispatchedRecord,
    dispatched: true,
    needsReview: false,
    toastMessage: `Auto-dispatched ${ticket.referenceCode} to ${shortName}`,
    emailLog,
  };
}
