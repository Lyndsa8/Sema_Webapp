import React, { useEffect, useState } from 'react';
import { QrCode, Mic, ShieldAlert } from 'lucide-react';
import { TypewriterPhrase } from '../types';

export const TYPEWRITER_PHRASES: TypewriterPhrase[] = [
  {
    langCode: 'en',
    langLabel: 'English',
    regionNote: 'Official English · Safaricom Kenya',
    headline: 'Tell Safaricom the problem and we will fix it.',
    placeholder:
      'Speak with the microphone or type your issue here in English, Kiswahili, or Sheng (e.g., "Safaricom Home Fibre router red LOS light blinking since yesterday...", "M-PESA transaction stuck without SMS...", or "No 4G/5G reception in Ruiru...")',
    ctaLabel: 'Submit Safaricom Report',
  },
  {
    langCode: 'sw',
    langLabel: 'Kiswahili',
    regionNote: 'Kiswahili Sanifu · Safaricom Kenya',
    headline: 'Tuambie shida yako ya Safaricom na tutaitatua.',
    placeholder:
      'Bonyeza kipaza sauti uongee au uandike shida yako hapa kwa Kiswahili, Kiingereza au Sheng (k.m., "Router ya Safaricom Home Fibre inawaka red tangu asubuhi, au pesa za M-PESA zimekwama bila meseji...")',
    ctaLabel: 'Wasilisha Ripoti ya Safaricom',
  },
  {
    langCode: 'sheng',
    langLabel: 'Sheng',
    regionNote: 'Kenyan Sheng · Safaricom Mtaani',
    headline: 'Tuchanue rada ya Safaricom ni gani na tutaisort.',
    placeholder:
      'Bonga kwa mic ama utype rada iko aje hapa kwa Sheng, Kiswahili ama Kizungu (k.m., "Home Fibre imelost router inawaka red, chapaa ya M-PESA imekwama kwa Paybill, ama 5G imedrop...")',
    ctaLabel: 'Tuma Rada Ifanyiwe Kazi',
  },
];

interface HeaderWithTypewriterProps {
  activePhraseIndex: number;
  onSelectPhraseIndex: (index: number) => void;
  onOpenQrModal: () => void;
  onFocusVoiceBox: () => void;
  onOpenAdminView?: () => void;
  unassignedCount?: number;
}

export const HeaderWithTypewriter: React.FC<HeaderWithTypewriterProps> = ({
  activePhraseIndex,
  onSelectPhraseIndex,
  onOpenQrModal,
  onFocusVoiceBox,
  onOpenAdminView,
  unassignedCount = 0,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPhrase = TYPEWRITER_PHRASES[activePhraseIndex] || TYPEWRITER_PHRASES[0];

  useEffect(() => {
    if (isPaused) return;

    const fullText = currentPhrase.headline;

    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayedText.length < fullText.length) {
      // Typing forward character by character
      const nextCharDelay = 52 + (displayedText.length % 3) * 14;
      timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, nextCharDelay);
    } else if (!isDeleting && displayedText.length === fullText.length) {
      // Pause at full sentence so citizen can read it clearly
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2400);
    } else if (isDeleting && displayedText.length > 0) {
      // Erasing character by character like backspace
      timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length - 1));
      }, 28);
    } else if (isDeleting && displayedText.length === 0) {
      // Move to the next language in sequence (English -> Swahili -> Sheng)
      setIsDeleting(false);
      onSelectPhraseIndex((activePhraseIndex + 1) % TYPEWRITER_PHRASES.length);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, isPaused, currentPhrase, activePhraseIndex, onSelectPhraseIndex]);

  const handleManualLanguageSwitch = (index: number) => {
    onSelectPhraseIndex(index);
    setDisplayedText('');
    setIsDeleting(false);
  };

  return (
    <header className="w-full bg-white border-b border-emerald-950/10">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between gap-8 border-b border-slate-100">
        {/* Zone 1: Brand Logo & Wordmark */}
        <a
          href="#top"
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-emerald-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-700 rounded-md"
        >
          <span className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v18" />
              <path d="M8 7v10" />
              <path d="M16 7v10" />
              <path d="M4 11v2" />
              <path d="M20 11v2" />
            </svg>
          </span>
          <span>Safaricom SEMA</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#customer-portal"
            className="text-emerald-800 font-semibold hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Customer Portal
          </a>
          <a
            href="#voice-capture"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Voice &amp; Text Box
          </a>
          <a
            href="#qr-section"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            QR Code Access
          </a>
          <a
            href="#footer-contact"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Safaricom Care Desk
          </a>
        </nav>

        {/* Zone 3: QR Code & Admin Entry */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenQrModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>QR Code</span>
          </button>

          {onOpenAdminView && (
            <button
              type="button"
              onClick={onOpenAdminView}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>Admin</span>
              {unassignedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white font-mono tabular-nums">
                  {unassignedCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Header Animated Typewriter Title Area */}
      <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-7 bg-gradient-to-b from-emerald-50/40 to-white">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Language Switcher / Cycle Indicator */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-emerald-900">Safaricom PLC Customer &amp; Network Rapid Response Desk</span>
              <span aria-hidden="true">·</span>
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                role="tablist"
                aria-label="Select title language"
              >
                {TYPEWRITER_PHRASES.map((phrase, idx) => {
                  const isActive = idx === activePhraseIndex;
                  return (
                    <button
                      key={phrase.langCode}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleManualLanguageSwitch(idx)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {phrase.langLabel}
                    </button>
                  );
                })}
              </div>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="text-xs text-slate-500 hover:text-emerald-800 underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPaused ? 'Resume Typing' : 'Pause Typing'}
              </button>
            </div>

            {/* Dynamic Typing & Erasing Title */}
            <h1
              className="font-display font-bold tracking-tight text-slate-900 text-balance min-h-[2.6em] sm:min-h-[1.4em] flex items-center"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3.35rem)', lineHeight: 1.12 }}
              aria-live="polite"
            >
              <span>
                {displayedText}
                <span
                  className="inline-block w-[3px] h-[0.88em] bg-emerald-600 ml-1.5 align-middle animate-cursor-blink"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Speak naturally or type directly into the box below in{' '}
              <span className="font-semibold text-emerald-900">English</span>,{' '}
              <span className="font-semibold text-emerald-900">Kiswahili</span>, or{' '}
              <span className="font-semibold text-emerald-900">Sheng</span>. Our AI transcribes your
              voice directly into the text box so Safaricom&apos;s specialized NOC, Fibre, and M-PESA response teams can resolve your issue.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onFocusVoiceBox}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice or Text Capture</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
