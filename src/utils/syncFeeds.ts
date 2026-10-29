import demoComplaintsFallback from '../data/demoComplaints.json';
import {
  SubmissionRecord,
  InflowChannel,
  OperationalCategory,
  PriorityLevel,
  AIClassification,
} from '../types';
import { evaluateAndAutoDispatch } from './autoDispatch';
import { determineSeedPriority, getCategoryAndTeamForSeed } from './clusterComputation';

/**
 * Normalises arbitrary channel names and capture methods so tickets count into
 * their canonical Channel Mix tiles:
 * - "Twitter (X)", "X", "Twitter" -> Twitter
 * - "Call Center CRM" -> Call Center
 * - "Web Voice Portal" -> Web Voice
 * - "Zuri", "One App", "USSD", "LinkedIn", "WhatsApp", "Email" -> their own tiles
 * - Instagram -> Instagram (0 if empty)
 */
export function normalizeChannelForTile(channel?: string, captureMethod?: string): string {
  if (captureMethod === 'voice' && (!channel || channel === 'Web Voice Portal' || channel === 'Web Voice')) {
    return 'Web Voice';
  }
  const raw = (channel || '').trim();
  const lower = raw.toLowerCase();

  if (lower === 'twitter (x)' || lower === 'x' || lower === 'twitter') {
    return 'Twitter';
  }
  if (lower === 'call center crm' || lower === 'call center' || lower === 'crm') {
    return 'Call Center';
  }
  if (lower === 'web voice portal' || lower === 'web voice' || lower === 'voice portal') {
    return 'Web Voice';
  }
  if (lower === 'zuri') {
    return 'Zuri';
  }
  if (lower === 'one app' || lower === 'oneapp' || lower === 'my safaricom' || lower === 'mysafaricom') {
    return 'One App';
  }
  if (lower === 'ussd') {
    return 'USSD';
  }
  if (lower === 'linkedin') {
    return 'LinkedIn';
  }
  if (lower === 'whatsapp') {
    return 'WhatsApp';
  }
  if (lower === 'email') {
    return 'Email';
  }
  if (lower === 'instagram') {
    return 'Instagram';
  }
  if (captureMethod === 'voice') {
    return 'Web Voice';
  }
  return raw || 'Web Voice';
}

/**
 * Canonical 10 Channel Mix tiles in priority order
 */
export const CHANNEL_MIX_TILES = [
  'Twitter',
  'Call Center',
  'Web Voice',
  'Zuri',
  'One App',
  'USSD',
  'LinkedIn',
  'WhatsApp',
  'Email',
  'Instagram',
] as const;

export type ChannelMixTileName = (typeof CHANNEL_MIX_TILES)[number];

/**
 * Converts a raw record from demoComplaints.json into a full SubmissionRecord.
 * - Source is explicitly marked as "synced"
 * - Creation time is set to now minus minutesAgo minutes
 * - Evaluates auto-dispatch based on existing business rules
 * - NOTE: demoTag and meta are ignored in linking/clustering logic
 */
export function convertRecordToTicket(
  record: any,
  autoDispatchEnabled = true
): SubmissionRecord {
  const minutesAgo = typeof record.minutesAgo === 'number' ? record.minutesAgo : 0;
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const priority: PriorityLevel = determineSeedPriority(record.operationalCategory, record.text);
  const meta = getCategoryAndTeamForSeed(record.operationalCategory, record.text);

  let locationTown = 'Nairobi';
  const cw = (record.countyOrWard || '').toLowerCase();
  if (cw.includes('ruaka')) locationTown = 'Ruaka';
  else if (cw.includes('nyali') || cw.includes('mombasa')) locationTown = 'Mombasa';
  else if (cw.includes('nakuru')) locationTown = 'Nakuru';
  else if (cw.includes('kisumu')) locationTown = 'Kisumu';
  else if (cw.includes('eldoret')) locationTown = 'Eldoret';
  else if (cw.includes('nyeri')) locationTown = 'Nyeri';
  else if (cw.includes('kiambu')) locationTown = 'Kiambu';

  const frustration = priority === 'Urgent' ? 88 : priority === 'High' ? 65 : 35;
  const isHighTension = frustration >= 70 || priority === 'Urgent';

  const aiClassification: AIClassification = {
    category: meta.category,
    urgency: priority,
    recommendedTeam: meta.team,
    confidenceScore: 0.94,
    rationale: `${meta.rationale} Ingested via ${record.inflowChannel}.`,
    estimatedSLA: meta.sla,
    sentiment: isHighTension ? 'Frustrated' : 'Neutral',
    tensionLevel: isHighTension ? 'High' : 'Standard',
    frustrationScore: frustration,
    isHighTension,
    tensionFactors: [`Inflow channel: ${record.inflowChannel}`, `${record.countyOrWard} incident`],
    tensionNotes: isHighTension
      ? 'Elevated customer urgency flagged for rapid team response.'
      : 'Standard operational SLA window.',
  };

  const randCode = Math.floor(1000 + Math.random() * 9000);
  const idDigits = (record.id || '').replace(/\D/g, '') || randCode;

  const baseTicket: SubmissionRecord = {
    id: record.id,
    referenceCode: `SEMA-SAF-${idDigits}`,
    text: record.text,
    channel: record.inflowChannel as InflowChannel,
    handle: record.handle || undefined,
    detectedLanguage: (record.detectedLanguage as any) || 'English',
    englishTranslation: record.detectedLanguage !== 'English' ? `Translation: ${record.text}` : undefined,
    countyOrWard: record.countyOrWard || 'Kenya (General)',
    locationTown,
    latitude: typeof record.latitude === 'number' ? record.latitude : undefined,
    longitude: typeof record.longitude === 'number' ? record.longitude : undefined,
    contactInfo: record.contactInfo || undefined,
    operationalCategory: record.operationalCategory as OperationalCategory,
    category: meta.category,
    captureMethod: record.inflowChannel === 'Web Voice Portal' ? 'voice' : 'text',
    aiCommitmentResponse: `SEMA automated dispatch: Incident logged via ${record.inflowChannel} from ${record.countyOrWard}. Dispatched to ${meta.team}.`,
    status: 'Received',
    priority,
    source: 'synced',
    isSyncedFeed: true,
    createdAt,
    aiClassification,
    aiRootCause: meta.rootCause,
    sentiment: aiClassification.sentiment,
    tensionLevel: aiClassification.tensionLevel,
    frustrationScore: aiClassification.frustrationScore,
    isHighTension: aiClassification.isHighTension,
    tensionFactors: aiClassification.tensionFactors,
    tensionNotes: aiClassification.tensionNotes,
  };

  const { record: finalRecord } = evaluateAndAutoDispatch(baseTicket, autoDispatchEnabled);
  return finalRecord;
}

