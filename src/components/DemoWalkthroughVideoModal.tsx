import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  X,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ShieldAlert,
  Layers,
  FileText,
  Mic,
  QrCode,
  Mail,
  Zap,
  Film,
  Sliders,
} from 'lucide-react';

interface DemoWalkthroughVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Scene {
  id: number;
  title: string;
  badge: string;
  startSec: number;
  endSec: number;
  narration: string;
  uiView:
    | 'portal_header'
    | 'portal_mic'
    | 'portal_translation'
    | 'portal_submit'
    | 'portal_qr'
    | 'admin_triage'
    | 'admin_audit';
}

const TOTAL_DURATION_SEC = 75; // 1 min 15 seconds

const DEMO_SCENES: Scene[] = [
  {
    id: 1,
    title: 'Customer Portal & Multilingual Typewriter',
    badge: 'Customer Portal · 0:00 - 0:11',
    startSec: 0,
    endSec: 11,
    narration:
      'Welcome to Safaricom SEMA, the intelligent citizen incident reporting and NOC response platform. When a customer opens the portal, they are greeted in English, Kiswahili, or Sheng with zero login barriers.',
    uiView: 'portal_header',
  },
  {
    id: 2,
    title: 'Voice Recording & Audio Waveform',
    badge: 'Voice Capture · 0:11 - 0:24',
    startSec: 11,
    endSec: 24,
    narration:
      'With one tap on the microphone, the citizen speaks naturally. Our continuous Speech Recognition engine transcribes every word in real time directly into the text box, accompanied by a dynamic frequency audio visualizer.',
    uiView: 'portal_mic',
  },
  {
    id: 3,
    title: 'Sheng Dialect Detection & AI Translation',
    badge: 'AI Intelligence · 0:24 - 0:36',
    startSec: 24,
    endSec: 36,
    narration:
      'The built-in Kenyan linguistic engine instantly detects the dialect, normalizes colloquial Sheng terms, and offers one-click translation into professional English and Swahili for technical clarity.',
    uiView: 'portal_translation',
  },
  {
    id: 4,
    title: 'Incident Reference Code & SLA Commitment',
    badge: 'Submission · 0:36 - 0:48',
    startSec: 36,
    endSec: 48,
    narration:
      'The citizen clicks submit and immediately receives an official tracking reference code, priority classification, and a localized commitment message assuring them field engineers are mobilized.',
    uiView: 'portal_submit',
  },
  {
    id: 5,
    title: 'Mobile QR Code Portal Deep-Linking',
    badge: 'Mobile Access · 0:48 - 0:58',
    startSec: 48,
    endSec: 58,
    narration:
      'On posters, bills, or router packages, the scannable QR code provides direct mobile access, automatically routing smartphone cameras straight into the customer reporting flow without admin delays.',
    uiView: 'portal_qr',
  },
  {
    id: 6,
    title: 'Safaricom NOC Command & Email Routing',
    badge: 'NOC Command · 0:58 - 1:10',
    startSec: 58,
    endSec: 70,
    narration:
      'Behind the scenes, NOC controllers access the dispatch console. High-tension sentiment and critical outages are flagged in red. With one click, AI Auto-Assign routes tickets and dispatches automated email alerts to field engineers.',
    uiView: 'admin_triage',
  },
  {
    id: 7,
    title: 'Audit Trails & Downloadable Documentation',
    badge: 'Audit & Docs · 1:10 - 1:15',
    startSec: 70,
    endSec: 75,
    narration:
      'Complete with audit trails, SLA tracking, and downloadable technical documentation, Safaricom SEMA transforms customer feedback into rapid field engineering action.',
    uiView: 'admin_audit',
  },
];

