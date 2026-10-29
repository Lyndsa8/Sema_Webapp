import { CitizenSentiment, PriorityLevel, SentimentAnalysis, SubmissionRecord } from '../types';

// High frustration / anxiety keywords in Kiswahili, Sheng, and English for Safaricom Customer & Network Incidents
const HIGH_TENSION_KEYWORDS_EN = [
  'urgent',
  'emergency',
  'danger',
  'dangerous',
  'sim swap',
  'unauthorized sim',
  'fraud',
  'scam',
  'hacked',
  'stolen line',
  'money stuck',
  'm-pesa stuck',
  'reversal',
  'hospital bill',
  'cannot pay',
  'till locked',
  'paybill failed',
  'fiber cut',
  'los blinking red',
  'red light',
  'furious',
  'frustrated',
  'unacceptable',
  'negligence',
  'disaster',
  'crisis',
  'terrible',
  'immediately',
  'cannot wait',
  'days now',
  'still no network',
  'outage',
  'blackout',
  'exam cancelled',
  'remote work blocked',
];

const HIGH_TENSION_KEYWORDS_SW = [
  'hatari',
  'dharura',
  'haraka',
  'sim swap bila idhini',
  'pesa zimekwama',
  'pesa zimepotea',
  'm-pesa haifanyi',
  'tapeli',
  'wizi',
  'line imefungwa',
  'tumechoka',
  'tangu jana',
  'tangu juzi',
  'hakuna mtandao',
  'kero',
  'hasira',
  'mtusaidie haraka',
  'uharibifu',
  'shida kubwa',
  'hospitalini',
  'hali mbaya',
  'internet imepotea',
  'fiber imekatika',
  'router inawaka red',
];

const HIGH_TENSION_KEYWORDS_SHENG = [
  'noma',
  'kimeumana',
  'manze',
  'chapaa imelost',
  'chapaa imekwama',
  'm-pesa imegoma',
  'wameniosha',
  'line imeibiwa',
  'sim card imeblockiwa',
  'fibre imedie',
  'router inawaka red',
  'imelost',
  'imeharibika vibaya',
  'four days',
  'days sasa',
  'chanueni',
  'mbio',
  'madharau',
  'inaboo',
  'tunateseka',
  'rada imechafuka',
];

/**
 * Evaluates citizen text and urgency to determine emotional sentiment and tension levels.
 */
export function analyzeCitizenSentiment(
  text: string,
  urgency?: PriorityLevel
): SentimentAnalysis {
  if (!text || typeof text !== 'string') {
    return {
      sentiment: 'Neutral',
      tensionLevel: 'Standard',
      frustrationScore: 20,
      isHighTension: false,
      tensionFactors: ['Standard inquiry'],
      tensionNotes: 'Routine civic notification with neutral sentiment.',
    };
  }

  const lower = text.toLowerCase();
  const tensionFactors: string[] = [];
  let score = 25; // baseline

  // Check English keywords
  for (const kw of HIGH_TENSION_KEYWORDS_EN) {
    if (lower.includes(kw)) {
      score += 15;
      if (['fire', 'sparking', 'danger', 'hazard', 'emergency'].includes(kw)) {
        tensionFactors.push('Life or infrastructure hazard identified');
        score += 20;
      }
      if (['days now', 'still no', 'unacceptable', 'negligence', 'furious'].includes(kw)) {
        tensionFactors.push('Prolonged civic disruption with deep frustration');
        score += 15;
      }
    }
  }

  // Check Kiswahili keywords
  for (const kw of HIGH_TENSION_KEYWORDS_SW) {
    if (lower.includes(kw)) {
      score += 15;
      if (['hatari', 'cheche', 'moto', 'dharura'].includes(kw)) {
        tensionFactors.push('Hatari kubwa ya usalama au moto (Immediate safety/fire risk)');
        score += 20;
      }
      if (['tumechoka', 'tangu jana', 'tangu juzi', 'mtusaidie haraka'].includes(kw)) {
        tensionFactors.push('Muda mrefu bila huduma / kero kubwa (Prolonged outage grievance)');
        score += 15;
      }
    }
  }

  // Check Sheng keywords
  for (const kw of HIGH_TENSION_KEYWORDS_SHENG) {
    if (lower.includes(kw)) {
      score += 15;
      if (['noma', 'kimeumana', 'wasee wanakufa', 'bomba zimepasuka'].includes(kw)) {
        tensionFactors.push('Critical ground distress expressed in Sheng');
        score += 15;
      }
      if (['tunateseka', 'inaboo', 'days sasa', 'imelost'].includes(kw)) {
        tensionFactors.push('Multiple days of public service blackout');
        score += 15;
      }
    }
  }

  // Punctuation and capitalization signals (! and caps)
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount >= 2) {
    score += 10;
    tensionFactors.push('High emotional urgency in punctuation');
  }

  // Urgency elevation
  if (urgency === 'Urgent') {
    score += 25;
    tensionFactors.push('Priority level classified as Urgent');
  } else if (urgency === 'High') {
    score += 15;
  }

  // Cap score between 10 and 98
  const frustrationScore = Math.min(Math.max(score, 10), 98);

  // Determine sentiment category
  let sentiment: CitizenSentiment = 'Neutral';
  if (frustrationScore >= 80) {
    sentiment = lower.includes('hatari') || lower.includes('danger') || lower.includes('sparking')
      ? 'Distressed'
      : 'Frustrated';
  } else if (frustrationScore >= 60) {
    sentiment = urgency === 'Urgent' || urgency === 'High' ? 'Urgent' : 'Frustrated';
  } else if (lower.includes('please') || lower.includes('tafadhali') || lower.includes('thank')) {
    sentiment = 'Constructive';
  }

  const isHighTension = frustrationScore >= 70 || urgency === 'Urgent';
  const tensionLevel = isHighTension ? 'High' : frustrationScore >= 45 ? 'Elevated' : 'Standard';

  // Fallback factor if empty
  if (tensionFactors.length === 0) {
    tensionFactors.push(isHighTension ? 'High priority public alert' : 'Factual reporting tone');
  }

  // Unique factors
  const uniqueFactors = Array.from(new Set(tensionFactors));

  const tensionNotes = isHighTension
    ? `Flagged High Tension (${frustrationScore}/100): ${uniqueFactors.slice(0, 2).join('; ')}.`
    : `Standard incident tension (${frustrationScore}/100). Reporting tone is manageable.`;

  return {
    sentiment,
    tensionLevel,
    frustrationScore,
    isHighTension,
    tensionFactors: uniqueFactors,
    tensionNotes,
  };
}

/**
 * Checks whether a given submission should display the 'High Tension' alert badge.
 */
export function isReportHighTension(report: Partial<SubmissionRecord>): boolean {
  if (report.isHighTension !== undefined) {
    return report.isHighTension;
  }
  if (report.aiClassification?.isHighTension !== undefined) {
    return report.aiClassification.isHighTension;
  }
  if (report.priority === 'Urgent') {
    return true;
  }
  if (report.text) {
    const analysis = analyzeCitizenSentiment(report.text, report.priority);
    return analysis.isHighTension;
  }
  return false;
}
