import demoComplaintsData from '../data/demoComplaints.json';
import {
  SubmissionRecord,
  PriorityLevel,
  InflowChannel,
  OperationalCategory,
  AIClassification,
} from '../types';
import { evaluateAndAutoDispatch } from './autoDispatch';

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  isMain: boolean;
  relationBadge?: string;
  linkExplanation?: string;
}

export interface IncidentCluster {
  id: string;
  name: string;
  location: string;
  area: string;
  totalComplaints: number;
  tickets: SubmissionRecord[];
  isPrimaryHub: boolean;
  status: string;
  rootCause: string;
  impactedServices: string[];
  channelBreakdown: Record<string, number>;
  categoryBreakdown: CategoryBreakdownItem[];
  categorySummaryString: string;
  actionDirectives: string[];
  earliestTime: string;
  latestTime: string;
}

export function determineSeedPriority(operationalCategory: string, text: string): PriorityLevel {
  const lower = (text || '').toLowerCase();
  if (
    lower.includes('down') ||
    lower.includes('outage') ||
    lower.includes('imekatika') ||
    lower.includes('cut') ||
    lower.includes('los') ||
    lower.includes('red') ||
    lower.includes('hospital') ||
    lower.includes('emergency') ||
    lower.includes('stuck') ||
    lower.includes('pending') ||
    lower.includes('deducted') ||
    lower.includes('sim swap') ||
    lower.includes('fraud') ||
    lower.includes('theft') ||
    lower.includes('hazard') ||
    lower.includes('moto') ||
    (operationalCategory === 'Fibre' && (lower.includes('red') || lower.includes('down') || lower.includes('los'))) ||
    (operationalCategory === 'M-PESA' && (lower.includes('stuck') || lower.includes('hospital') || lower.includes('pending') || lower.includes('deducted')))
  ) {
    return 'Urgent';
  }
  if (
    lower.includes('slow') ||
    lower.includes('speed') ||
    lower.includes('buffer') ||
    lower.includes('dropped') ||
    lower.includes('signal') ||
    lower.includes('coverage') ||
    lower.includes('blackout') ||
    lower.includes('mast') ||
    lower.includes('tower') ||
    operationalCategory === 'Slow Internet' ||
    operationalCategory === 'Coverage'
  ) {
    return 'High';
  }
  return 'Medium';
}

