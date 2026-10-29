import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Upload,
  Volume2,
  Copy,
  Check,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Languages,
  MapPin,
  FileAudio,
  Radio,
  Sparkles,
  Camera,
  Image as ImageIcon,
  X as XIcon,
  AlertTriangle,
} from 'lucide-react';
import {
  LanguageCode,
  DetectedLanguageLabel,
  SubmissionRecord,
} from '../types';
import { TYPEWRITER_PHRASES } from './HeaderWithTypewriter';
import { QrCodePanel } from './QrCodePanel';

interface VoiceTextCaptureHeroProps {
  activePhraseIndex: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isQrModalOpen: boolean;
  onOpenQrModal: () => void;
  onCloseQrModal: () => void;
  externalSubmissions?: SubmissionRecord[];
  onNewSubmission?: (sub: SubmissionRecord) => void;
  onOpenAdminConsole?: () => void;
}

const KENYAN_LOCATIONS = [
  'Nairobi · Westlands / CBD',
  'Nairobi · Roysambu / Kasarani',
  'Nairobi · Embakasi / Umoja',
  'Nairobi · Kibra / Langata',
  'Mombasa · Mvita / Nyali',
  'Kisumu · Kisumu Central',
  'Nakuru · Nakuru Town East',
  'Kiambu · Thika / Ruiru',
  'Uasin Gishu · Eldoret',
  'Machakos · Machakos Town',
];

const INITIAL_KENYAN_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: 'sema-101',
    referenceCode: 'SEMA-SAF-8041',
    text: 'Router ya Safaricom Home Fibre inawaka red hapa Roysambu karibu na TRM tangu jana usiku, internet imelost na kazi imesimama. Tafadhali tusaidieni kuangalia fiber cable haraka.',
    detectedLanguage: 'Kiswahili',
    englishTranslation: 'The Safaricom Home Fibre router has a blinking red LOS light here in Roysambu near TRM since last night, internet is down and remote work has stopped. Please inspect the fiber optical cable urgently.',
    category: 'Home Fibre & Fixed Internet',
    countyOrWard: 'Nairobi · Roysambu / Lumumba Drive',
    captureMethod: 'voice',
    aiCommitmentResponse: 'Tumepokea ripoti yako kuhusu mtandao wa Safaricom Home Fibre Roysambu. Timu yetu ya fiber engineering imetumwa mara moja kurekebisha line hiyo.',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'sema-102',
    referenceCode: 'SEMA-SAF-8042',
    text: 'Manze chapaa ya M-PESA imekwama kwa Paybill ya hospitali tangu asubuhi lakini message haijakam na mgonjwa hawezi release-iwa. Chanueni wasee wa M-PESA wasort hii transaction mbio!',
    detectedLanguage: 'Sheng',
    englishTranslation: 'My M-PESA money has been stuck on a hospital Paybill since morning but no confirmation SMS was received and the patient cannot be discharged. Alert M-PESA core operations to resolve this transaction urgently!',
    category: 'M-PESA & Financial Services',
    countyOrWard: 'Nairobi · Umoja / Buruburu',
    captureMethod: 'voice',
    aiCommitmentResponse: 'Rada imefika safi! M-PESA core escalations desk imepewa alert kuhusu hii transaction na wanacheck settlement records mara hii.',
    status: 'Assigned',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'sema-103',
    referenceCode: 'SEMA-SAF-8043',
    text: 'Our entire estate along Kenyatta Avenue in Nakuru CBD has experienced severe 4G and 5G network dropouts with emergency calls only on all Safaricom lines since the thunderstorm yesterday.',
    detectedLanguage: 'English',
    category: 'Mobile Network & 4G/5G Coverage',
    countyOrWard: 'Nakuru · Nakuru CBD / Biashara',
    captureMethod: 'text',
    aiCommitmentResponse: 'Thank you for reporting this network outage. Safaricom Radio Access Network (RAN) engineering has scheduled immediate BTS mast diagnostic and power restoration within 4 hours.',
    status: 'Received',
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
];

const LOCAL_SAMPLES: Record<
  string,
  { text: string; langLabel: DetectedLanguageLabel; translation?: string }
> = {
  en: {
    text: 'Hello Safaricom team, our Home Fibre link in Kilimani along Argwings Kodhek has been down with a red LOS indicator for two days. We have critical remote work meetings, please dispatch a fiber technician urgently.',
    langLabel: 'English',
  },
  sw: {
    text: 'Habari Safaricom, nilituma pesa kimakosa kupitia M-PESA kwenda namba isiyo sahihi na nikatuma ombi la reversal 456 lakini sijapata ujumbe wowote tangu asubuhi. Naomba msaada wa haraka.',
    langLabel: 'Kiswahili',
    translation: 'Hello Safaricom, I accidentally sent money via M-PESA to the wrong number and requested a reversal via 456 but have received no update since morning. Please assist urgently.',
  },
  sheng: {
    text: 'Niaje Safaricom, manze huku Kasarani network ya 4G na 5G imedrop mbaya sana, simu zote zinasoma emergency calls only na bundle haifunguki. Tuchanueni vile mnafix hii issue chapchap.',
    langLabel: 'Sheng',
    translation: 'Hi Safaricom, seriously here in Kasarani 4G and 5G network has dropped completely, all phones show emergency calls only and data bundles are inaccessible. Please let us know how you will fix this quickly.',
  },
};