export const DemoWalkthroughVideoModal: React.FC<DemoWalkthroughVideoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'interactive'>('video');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpokenSceneRef = useRef<number | null>(null);

  // Active scene lookup
  const activeSceneIndex = DEMO_SCENES.findIndex(
    (s) => currentTime >= s.startSec && currentTime < s.endSec
  );
  const activeScene = activeSceneIndex !== -1 ? DEMO_SCENES[activeSceneIndex] : DEMO_SCENES[0];

  // AI Voiceover synthesis via Web Speech API (for Interactive simulation mode)
  const speakSceneNarration = useCallback(
    (scene: Scene) => {
      if (isMuted || viewMode === 'video') return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scene.narration);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.includes('en-GB') ||
              v.lang.includes('en-KE') ||
              v.lang.includes('en-US')
          ) || voices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    },
    [isMuted, viewMode]
  );

  // Interactive mode simulation clock
  useEffect(() => {
    if (!isOpen || !isPlaying || viewMode !== 'interactive') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= TOTAL_DURATION_SEC) {
          setIsPlaying(false);
          return TOTAL_DURATION_SEC;
        }
        return prev + 0.25;
      });
    }, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, viewMode]);

  // Trigger speech on scene transition in interactive mode
  useEffect(() => {
    if (!isOpen || !isPlaying || viewMode !== 'interactive') return;

    if (lastSpokenSceneRef.current !== activeScene.id) {
      lastSpokenSceneRef.current = activeScene.id;
      speakSceneNarration(activeScene);
    }
  }, [isOpen, isPlaying, activeScene, speakSceneNarration, viewMode]);

  // Clean up when closing
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      lastSpokenSceneRef.current = null;
    } else {
      setIsPlaying(true);
      setCurrentTime(0);
      if (videoPlayerRef.current) {
        videoPlayerRef.current.currentTime = 0;
        videoPlayerRef.current.play().catch(() => {});
      }
    }
  }, [isOpen]);

  const handleSeekVideo = (seconds: number) => {
    setCurrentTime(seconds);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = seconds;
      videoPlayerRef.current.play().catch(() => {});
    }
    if (viewMode === 'interactive') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      lastSpokenSceneRef.current = null;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-video-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full h-[94vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Top Header Bar */}
        <header className="px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  SAFARICOM SEMA
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                  01:15 DEMO WALKTHROUGH
                </span>
              </div>
              <h2 id="demo-video-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                Complete End-to-End Walkthrough Video (Customer Portal to NOC Admin)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('video')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  viewMode === 'video'
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>HD Video</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  viewMode === 'interactive'
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Scenes</span>
              </button>
            </div>

            {/* Direct Video Download Buttons */}
            <a
              href="/Safaricom-SEMA-75s-Demo-Walkthrough.mp4"
              download="Safaricom-SEMA-75s-Demo-Walkthrough.mp4"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Download 75s Demo Walkthrough MP4 video"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4 (75s)</span>
            </a>

            <a
              href="/Safaricom-SEMA-75s-Demo-Walkthrough.webm"
              download="Safaricom-SEMA-75s-Demo-Walkthrough.webm"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg transition-colors cursor-pointer"
              title="Download WebM version"
            >
              <span>.WebM</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              aria-label="Close demo video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col p-3 sm:p-5">
          {/* HD VIDEO PLAYER TAB (Primary View) */}
          {viewMode === 'video' ? (
            <div className="flex-1 flex flex-col justify-between gap-3 overflow-hidden">
              {/* Native Video Player with Full Screen Controls & Real Recorded Audio/Video */}
              <div className="flex-1 relative rounded-xl border border-slate-800 bg-black overflow-hidden flex items-center justify-center shadow-2xl">
                <video
                  ref={videoPlayerRef}
                  controls
                  autoPlay
                  playsInline
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  className="w-full h-full max-h-[620px] object-contain rounded-xl"
                  poster="/sema_tech_stack.jpg"
                >
                  <source src="/Safaricom-SEMA-75s-Demo-Walkthrough.mp4" type="video/mp4" />
                  <source src="/Safaricom-SEMA-75s-Demo-Walkthrough.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Synchronized Chapter Jump Rail */}
              <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Jump to Video Chapter (75s Walkthrough):</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    {formatTime(currentTime)} / 01:15
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {DEMO_SCENES.map((scene) => {
                    const isCurrent =
                      currentTime >= scene.startSec && currentTime < scene.endSec;
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        onClick={() => handleSeekVideo(scene.startSec)}
                        className={`text-left p-2 rounded-lg border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                          <span className={isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            Ch.{scene.id}
                          </span>
                          <span className="text-emerald-500">{formatTime(scene.startSec)}</span>
                        </div>
                        <p className="text-[11px] font-medium leading-tight truncate">
                          {scene.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* INTERACTIVE SCENE SIMULATION TAB */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Scene Progress Indicators */}
              <div className="grid grid-cols-7 gap-1.5 mb-3 shrink-0">
                {DEMO_SCENES.map((scene) => {
                  const isPassed = currentTime >= scene.endSec;
                  const isCurrent =
                    currentTime >= scene.startSec && currentTime < scene.endSec;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => handleSeekVideo(scene.startSec)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        isPassed
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-slate-800'
                      }`}
                      title={`${scene.id}. ${scene.title}`}
                    />
                  );
                })}
              </div>

              {/* Simulated Web Application Viewport */}
              <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden flex flex-col relative">
                {/* Simulated Browser Address Bar */}
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div className="flex-1 max-w-md mx-auto bg-slate-900 px-3 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-emerald-400 truncate text-center">
                    https://safaricom.co.ke/sema
                    {activeScene.uiView.startsWith('admin') ? '#admin' : '#customer-portal'}
                  </div>

                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Scene {activeScene.id} of 7</span>
                  </div>
                </div>

                {/* Stage Canvas */}
                <div className="flex-1 p-5 sm:p-7 overflow-y-auto flex flex-col justify-center items-center">
                  {/* SCENE 1 */}
                  {activeScene.uiView === 'portal_header' && (
                    <div className="w-full max-w-2xl space-y-5 text-center animate-fade-in">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-700/60">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Safaricom SEMA · Customer Portal Launch</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        &ldquo;Tell Safaricom the problem and we will fix it.&rdquo;
                      </h3>
                      <p className="text-sm text-slate-300">
                        Instant voice and text reporting in English, Kiswahili Sanifu, and Kenyan Sheng across all 47 counties.
                      </p>
                      <div className="flex justify-center gap-3 pt-2 text-xs font-mono">
                        <span className="px-3 py-1 bg-emerald-950 rounded border border-emerald-800 text-emerald-400">
                          English
                        </span>
                        <span className="px-3 py-1 bg-emerald-950 rounded border border-emerald-800 text-emerald-400">
                          Kiswahili
                        </span>
                        <span className="px-3 py-1 bg-emerald-950 rounded border border-emerald-800 text-emerald-400">
                          Sheng
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SCENE 2 */}
                  {activeScene.uiView === 'portal_mic' && (
                    <div className="w-full max-w-2xl space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          Streaming Citizen Microphone Input...
                        </span>
                        <span className="font-mono text-slate-400">44.1 kHz · Web Audio API</span>
                      </div>

                      <div className="h-16 bg-slate-950 rounded-xl border border-emerald-800 flex items-center justify-center gap-1.5 px-4 overflow-hidden">
                        {[40, 75, 90, 60, 30, 85, 95, 65, 45, 80, 100, 70, 50, 85, 60, 90, 40, 65, 80, 55].map(
                          (h, idx) => (
                            <div
                              key={idx}
                              className="w-2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full transition-all duration-150 animate-pulse"
                              style={{ height: `${h}%` }}
                            />
                          )
                        )}
                      </div>

                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-sm text-white font-medium italic">
                          &ldquo;Sema Safaricom, router yangu ya Home Fibre inawaka tu red hapa Roysambu tangu jana...&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SCENE 3 */}
                  {activeScene.uiView === 'portal_translation' && (
                    <div className="w-full max-w-2xl space-y-3.5 animate-fade-in">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kenyan Linguistic AI Engine · Sheng Dialect Detected (Confidence: 97%)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase">Colloquial Sheng Input</span>
                          <p className="text-white font-medium">
                            &ldquo;Neti ya Keja imekatika na router inableed red, nimekwama na job.&rdquo;
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-950/70 rounded-xl border border-emerald-800 space-y-1">
                          <span className="font-mono text-[10px] text-emerald-400 uppercase">Swahili / English Normalized</span>
                          <p className="text-emerald-200 font-medium">
                            &ldquo;Huduma ya mtandao wa Home Fibre haifanyi kazi; taa nyekundu ya LOS inawaka. Mteja anafanya kazi nyumbani.&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCENE 4 */}
                  {activeScene.uiView === 'portal_submit' && (
                    <div className="w-full max-w-lg bg-slate-950 p-6 rounded-2xl border border-emerald-700/80 space-y-4 text-center shadow-xl animate-scale-up">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Incident Successfully Logged</h4>
                        <p className="text-xs text-slate-400">Dispatched directly to the regional engineering queue</p>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-left space-y-1.5">
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Tracking Reference:</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">SEMA-SAF-8041</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Assigned Response Team:</span>
                          <span className="text-white font-medium">Safaricom Home Fibre NOC</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Lead Field Engineer:</span>
                          <span className="text-white font-medium">Eng. Dennis Kiprono</span>
                        </div>
                      </div>

                      <div className="bg-emerald-950/70 p-3 rounded-lg border border-emerald-800 text-xs text-emerald-200">
                        <strong>SEMA Commitment: </strong>
                        Tumepokea ripoti yako kuhusu mtandao wa Home Fibre Roysambu. Timu ya fiber engineering imetumwa mara moja.
                      </div>
                    </div>
                  )}

                  {/* SCENE 5 */}
                  {activeScene.uiView === 'portal_qr' && (
                    <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in">
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-800 shadow-md shrink-0">
                        <div className="w-36 h-36 bg-emerald-950 rounded-lg flex flex-col items-center justify-center text-center p-2 text-white">
                          <QrCode className="w-20 h-20 text-emerald-400 mb-1" />
                          <span className="text-[10px] font-mono">SCAN FOR PORTAL</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-center sm:text-left text-xs">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 font-semibold border border-emerald-700">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Instant Smartphone Scan</span>
                        </div>
                        <h4 className="text-base font-bold text-white">
                          Scan QR to Open Customer Portal Directly
                        </h4>
                        <p className="text-slate-400 leading-relaxed">
                          Deep-links straight to the voice and text capture box with no redirects or authentication roadblocks.
                        </p>
                        <p className="font-mono text-[11px] text-emerald-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
                          https://safaricom.co.ke/?view=customer#customer-portal
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SCENE 6 */}
                  {activeScene.uiView === 'admin_triage' && (
                    <div className="w-full max-w-3xl space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-emerald-400" />
                          Safaricom NOC Dispatch Command Console
                        </span>
                        <span className="px-2.5 py-1 rounded bg-emerald-500 text-emerald-950 font-bold text-xs">
                          1-Click AI Auto-Assign
                        </span>
                      </div>

                      <div className="bg-slate-950 border-l-4 border-l-rose-500 border border-slate-800 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-400">SEMA-SAF-8041</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            HIGH TENSION (92/100 Distressed)
                          </span>
                        </div>

                        <p className="text-xs text-white">
                          Router ya Safaricom Home Fibre inawaka red hapa Roysambu tangu jana usiku...
                        </p>

                        <div className="p-2.5 bg-emerald-950/80 rounded border border-emerald-800 text-xs flex items-center justify-between text-emerald-200">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              Automated Dispatch Notice Delivered to <strong>Eng. Dennis Kiprono</strong>
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-400">Target SLA: 2 Hours</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCENE 7 */}
                  {activeScene.uiView === 'admin_audit' && (
                    <div className="w-full max-w-2xl text-center space-y-4 animate-scale-up">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        Audit Trails, Tech Stack &amp; Complete PDF Manual
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto">
                        Full architectural blueprints, comprehensive REST API references, and field engineering SOPs ready for production deployment.
                      </p>
                      <div className="flex justify-center gap-3 pt-1">
                        <a
                          href="/Safaricom-SEMA-Technical-Documentation.pdf"
                          download="Safaricom-SEMA-Technical-Documentation.pdf"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-xs text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Safaricom-SEMA-Technical-Documentation.pdf</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Closed Captions */}
                <div className="px-5 py-3 bg-slate-950/95 border-t border-slate-800 shrink-0">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase tracking-wider shrink-0 mt-0.5">
                      AI Voiceover
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed italic">
                      &ldquo;{activeScene.narration}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Simulation Controls */}
              <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 space-y-2 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-400 tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <div
                    className="flex-1 h-2 bg-slate-950 rounded-full cursor-pointer relative overflow-hidden"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const ratio = clickX / rect.width;
                      handleSeekVideo(ratio * TOTAL_DURATION_SEC);
                    }}
                  >
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(currentTime / TOTAL_DURATION_SEC) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">01:15</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSeekVideo(0)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Restart Demo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isMuted
                          ? 'text-amber-400 bg-amber-950/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={isMuted ? 'Unmute AI Voiceover' : 'Mute AI Voiceover'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 hidden sm:block">
                    <span className="text-slate-500">Active Scene: </span>
                    <span className="text-white font-medium">{activeScene.title}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