export function getCategoryAndTeamForSeed(operationalCategory: string, text: string) {
  const lower = (text || '').toLowerCase();
  if (
    operationalCategory === 'Fibre' ||
    lower.includes('fibre') ||
    lower.includes('fiber') ||
    lower.includes('router') ||
    lower.includes('ont')
  ) {
    return {
      category: 'Home Fibre & Fixed Internet',
      team: 'Safaricom Home Fibre & Enterprise NOC',
      officer: 'Eng. Dennis Kiprono',
      email: 'dennis.kiprono@safaricom.co.ke',
      sla: '2 hours',
      rationale: 'Optical fiber link disruption reported on customer endpoint.',
      rootCause: 'Optical distribution attenuation or feeder cable fault.',
    };
  }
  if (
    operationalCategory === 'M-PESA' ||
    lower.includes('m-pesa') ||
    lower.includes('mpesa') ||
    lower.includes('till') ||
    lower.includes('paybill') ||
    lower.includes('reversal')
  ) {
    return {
      category: 'M-PESA & Financial Services',
      team: 'M-PESA Escalations & Reversals Operations',
      officer: 'Officer Grace Mwangi',
      email: 'grace.mwangi@safaricom.co.ke',
      sla: '30 minutes',
      rationale: 'M-PESA financial transaction ledger reconciliation required.',
      rootCause: 'Inter-switch settlement timeout between payment switch and merchant API.',
    };
  }
  if (
    operationalCategory === 'Billing' ||
    lower.includes('airtime') ||
    lower.includes('bundle') ||
    lower.includes('invoice') ||
    lower.includes('balance')
  ) {
    return {
      category: 'Customer Care & Airtime Billing',
      team: 'Customer Experience & Airtime Billing Desk',
      officer: 'Coordinator Agnes Muthoni',
      email: 'agnes.muthoni@safaricom.co.ke',
      sla: '6 hours',
      rationale: 'Account airtime balance or subscription deduction review.',
      rootCause: 'Transaction reconciliation delay between billing switch and subscriber balance ledger.',
    };
  }
  if (
    operationalCategory === 'Slow Internet' ||
    operationalCategory === 'Voice Calls' ||
    operationalCategory === 'Coverage' ||
    lower.includes('call') ||
    lower.includes('network') ||
    lower.includes('4g') ||
    lower.includes('5g')
  ) {
    return {
      category: 'Mobile Network & 4G/5G Coverage',
      team: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
      officer: 'Supervisor Brian Otieno',
      email: 'brian.otieno@safaricom.co.ke',
      sla: '4 hours',
      rationale: 'Radio Access Network (RAN) sector optimization or cellular signal loss.',
      rootCause: 'High sector congestion or microwave backhaul packet latency.',
    };
  }
  if (lower.includes('swap') || lower.includes('fraud') || lower.includes('puk') || lower.includes('hack')) {
    return {
      category: 'SIM Swap, Fraud & Security',
      team: 'SIM Swap, Identity Protection & Cyber-Fraud Unit',
      officer: 'Insp. Hassan Ali',
      email: 'hassan.ali@safaricom.co.ke',
      sla: '1 hour',
      rationale: 'Security escalation or identity verification required.',
      rootCause: 'Identity verification check or PUK unlock procedure required.',
    };
  }
  return {
    category: 'Customer Care & Airtime Billing',
    team: 'Customer Experience & Airtime Billing Desk',
    officer: 'Coordinator Agnes Muthoni',
    email: 'agnes.muthoni@safaricom.co.ke',
    sla: '12 hours',
    rationale: 'General customer operational inquiry.',
    rootCause: 'General subscriber query.',
  };
}

export function buildRecordFromDemoComplaint(
  record: (typeof demoComplaintsData.records)[0],
  autoDispatchEnabled = true
): SubmissionRecord {
  const minutesAgo = record.minutesAgo || 0;
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const priority = determineSeedPriority(record.operationalCategory, record.text);
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
  const baseRecord: SubmissionRecord = {
    id: record.id || `dummy-${randCode}`,
    referenceCode: `SEMA-SAF-${randCode}`,
    text: record.text,
    detectedLanguage: (record.detectedLanguage as any) || 'English',
    englishTranslation: record.detectedLanguage !== 'English' ? `Translation: ${record.text}` : undefined,
    category: record.operationalCategory || meta.category,
    countyOrWard: record.countyOrWard,
    locationTown,
    contactInfo: record.contactInfo || undefined,
    captureMethod: record.inflowChannel === 'Web Voice Portal' ? 'voice' : 'text',
    aiCommitmentResponse: `SEMA automated dispatch: Incident logged via ${record.inflowChannel} from ${record.countyOrWard}. Dispatched to ${meta.team}.`,
    status: 'Received',
    priority,
    assignedTeam: undefined,
    assignedOfficer: undefined,
    assignedOfficerEmail: undefined,
    channel: record.inflowChannel as InflowChannel,
    operationalCategory: record.operationalCategory as OperationalCategory,
    handle: record.handle || undefined,
    latitude: typeof record.latitude === 'number' ? record.latitude : undefined,
    longitude: typeof record.longitude === 'number' ? record.longitude : undefined,
    isSyncedFeed: true,
    aiClassification,
    aiRootCause: meta.rootCause,
    sentiment: aiClassification.sentiment,
    tensionLevel: aiClassification.tensionLevel,
    frustrationScore: aiClassification.frustrationScore,
    isHighTension: aiClassification.isHighTension,
    tensionFactors: aiClassification.tensionFactors,
    tensionNotes: aiClassification.tensionNotes,
    createdAt,
  };

  const { record: finalRecord } = evaluateAndAutoDispatch(baseRecord, autoDispatchEnabled);
  return finalRecord;
}