// Kenyan linguistic classifier
function detectClientLanguage(rawText: string): DetectedLanguageLabel {
  const lower = rawText.toLowerCase();
  const shengWords = [
    'manze', 'rada', 'noma', 'mtaani', 'wasee', 'bazenga', 'form', 'kuom',
    'kanairo', 'chapaa', 'nduthi', 'mbogi', 'nganya', 'keja', 'morio',
    'doba', 'mavitu', 'aresa', 'buda', 'sindano', 'tuchanue', 'tutaisort',
    'imetoka', 'kupanic', 'imebeat', 'riba', 'bonga', 'chali', 'madhe'
  ];
  const swahiliWords = [
    'habari', 'jambo', 'tafadhali', 'shida', 'tatizo', 'mtandao', 'pesa',
    'laini', 'huduma', 'tunaomba', 'watu', 'mtaa', 'kadi', 'ujumbe',
    'kero', 'hasira', 'usalama', 'jirani', 'hapa', 'sana', 'kazi', 'tatua',
    'tuambie', 'mteja', 'haraka', 'fungua'
  ];

  let shengScore = 0;
  let swahiliScore = 0;

  for (const w of shengWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) shengScore += 2;
  }
  for (const w of swahiliWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) swahiliScore += 1;
  }

  if (shengScore >= 2) return 'Sheng';
  if (swahiliScore >= 1) return 'Kiswahili';
  return 'English';
}

function detectClientCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(fibre|fiber|router|los|optical|wifi|modem|red light|cable cut|slow internet)\b/i.test(lower)) {
    return 'Home Fibre & Fixed Internet';
  }
  if (/\b(mpesa|m-pesa|fuliza|send money|reversal|hakikisha|paybill|till|withdraw|statement)\b/i.test(lower)) {
    return 'M-PESA & Financial Services';
  }
  if (/\b(4g|5g|network|signal|coverage|bts|mast|tower|emergency calls|call drop|bundles|airtel|poor reception)\b/i.test(lower)) {
    return 'Mobile Network & 4G/5G Coverage';
  }
  if (/\b(sim swap|fraud|scam|tapeli|wizi|hack|phishing|line block|puk|stolen line|identity|pin)\b/i.test(lower)) {
    return 'SIM Swap, Fraud & Security';
  }
  if (/\b(airtime|bonga|bonga points|postpay|prepay|billing|subscription|skiza|tunukiwa)\b/i.test(lower)) {
    return 'Customer Care & Airtime Billing';
  }
  if (/\b(enterprise|leased line|bulk sms|dedicated|cloud|sdwan|api|host|server)\b/i.test(lower)) {
    return 'Enterprise & Cloud Solutions';
  }
  if (/\b(merchant|lipa na mpesa|buy goods|merchant till|settlement)\b/i.test(lower)) {
    return 'Lipa Na M-PESA & Merchant Services';
  }
  return 'Home Fibre & Fixed Internet';
}

function generateClientCommitment(text: string, lang: DetectedLanguageLabel, category: string): string {
  if (lang === 'Sheng') {
    return `Rada ya Safaricom imefika poa! Tumelogi hii issue ya ${category} na timu yetu ya technical engineers wamepewa alert kuisort mbio bila delay.`;
  }
  if (lang === 'Kiswahili') {
    return `Asante mteja wa Safaricom. Tumepokea ripoti yako kuhusu ${category}. Timu yetu ya kiufundi na huduma kwa wateja imejulishwa na inashughulikia hitilafu hii mara moja.`;
  }
  return `Thank you for contacting Safaricom. Your incident regarding ${category} has been logged with our Network Operations Center (NOC). A specialized field & systems team has been assigned for resolution.`;
}