/**
 * syncSimulatedFeeds()
 * - Fetches /api/demo-complaints, falling back to bundled JSON
 * - Converts each record in "records" into a ticket with createdAt = now - minutesAgo minutes
 * - Marks each ticket with source: "synced"
 * - Skips IDs that already exist (running twice never duplicates)
 * - NEVER deletes or overwrites tickets created live from the customer side
 * - Runs existing triage & auto-dispatch
 * - Saves merged list to localStorage
 * - Ignores demoTag and meta fields in linking logic
 */
export async function syncSimulatedFeeds(
  currentTickets: SubmissionRecord[] = [],
  autoDispatchEnabled = true
): Promise<{
  merged: SubmissionRecord[];
  newlyAddedCount: number;
  totalSyncedCount: number;
  syncedChannelsCount: number;
}> {
  let dataset: any = null;
  try {
    const res = await fetch('/api/demo-complaints');
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        dataset = await res.json();
      }
    }
  } catch (err) {
    console.warn('Network fetch /api/demo-complaints notice:', err);
  }

  if (!dataset || !Array.isArray(dataset.records) || dataset.records.length === 0) {
    dataset = demoComplaintsFallback;
  }

  const rawRecords = Array.isArray(dataset?.records) ? dataset.records : [];

  // Reconcile with localStorage
  let existing = [...currentTickets];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('sema_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, SubmissionRecord>();
          parsed.forEach((t: SubmissionRecord) => map.set(t.id, t));
          currentTickets.forEach((t: SubmissionRecord) => map.set(t.id, t));
          existing = Array.from(map.values());
        }
      }
    } catch {
      // ignore
    }
  }

  // Purge old hardcoded starter tickets (e.g., sema-101 .. sema-110)
  const cleanExisting = existing.filter((t) => !t.id.startsWith('sema-10'));

  // Build ID lookup to deduplicate
  const existingMap = new Map<string, SubmissionRecord>();
  cleanExisting.forEach((t) => existingMap.set(t.id, t));

  let newlyAddedCount = 0;
  const newTickets: SubmissionRecord[] = [];

  for (const rec of rawRecords) {
    if (!rec || !rec.id) continue;
    // Skip if ID already exists (running twice never duplicates)
    if (existingMap.has(rec.id)) {
      continue;
    }
    const ticket = convertRecordToTicket(rec, autoDispatchEnabled);
    newTickets.push(ticket);
    newlyAddedCount++;
  }

  // Preserve all live customer tickets!
  const merged = [...cleanExisting, ...newTickets];

  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sema_submissions', JSON.stringify(merged));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }

  // Sync to server-side submissionsStore
  if (newTickets.length > 0) {
    try {
      fetch('/api/submissions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: merged }),
      }).catch(() => {});
    } catch {}
  }

  // Compute real counts for status line
  const syncedTickets = merged.filter(
    (t) => t.source === 'synced' || t.isSyncedFeed || t.id.startsWith('dummy-')
  );
  const activeChannels = new Set<string>();
  for (const t of syncedTickets) {
    const tile = normalizeChannelForTile(t.channel, t.captureMethod);
    activeChannels.add(tile);
  }

  return {
    merged,
    newlyAddedCount,
    totalSyncedCount: syncedTickets.length,
    syncedChannelsCount: activeChannels.size,
  };
}

/**
 * Removes ONLY tickets with source "synced". Live Web Voice and portal tickets stay.
 */
export function clearSyncedFeeds(
  currentTickets: SubmissionRecord[]
): { remaining: SubmissionRecord[]; removedCount: number } {
  const remaining = currentTickets.filter(
    (t) =>
      t.source !== 'synced' &&
      !t.isSyncedFeed &&
      !t.id.startsWith('dummy-') &&
      !t.id.startsWith('sema-sync-')
  );

  const removedCount = currentTickets.length - remaining.length;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sema_submissions', JSON.stringify(remaining));
      localStorage.setItem('sema_synced_feeds_completed', 'cleared');
    } catch {}
    try {
      fetch('/api/submissions/synced', { method: 'DELETE' }).catch(() => {});
    } catch {}
  }

  return { remaining, removedCount };
}