export function getAllDemoSubmissionRecords(autoDispatchEnabled = true): SubmissionRecord[] {
  const records = demoComplaintsData?.records || [];
  return records.map((r) => buildRecordFromDemoComplaint(r, autoDispatchEnabled));
}

export function computeClustersFromStore(submissions: SubmissionRecord[]): IncidentCluster[] {
  const areaGroups: Record<string, { area: string; location: string; tickets: SubmissionRecord[] }> = {};

  for (const ticket of submissions) {
    const cow = (ticket.countyOrWard || '').trim();
    let areaName = '';
    let locationLabel = cow;

    if (cow.includes('·')) {
      const parts = cow.split('·').map((s) => s.trim());
      const county = parts[0];
      const subArea = parts[1].split('/')[0].trim();
      areaName = subArea;
      locationLabel = `${subArea} · ${county}`;
    } else {
      areaName = ticket.locationTown || cow || 'Unknown';
      locationLabel = cow || areaName;
    }

    const key = areaName.toLowerCase();
    if (!areaGroups[key]) {
      areaGroups[key] = {
        area: areaName,
        location: locationLabel,
        tickets: [],
      };
    }
    areaGroups[key].tickets.push(ticket);
  }

  const clusters: IncidentCluster[] = [];

  for (const key of Object.keys(areaGroups)) {
    const group = areaGroups[key];
    const tickets = group.tickets;
    if (tickets.length < 3) continue;

    // Sort ascending by creation time
    const sorted = [...tickets].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Find cluster of 3 or more tickets within 60 minutes
    let bestClusterTickets: SubmissionRecord[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const windowStart = new Date(sorted[i].createdAt).getTime();
      const windowEnd = windowStart + 60 * 60 * 1000;
      const inWindow = sorted.filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= windowStart && time <= windowEnd;
      });
      if (inWindow.length >= 3 && inWindow.length > bestClusterTickets.length) {
        bestClusterTickets = inWindow;
      }
    }

    const earliestTime = new Date(sorted[0].createdAt).getTime();
    const latestTime = new Date(sorted[sorted.length - 1].createdAt).getTime();
    if (latestTime - earliestTime <= 60 * 60 * 1000) {
      bestClusterTickets = sorted;
    }

    if (bestClusterTickets.length >= 3) {
      const channelBreakdown: Record<string, number> = {};
      for (const t of bestClusterTickets) {
        const ch = t.channel || (t.captureMethod === 'voice' ? 'Web Voice Portal' : 'Call Center CRM');
        channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
      }

      const hasFibre = bestClusterTickets.some(
        (t) =>
          t.operationalCategory === 'Fibre' ||
          (t.category || '').includes('Fibre') ||
          (t.text || '').toLowerCase().includes('fibre') ||
          (t.text || '').toLowerCase().includes('fiber') ||
          (t.text || '').toLowerCase().includes('router') ||
          (t.text || '').toLowerCase().includes('los')
      );
      const hasMpesa = bestClusterTickets.some(
        (t) =>
          t.operationalCategory === 'M-PESA' ||
          (t.category || '').includes('M-PESA') ||
          (t.text || '').toLowerCase().includes('mpesa') ||
          (t.text || '').toLowerCase().includes('paybill')
      );
      const hasData = bestClusterTickets.some(
        (t) =>
          t.operationalCategory === 'Slow Internet' ||
          t.operationalCategory === 'Coverage' ||
          (t.text || '').toLowerCase().includes('4g') ||
          (t.text || '').toLowerCase().includes('data')
      );

      const impactedServices: string[] = [];
      if (hasFibre) impactedServices.push('Home Fibre Broadband (Red LOS)');
      if (hasMpesa) impactedServices.push('M-PESA & Merchant Settlement');
      if (hasData) impactedServices.push('4G/5G Cellular Data & RAN Sectors');
      if (impactedServices.length === 0) impactedServices.push('Telecom & Network Connectivity');

      // Extract cause from triaged tickets in this cluster if available
      const ticketWithCause = bestClusterTickets.find((t) => t.issueGroupCause && t.issueGroupCause.trim());
      let rawCause = ticketWithCause?.issueGroupCause || '';

      let rootCause = `Possible cause (AI hypothesis): Concentrated incident spike in ${group.area}. Automated correlation linked ${bestClusterTickets.length} cross-channel complaints.`;

      if (rawCause) {
        if (!hasFibre) {
          rawCause = rawCause.replace(/\b(road construction|excavator|optical cut|fiber cut|fibre cut|splicing|fiber|fibre)\b/gi, 'network equipment fault');
        }
        if (!rawCause.toLowerCase().startsWith('possible cause (ai hypothesis):')) {
          rootCause = `Possible cause (AI hypothesis): ${rawCause.replace(/^possible cause \(ai hypothesis\):\s*/i, '')}`;
        } else {
          rootCause = rawCause;
        }
      } else if (hasFibre && hasMpesa) {
        rootCause = `Possible cause (AI hypothesis): Metro optical fiber backhaul fault along ${group.area} corridor, knocking out residential broadband and cascading to transmission gateways for mobile money settlements.`;
      } else if (hasFibre) {
        rootCause = `Possible cause (AI hypothesis): Distribution optical fiber feeder fault or cable attenuation along ${group.area} corridor affecting customer optical network terminals.`;
      } else if (hasMpesa) {
        rootCause = `Possible cause (AI hypothesis): Core transaction settlement callback timeout or partner merchant gateway congestion reported across ${group.area}.`;
      } else if (hasData) {
        rootCause = `Possible cause (AI hypothesis): Radio Access Network (RAN) sector congestion and microwave backhaul packet latency in ${group.area}.`;
      }

      const getCategoryShortLabel = (t: SubmissionRecord): string => {
        if (t.operationalCategory) {
          if (t.operationalCategory === 'Fibre') return 'Fibre';
          if (t.operationalCategory === 'M-PESA') return 'M-PESA';
          if (t.operationalCategory === 'Coverage') return 'Coverage';
          if (t.operationalCategory === 'Slow Internet') return 'Slow Internet';
          if (t.operationalCategory === 'Billing') return 'Billing';
          if (t.operationalCategory === 'Voice Calls') return 'Voice Calls';
          if (t.operationalCategory === 'Network Outage') return 'Network Outage';
          return t.operationalCategory;
        }
        const cat = (t.category || '').toLowerCase();
        if (cat.includes('fibre') || cat.includes('fiber')) return 'Fibre';
        if (cat.includes('m-pesa') || cat.includes('mpesa')) return 'M-PESA';
        if (cat.includes('mobile') || cat.includes('4g') || cat.includes('5g') || cat.includes('coverage')) return 'Coverage';
        if (cat.includes('sim swap') || cat.includes('fraud')) return 'SIM Swap';
        if (cat.includes('care') || cat.includes('airtime') || cat.includes('billing')) return 'Billing';
        if (cat.includes('enterprise')) return 'Enterprise';
        if (cat.includes('merchant')) return 'Merchant';
        return 'General Telecom';
      };

      const getCategoryLinkExplanation = (mainCat: string, otherCat: string, area: string): string => {
        const m = mainCat.toLowerCase();
        const o = otherCat.toLowerCase();

        if (m.includes('fibre')) {
          if (o.includes('mpesa')) {
            return `M-PESA merchant till and hospital Paybill verification timeouts triggered by upstream fixed fibre backhaul failure in ${area}.`;
          }
          if (o.includes('coverage') || o.includes('mobile') || o.includes('slow')) {
            return `Cellular BTS base stations in this ward route through the affected local fiber feeder ring, causing concurrent wireless congestion.`;
          }
          if (o.includes('billing') || o.includes('care')) {
            return `Customer service billing desks experienced concurrent complaint spikes from broadband users reporting sudden line drops.`;
          }
          if (o.includes('sim swap')) {
            return `Correlated customer visits to local retail agent shops attempting reconnection checks during the broadband outage.`;
          }
          return `Co-located transmission hardware along ${area} sharing power distribution and terminal cabinets.`;
        }

        if (m.includes('mpesa')) {
          if (o.includes('fibre')) {
            return `Broadband drops at retail agent shops and commercial premises prevented instant M-PESA API callback confirmations.`;
          }
          if (o.includes('coverage') || o.includes('mobile')) {
            return `Radio access network signal drops caused USSD session terminations while subscribers attempted mobile money transfers.`;
          }
          if (o.includes('billing') || o.includes('care')) {
            return `Surge in customer balance and transaction status inquiries caused by delayed SMS settlement delivery.`;
          }
          return `Shared core network authentication and payment gateway transactions originating from ${area}.`;
        }

        if (m.includes('coverage') || m.includes('network') || m.includes('slow')) {
          if (o.includes('mpesa')) {
            return `Subscribers attempting SIM-based M-PESA payments in ${area} experienced handset network handshake failures.`;
          }
          if (o.includes('fibre')) {
            return `Civil utility work or grid power fluctuations in ${area} disrupted both the cellular mast and local optical node.`;
          }
          if (o.includes('billing') || o.includes('care')) {
            return `Elevated query volume for airtime and data bundles while subscribers attempted re-connection.`;
          }
          return `Concurrently affected radio sector nodes and microwave links operating within the same coverage footprint.`;
        }

        return `Temporal and spatial correlation indicates shared municipal transmission infrastructure affected in ${area}.`;
      };

      const catCountMap: Record<string, number> = {};
      for (const t of bestClusterTickets) {
        const cat = getCategoryShortLabel(t);
        catCountMap[cat] = (catCountMap[cat] || 0) + 1;
      }

      const sortedCats = Object.entries(catCountMap).sort((a, b) => b[1] - a[1]);
      const mainCategory = sortedCats[0]?.[0] || 'Telecom';

      const categoryBreakdown: CategoryBreakdownItem[] = sortedCats.map(([cat, count], index) => {
        const isMain = index === 0;
        return {
          category: cat,
          count,
          isMain,
          relationBadge: !isMain ? 'Possibly related (same area and time)' : undefined,
          linkExplanation: !isMain ? getCategoryLinkExplanation(mainCategory, cat, group.area) : undefined,
        };
      });

      const categorySummaryString = sortedCats.map(([cat, count]) => `${cat} ${count}`).join(' · ');

      clusters.push({
        id: `cluster-${key}`,
        name: `${group.area} High-Density Outage Cluster`,
        location: group.location,
        area: group.area,
        totalComplaints: bestClusterTickets.length,
        tickets: bestClusterTickets,
        isPrimaryHub: false,
        status: bestClusterTickets.length >= 8 ? 'High Impact / Active Emergency' : 'In Progress · Core Gateway',
        rootCause,
        impactedServices,
        channelBreakdown,
        categoryBreakdown,
        categorySummaryString,
        actionDirectives: [
          `Emergency field technician unit dispatched to ${group.area} distribution terminal.`,
          `Transmission rerouting active; target Mean Time to Repair (MTTR): 2.0 hours.`,
          `Automated customer notification broadcasts dispatched across affected channels.`,
        ],
        earliestTime: sorted[0].createdAt,
        latestTime: sorted[sorted.length - 1].createdAt,
      });
    }
  }

  clusters.sort((a, b) => b.totalComplaints - a.totalComplaints);

  if (clusters.length > 0) {
    clusters[0].isPrimaryHub = true;
  }

  return clusters;
}