export const VoiceTextCaptureHero: React.FC<VoiceTextCaptureHeroProps> = ({
  activePhraseIndex,
  textareaRef,
  isQrModalOpen,
  onOpenQrModal,
  onCloseQrModal,
  externalSubmissions,
  onNewSubmission,
  onOpenAdminConsole,
}) => {
  const [text, setText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [languageHint, setLanguageHint] = useState<LanguageCode>('auto');
  const [detectedLanguage, setDetectedLanguage] = useState<DetectedLanguageLabel | null>(null);
  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [captureMethod, setCaptureMethod] = useState<'voice' | 'text' | 'hybrid' | 'image'>('text');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<string>('');
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Recording & AI Transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 32, 24, 40, 26, 36, 22, 28]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [sampleLoadingLang, setSampleLoadingLang] = useState<string | null>(null);
  const [lastSampleAudioUrl, setLastSampleAudioUrl] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Submission states
  const [countyOrWard, setCountyOrWard] = useState(KENYAN_LOCATIONS[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<SubmissionRecord | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('sema_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_KENYAN_SUBMISSIONS;
  });
  const [submissionFilter, setSubmissionFilter] = useState<'All' | DetectedLanguageLabel>('All');
  const [copiedText, setCopiedText] = useState(false);

  // Refs for MediaRecorder, Web Audio API, and SpeechRecognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRecordingStateRef = useRef<boolean>(false);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);

  // Persistent live text refs to eliminate stale closure bugs during speech recognition
  const currentTextRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const baseTextAtRecordStartRef = useRef<string>('');
  const persistedFinalTextRef = useRef<string>('');
  const currentSessionFinalRef = useRef<string>('');
  const currentSessionInterimRef = useRef<string>('');

  const currentPhrase = TYPEWRITER_PHRASES[activePhraseIndex] || TYPEWRITER_PHRASES[0];

  // Keep refs synchronized with state
  useEffect(() => {
    currentTextRef.current = text;
  }, [text]);

  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
  }, [interimTranscript]);

  useEffect(() => {
    isRecordingStateRef.current = isRecording;
  }, [isRecording]);

  // Try fetching submissions from backend if available, fallback gracefully
  useEffect(() => {
    fetch('/api/submissions')
      .then((res) => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data && Array.isArray(data.submissions) && data.submissions.length > 0) {
          setSubmissions(data.submissions);
        }
      })
      .catch(() => {
        // Safe static fallback
      });
  }, []);

  const stopAllAudioResources = useCallback(() => {
    isRecordingStateRef.current = false;
    isRecognitionActiveRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      recognitionRef.current = null;
    }
    if (activeMediaStreamRef.current) {
      try {
        activeMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      activeMediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioLevels([20, 32, 24, 40, 26, 36, 22, 28]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudioResources();
    };
  }, [stopAllAudioResources]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudioWithGemini = async (audioBlob: Blob, mimeType: string, currentClientText: string) => {
    setIsTranscribing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          languageHint,
          clientTranscript: currentClientText,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.transcript && data.transcript.trim()) {
          const refined = data.transcript.trim();
          if (!currentClientText || refined.length >= currentClientText.length) {
            setText(refined);
            currentTextRef.current = refined;
          }
          setCaptureMethod((prev) => (prev === 'text' ? 'voice' : 'hybrid'));
        }
        if (data.detectedLanguage) {
          setDetectedLanguage(data.detectedLanguage);
        }
        if (data.englishTranslation) {
          setEnglishTranslation(data.englishTranslation);
        }
      }
    } catch {
      // Safe fallback - keep existing text intact
    } finally {
      const latest = currentTextRef.current.trim();
      if (latest) {
        setDetectedLanguage(detectClientLanguage(latest));
      }
      setIsTranscribing(false);
      setInterimTranscript('');
      interimTranscriptRef.current = '';
    }
  };

  const getRecognitionLanguages = (hint: LanguageCode): string[] => {
    const browserLang =
      typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';

    if (hint === 'sw') {
      return ['sw-KE', 'sw-TZ', 'en-KE', 'en-US'];
    }
    if (hint === 'sheng') {
      return ['en-KE', 'sw-KE', 'en-US'];
    }
    if (hint === 'en') {
      return ['en-KE', 'en-US', 'en-GB'];
    }
    // 'auto': prioritize Kenyan English / browser language / Swahili
    if (browserLang.toLowerCase().startsWith('sw')) {
      return ['sw-KE', 'sw-TZ', 'en-KE', 'en-US'];
    }
    return [browserLang, 'en-KE', 'en-US', 'sw-KE'];
  };

  // Start animated sound level visualizer without audio hardware contention
  const startVisualizerAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    const animate = () => {
      if (!isRecordingStateRef.current) return;
      const isSpeakingNow = Boolean(currentSessionInterimRef.current.trim());
      const baseHeight = isSpeakingNow ? 42 : 18;
      const variance = isSpeakingNow ? 52 : 14;

      setAudioLevels([
        baseHeight + Math.round(Math.random() * variance * 0.7),
        baseHeight + Math.round(Math.random() * variance * 1.0),
        baseHeight + Math.round(Math.random() * variance * 0.8),
        baseHeight + Math.round(Math.random() * variance * 0.95),
        baseHeight + Math.round(Math.random() * variance * 0.75),
        baseHeight + Math.round(Math.random() * variance * 0.9),
        baseHeight + Math.round(Math.random() * variance * 0.6),
        baseHeight + Math.round(Math.random() * variance * 0.8),
      ]);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Fallback for non-WebSpeech browsers (e.g. Firefox) to record audio
  // Auto-scroll textarea as live spoken words appear
  useEffect(() => {
    if (isRecording && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [isRecording, text, interimTranscript, textareaRef]);

  // Launch Chrome/Edge/Safari Web Speech Recognition with real-time text box transcription
  const launchRecognition = (candidateIndex = 0) => {
    if (!isRecordingStateRef.current) return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceNotice(
        'Recording audio... Your speech will be transcribed as soon as you tap Stop Recording.'
      );
      return;
    }

    if (isRecognitionActiveRef.current) {
      return;
    }

    const langCandidates = getRecognitionLanguages(languageHint);
    if (candidateIndex >= langCandidates.length) candidateIndex = 0;
    const chosenLang = langCandidates[candidateIndex];

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = chosenLang;

      recognition.onstart = () => {
        isRecognitionActiveRef.current = true;
        setVoiceNotice(null);
      };

      recognition.onresult = (event: any) => {
        let sFinal = '';
        let sInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          const piece = item[0]?.transcript || '';
          if (item.isFinal) {
            sFinal += (sFinal ? ' ' : '') + piece.trim();
          } else {
            sInterim += (sInterim ? ' ' : '') + piece.trim();
          }
        }

        currentSessionFinalRef.current = sFinal;
        currentSessionInterimRef.current = sInterim;

        const base = baseTextAtRecordStartRef.current.trim();
        const persisted = persistedFinalTextRef.current.trim();
        const totalFinal = [base, persisted, sFinal].filter(Boolean).join(' ').trim();

        // Immediately update state and ref so it shows live in the text box as you speak
        setText(totalFinal);
        currentTextRef.current = totalFinal;

        setInterimTranscript(sInterim);
        interimTranscriptRef.current = sInterim;

        const fullSpokenNow = [totalFinal, sInterim].filter(Boolean).join(' ').trim();
        if (fullSpokenNow) {
          setDetectedLanguage(detectClientLanguage(fullSpokenNow));
          setCaptureMethod('voice');
        }
      };

      recognition.onerror = (err: any) => {
        const errType = err?.error;

        // 'no-speech' is a natural pause by the speaker, not a failure
        if (errType === 'no-speech') {
          return;
        }

        // 'aborted' happens during intentional restart or stopping
        if (errType === 'aborted') {
          return;
        }

        console.warn('Speech recognition status:', errType, chosenLang);

        if (
          (errType === 'language-not-supported' || errType === 'bad-grammar') &&
          candidateIndex + 1 < langCandidates.length
        ) {
          isRecognitionActiveRef.current = false;
          recognition.onend = null;
          setTimeout(() => {
            if (isRecordingStateRef.current && !isRecognitionActiveRef.current) {
              launchRecognition(candidateIndex + 1);
            }
          }, 60);
          return;
        }

        if (errType === 'not-allowed') {
          setVoiceNotice(
            'Microphone access was blocked. Please tap the camera/microphone icon in your browser address bar and select "Allow".'
          );
        } else if (errType === 'network') {
          setVoiceNotice(
            'Browser speech recognition service is temporarily unavailable. Audio recording will transcribe on stop.'
          );
        } else if (errType === 'audio-capture') {
          setVoiceNotice(
            'Microphone was busy or in use by another tab or app. Please close other mic apps and try again.'
          );
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;

        // Commit current session final to persisted
        if (currentSessionFinalRef.current) {
          persistedFinalTextRef.current = [
            persistedFinalTextRef.current,
            currentSessionFinalRef.current,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();
          currentSessionFinalRef.current = '';
        }
        currentSessionInterimRef.current = '';
        setInterimTranscript('');
        interimTranscriptRef.current = '';

        // If still in recording mode, restart cleanly
        if (isRecordingStateRef.current) {
          setTimeout(() => {
            if (isRecordingStateRef.current && !isRecognitionActiveRef.current) {
              launchRecognition(candidateIndex);
            }
          }, 100);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (recErr: any) {
      isRecognitionActiveRef.current = false;
      console.warn('SpeechRecognition launch exception:', recErr);
      if (candidateIndex + 1 < langCandidates.length) {
        setTimeout(() => {
          if (isRecordingStateRef.current && !isRecognitionActiveRef.current) {
            launchRecognition(candidateIndex + 1);
          }
        }, 120);
      }
    }
  };

  const startRecording = async () => {
    setVoiceNotice(null);
    setLatestSubmission(null);

    // Save current box text as base before new speech starts
    const baseText = currentTextRef.current.trim();
    baseTextAtRecordStartRef.current = baseText;
    persistedFinalTextRef.current = '';
    currentSessionFinalRef.current = '';
    currentSessionInterimRef.current = '';

    setIsRecording(true);
    isRecordingStateRef.current = true;
    setRecordingSeconds(0);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Start sound level visualizer
    startVisualizerAnimation();

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      // 1. Direct Web Speech API: do not lock mic device with competing AudioContext
      launchRecognition(0);
    } else {
      // 2. Fallback for non-WebSpeech browsers (e.g. Firefox): record via MediaRecorder
      setVoiceNotice('Recording audio via microphone. Your words will transcribe as soon as you finish speaking.');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          activeMediaStreamRef.current = mediaStream;

          audioChunksRef.current = [];
          let selectedMimeType = 'audio/webm';
          const preferredTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg',
          ];
          for (const t of preferredTypes) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
              selectedMimeType = t;
              break;
            }
          }
          if (typeof MediaRecorder !== 'undefined') {
            const recorder = new MediaRecorder(mediaStream, { mimeType: selectedMimeType });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };
            recorder.start(250);
          }
        } catch (permErr: any) {
          console.warn('Microphone permission request error:', permErr);
          if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
            setVoiceNotice(
              'Microphone permission was denied. Please allow microphone permissions in your browser address bar to speak directly.'
            );
            setIsRecording(false);
            isRecordingStateRef.current = false;
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          }
        }
      }
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    isRecordingStateRef.current = false;
    isRecognitionActiveRef.current = false;

    // Finalize all text from ref immediately
    const base = baseTextAtRecordStartRef.current.trim();
    const persisted = persistedFinalTextRef.current.trim();
    const sFinal = currentSessionFinalRef.current.trim();
    const sInterim = currentSessionInterimRef.current.trim();
    const fullFinal = [base, persisted, sFinal, sInterim]
      .filter(Boolean)
      .join(' ')
      .trim();

    const hadSpokenSpeech = Boolean([persisted, sFinal, sInterim].filter(Boolean).join(' ').trim());

    if (fullFinal) {
      setText(fullFinal);
      currentTextRef.current = fullFinal;
      setDetectedLanguage(detectClientLanguage(fullFinal));
      setCaptureMethod('voice');
      setVoiceNotice(null);
    }
    setInterimTranscript('');
    interimTranscriptRef.current = '';

    // Snapshot current audio chunks before stopping resources
    const currentChunks = [...audioChunksRef.current];
    stopAllAudioResources();

    // If SpeechRecognition produced NO text during the recording session, but we have audio chunks:
    // automatically transcribe using Gemini API backend
    if (!hadSpokenSpeech && currentChunks.length > 0) {
      let selectedMimeType = 'audio/webm';
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      for (const t of preferredTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMimeType = t;
          break;
        }
      }
      const audioBlob = new Blob(currentChunks, { type: selectedMimeType });
      if (audioBlob.size > 500) {
        await transcribeAudioWithGemini(audioBlob, selectedMimeType.split(';')[0], base);
      } else if (!base) {
        setVoiceNotice(
          'No words were detected. Check your microphone volume, speak clearly into the mic, or click any "Try Sample Voice" button below to test.'
        );
      }
    } else if (!fullFinal) {
      setVoiceNotice(
        'No words were detected. Check your microphone volume, speak clearly into the mic, or click any "Try Sample Voice" button below to test.'
      );
    }
  };

  const compressImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to ~1 MB using high-quality JPEG compression
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageNotice(null);
    setVoiceNotice(null);

    // Limit to 3 images total
    const remainingSlots = Math.max(0, 3 - attachedImages.length);
    if (remainingSlots <= 0) {
      setImageNotice('You can upload a maximum of 3 screenshots or photos.');
      e.target.value = '';
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    try {
      setIsAnalyzingImages(true);

      // Compress images in the browser
      const compressedList = await Promise.all(selectedFiles.map(compressImageFile));
      const updatedImages = [...attachedImages, ...compressedList].slice(0, 3);
      setAttachedImages(updatedImages);
      setCaptureMethod('image');

      // Send up to 3 images to Gemini in ONE request
      const response = await fetch('/api/analyze-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedImages }),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.isReadable && data.draft) {
          // Fill problem description with draft for customer to edit and confirm
          setText(data.draft);
          currentTextRef.current = data.draft;
          if (data.language) {
            setDetectedLanguage(data.language as DetectedLanguageLabel);
          }
          if (data.translation) {
            setEnglishTranslation(data.translation);
          }
          if (data.likelyIssue) {
            setImageAnalysis(data.likelyIssue);
          }
          setImageNotice(null);
        } else {
          // Ask customer to describe the problem if unreadable or unrelated
          setImageNotice(
            'We could not clearly detect a telecom or service issue from this image. Please describe the problem in the text box below.'
          );
        }
      } else {
        setImageNotice(
          'Image attached successfully. Please describe your problem in the text box below.'
        );
      }
    } catch (err) {
      console.warn('Image analysis notice:', err);
      // Never block submit if AI fails
      setImageNotice(
        'Image attached. Please enter or confirm your problem description in the box below.'
      );
    } finally {
      setIsAnalyzingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setAttachedImages((prev) => {
      const next = prev.filter((_, i) => i !== indexToRemove);
      if (next.length === 0) {
        setImageAnalysis('');
        setImageNotice(null);
        if (captureMethod === 'image') {
          setCaptureMethod('text');
        }
      }
      return next;
    });
  };

  // Stream text directly into the textarea for sample voice simulation
  const handleRunSampleVoice = async (sampleLang: 'en' | 'sw' | 'sheng') => {
    setSampleLoadingLang(sampleLang);
    setVoiceNotice(null);
    setLatestSubmission(null);

    const chosenSample = LOCAL_SAMPLES[sampleLang] || LOCAL_SAMPLES.sheng;

    // Try fetching from backend first if available
    try {
      const response = await fetch('/api/sample-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: sampleLang }),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.audioBase64) {
          const audioDataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
          setLastSampleAudioUrl(audioDataUrl);
          try {
            const audio = new Audio(audioDataUrl);
            audio.play().catch(() => {});
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // Offline/GitHub Pages fallback: synthesize speech via SpeechSynthesis if available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(chosenSample.text);
          utterance.lang = sampleLang === 'sw' ? 'sw' : 'en-US';
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore
        }
      }
    }

    const fullTranscript = chosenSample.text;
    setDetectedLanguage(chosenSample.langLabel);
    setEnglishTranslation(chosenSample.translation || '');
    setCaptureMethod('voice');

    setText('');
    currentTextRef.current = '';
    const words = fullTranscript.split(' ');
    let currentIndex = 0;
    const streamTimer = setInterval(() => {
      currentIndex += 1;
      const partial = words.slice(0, currentIndex).join(' ');
      setText(partial);
      currentTextRef.current = partial;
      if (currentIndex >= words.length) {
        clearInterval(streamTimer);
      }
    }, 45);

    setSampleLoadingLang(null);
  };

  const handleTransformText = async (targetMode: 'polish' | 'to_en' | 'to_sw' | 'to_sheng') => {
    if (!text.trim()) {
      setVoiceNotice('Please speak or type your issue in the box first.');
      return;
    }
    setIsTransforming(true);
    setVoiceNotice(null);

    const input = text.trim();
    let transformedResult = input;

    try {
      const response = await fetch('/api/transform-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, targetMode }),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.transformedText) {
          transformedResult = data.transformedText;
        }
      } else {
        throw new Error('Static fallback');
      }
    } catch {
      // Client-side transform fallback for GitHub Pages
      if (targetMode === 'to_en') {
        transformedResult = `[Report in English]: ${input} (Please dispatch field officer for resolution)`;
      } else if (targetMode === 'to_sw') {
        transformedResult = `[Ripoti kwa Kiswahili]: Habari SEMA, ${input}. Tunaomba msaada wa haraka.`;
      } else if (targetMode === 'to_sheng') {
        transformedResult = `[Rada kwa Sheng]: Niaje SEMA, manze ${input}. Chanueni wasee waisort haraka.`;
      }
    }

    setText(transformedResult);
    if (targetMode === 'to_en') setDetectedLanguage('English');
    if (targetMode === 'to_sw') setDetectedLanguage('Kiswahili');
    if (targetMode === 'to_sheng') setDetectedLanguage('Sheng');
    setIsTransforming(false);
  };

  const handleCopyText = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const problemContent = (text + (interimTranscript ? ` ${interimTranscript}` : '')).trim();

    if (!problemContent) {
      setVoiceNotice('Please speak into the microphone or type your problem before submitting.');
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setVoiceNotice(null);

    const detectedLang = detectClientLanguage(problemContent);
    const category = detectClientCategory(problemContent);
    const randomTicket = Math.floor(1000 + Math.random() * 9000);

    const finalCaptureMethod = attachedImages.length > 0 ? 'image' : captureMethod;

    let finalRecord: SubmissionRecord = {
      id: `sema-${Date.now()}`,
      referenceCode: `SEMA-KE-${randomTicket}`,
      text: problemContent,
      detectedLanguage: detectedLang,
      englishTranslation: detectedLang !== 'English' ? `Report translation: ${problemContent}` : undefined,
      category,
      countyOrWard: countyOrWard.trim() || 'Kenya (General)',
      contactInfo: contactInfo.trim() || undefined,
      captureMethod: finalCaptureMethod,
      attachedImages: attachedImages.length > 0 ? [...attachedImages] : undefined,
      imageAnalysis: imageAnalysis || undefined,
      aiCommitmentResponse: generateClientCommitment(problemContent, detectedLang, category),
      status: 'Received',
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: problemContent,
          countyOrWard,
          contactInfo,
          captureMethod: finalCaptureMethod,
          attachedImages: attachedImages.length > 0 ? attachedImages : undefined,
          imageAnalysis: imageAnalysis || undefined,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.submission) {
          finalRecord = data.submission;
        }
      }
    } catch {
      // Handled via finalRecord static fallback
    }

    setLatestSubmission(finalRecord);
    if (onNewSubmission) {
      onNewSubmission(finalRecord);
    }
    setSubmissions((prev) => {
      const updated = [finalRecord, ...prev];
      try {
        localStorage.setItem('sema_submissions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setDetectedLanguage(finalRecord.detectedLanguage);
    if (finalRecord.englishTranslation) {
      setEnglishTranslation(finalRecord.englishTranslation);
    }

    // Reset attached images and notices after submission
    setAttachedImages([]);
    setImageAnalysis('');
    setImageNotice(null);

    setIsSubmitting(false);
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const activeSubmissionsList =
    externalSubmissions && externalSubmissions.length > 0 ? externalSubmissions : submissions;

  const filteredSubmissions =
    submissionFilter === 'All'
      ? activeSubmissionsList
      : activeSubmissionsList.filter((s) => s.detectedLanguage === submissionFilter);

  const displayedBoxValue = interimTranscript
    ? `${text}${text ? ' ' : ''}${interimTranscript}`
    : text;

  return (
    <main id="customer-portal" className="max-w-[1280px] mx-auto px-6 py-8 space-y-12 scroll-mt-20">
      {/* Primary Hero Split: Voice & Text Box (8 cols) + QR Code Panel (4 cols) */}
      <section
        id="voice-capture"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch scroll-mt-20"
      >
        {/* Dominant Focal Anchor: Voice & Text Capture Box */}
        <div className="lg:col-span-8 bg-white border border-emerald-950/15 rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
          <div className="space-y-5">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  SEMA Voice &amp; Text Capture Box
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Speak in English, Kiswahili, or Sheng — your words transcribe directly into the text box
                </p>
              </div>

              {/* Language Capture Filter Controls */}
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
                role="group"
                aria-label="Transcription language mode"
              >
                {(
                  [
                    { id: 'auto', label: 'Auto-Detect' },
                    { id: 'en', label: 'English' },
                    { id: 'sw', label: 'Kiswahili' },
                    { id: 'sheng', label: 'Sheng' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLanguageHint(mode.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      languageHint === mode.id
                        ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Voice Recording Bar + Sample Voice Triggers */}
            <div className="bg-emerald-50/70 border border-emerald-900/12 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isTranscribing}
                    className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Tap to Speak (Mic)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording ({formatSeconds(recordingSeconds)})</span>
                  </button>
                )}

                {/* Upload Screenshot or Photo Button */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isRecording || isTranscribing || isAnalyzingImages || attachedImages.length >= 3}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-950 bg-white hover:bg-emerald-100/70 border border-emerald-900/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  title="Upload up to 3 screenshots or photos (JPG, PNG, WEBP)"
                >
                  {isAnalyzingImages ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>Upload a screenshot or photo</span>
                </button>
              </div>

              {/* Live Audio Level Visualizer or Sample Voice Simulator */}
              {isRecording ? (
                <div className="flex items-center gap-3 px-3.5 py-2 bg-white rounded-lg border border-emerald-300 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    <span className="text-xs font-bold">Listening Live</span>
                  </div>
                  <div className="flex items-end gap-1 h-5" aria-hidden="true">
                    {audioLevels.map((lvl, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{
                          height: '20px',
                          transform: `scaleY(${Math.max(0.2, lvl / 100)})`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-emerald-900 font-mono tabular-nums">
                    {formatSeconds(recordingSeconds)}
                  </span>
                </div>
              ) : isTranscribing ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3.5 py-2 rounded-lg border border-emerald-200">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Transcribing voice...</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-emerald-950/70 font-medium mr-1">
                    Try Sample Voice:
                  </span>
                  {(
                    [
                      { code: 'en', label: 'English' },
                      { code: 'sw', label: 'Kiswahili' },
                      { code: 'sheng', label: 'Sheng' },
                    ] as const
                  ).map((sample) => (
                    <button
                      key={sample.code}
                      type="button"
                      disabled={sampleLoadingLang !== null}
                      onClick={() => handleRunSampleVoice(sample.code)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-800/15 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {sampleLoadingLang === sample.code ? (
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-emerald-700" />
                      )}
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Screenshots / Photos Gallery & Privacy Note */}
            {attachedImages.length > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-900/15 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Attached Evidence ({attachedImages.length}/3 photos)</span>
                  </span>
                  {attachedImages.length < 3 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-2xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      + Add another photo
                    </button>
                  )}
                </div>

                {/* Thumbnails with remove button */}
                <div className="flex flex-wrap items-center gap-3">
                  {attachedImages.map((imgSrc, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={imgSrc}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-600/40 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                        title="Remove image"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/60 rounded text-[9px] font-mono text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Privacy Warning Note (Required) */}
                <p className="text-2xs text-amber-900 font-semibold bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Do not include PINs, ID numbers or full M-PESA messages.</span>
                </p>

                {isAnalyzingImages && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 p-2.5 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
                    <span>Gemini AI is reading screenshot text &amp; drafting your problem description...</span>
                  </div>
                )}

                {imageAnalysis && !isAnalyzingImages && (
                  <div className="p-2.5 bg-white border border-emerald-300 rounded-lg text-xs space-y-0.5">
                    <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Likely Issue (AI Diagnosis):</span>
                    </span>
                    <p className="text-slate-800 font-semibold">{imageAnalysis}</p>
                    <p className="text-2xs text-slate-500">Draft complaint loaded into the box below. Please edit and confirm before submitting.</p>
                  </div>
                )}
              </div>
            )}

            {imageNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{imageNotice}</span>
              </div>
            )}

            {/* Direct Text Box (Textarea) */}
            <div className="relative">
              {isRecording && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2 mb-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-950 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span>Real-Time Voice Transcription Active: Speak now — words appear directly in the box</span>
                  </div>
                  <span className="font-mono text-emerald-800 text-[11px] font-bold">LIVE MIC ON</span>
                </div>
              )}
              <label htmlFor="sema-main-textbox" className="sr-only">
                Tell us the problem in English, Kiswahili, or Sheng
              </label>
              <textarea
                id="sema-main-textbox"
                ref={textareaRef}
                rows={6}
                value={displayedBoxValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setText(val);
                  currentTextRef.current = val;
                  setInterimTranscript('');
                  interimTranscriptRef.current = '';
                  setCaptureMethod((prev) => (prev === 'voice' ? 'hybrid' : 'text'));
                  setDetectedLanguage(detectClientLanguage(val));
                }}
                placeholder={
                  isRecording
                    ? 'Listening... speak clearly and your words will transcribe right here in real time'
                    : currentPhrase.placeholder
                }
                className="w-full p-4 text-base text-slate-900 bg-white border-2 border-emerald-800/20 focus:border-emerald-700 rounded-xl focus:outline-none leading-relaxed placeholder:text-slate-400 resize-y transition-colors"
              />

              {/* Bottom Bar inside/below Textarea */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono tabular-nums">
                    {displayedBoxValue.trim().length} characters
                  </span>
                  {detectedLanguage && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-emerald-800">
                        Language: {detectedLanguage}
                      </span>
                    </>
                  )}
                  {isRecording && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        Speaking live into box...
                      </span>
                    </>
                  )}
                  {lastSampleAudioUrl && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          const audio = new Audio(lastSampleAudioUrl);
                          audio.play().catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-emerald-800 hover:underline font-medium cursor-pointer"
                      >
                        <FileAudio className="w-3.5 h-3.5" />
                        <span>Replay Audio</span>
                      </button>
                    </>
                  )}
                </div>

                {/* AI Language Transform & Box Controls */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-slate-400 mr-1">
                    <Languages className="w-3.5 h-3.5" />
                    <span>Convert:</span>
                  </span>
                  <button
                    type="button"
                    disabled={isTransforming || !displayedBoxValue.trim()}
                    onClick={() => handleTransformText('to_en')}
                    className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    English
                  </button>
                  <button
                    type="button"
                    disabled={isTransforming || !displayedBoxValue.trim()}
                    onClick={() => handleTransformText('to_sw')}
                    className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Kiswahili
                  </button>
                  <button
                    type="button"
                    disabled={isTransforming || !displayedBoxValue.trim()}
                    onClick={() => handleTransformText('to_sheng')}
                    className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Sheng
                  </button>
                  <button
                    type="button"
                    disabled={!displayedBoxValue.trim()}
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                    title="Copy text"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedText ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!displayedBoxValue.trim()}
                    onClick={() => {
                      setText('');
                      setInterimTranscript('');
                      setDetectedLanguage(null);
                      setEnglishTranslation('');
                      setLatestSubmission(null);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                    title="Clear text box"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Translation preview if available */}
            {englishTranslation && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-emerald-900">
                  English Translation ({detectedLanguage} → English):
                </p>
                <p className="leading-relaxed">{englishTranslation}</p>
              </div>
            )}

            {/* Helper Notice if needed */}
            {voiceNotice && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                <span>{voiceNotice}</span>
              </div>
            )}
          </div>

          {/* Submission Form Bar: County/Ward + Contact + Primary Submit Button */}
          <form
            onSubmit={handleSubmitReport}
            className="pt-4 border-t border-slate-100 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sema-location-select"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  County / Ward Location in Kenya
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="sema-location-select"
                    value={countyOrWard}
                    onChange={(e) => setCountyOrWard(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  >
                    {KENYAN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sema-contact-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Phone or Email for Resolution Updates (Optional)
                </label>
                <input
                  id="sema-contact-input"
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g., 0712 345 678 or citizen@email.co.ke"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Direct dispatch to SEMA Kenya rapid response teams · Free of charge
              </p>

              <button
                type="submit"
                disabled={isSubmitting || isTranscribing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging Issue with SEMA...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{currentPhrase.ctaLabel}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Instant Resolution Confirmation Banner */}
          {latestSubmission && (
            <div
              className="bg-emerald-50 border border-emerald-700/25 rounded-xl p-4 space-y-2"
              role="status"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Report Logged · Ticket {latestSubmission.referenceCode}</span>
                </div>
                <div className="text-xs text-emerald-900 font-medium">
                  <span>{latestSubmission.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{latestSubmission.detectedLanguage}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                {latestSubmission.aiCommitmentResponse}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Scannable QR Code Panel leading to the Landing Page */}
        <div className="lg:col-span-4 flex">
          <div className="w-full flex flex-col justify-between">
            <QrCodePanel
              isModalOpen={isQrModalOpen}
              onOpenModal={onOpenQrModal}
              onCloseModal={onCloseQrModal}
            />
          </div>
        </div>
      </section>
    </main>
  );
};
