import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, HelpCircle, Settings, RefreshCw } from 'lucide-react';

interface QrCodePanelProps {
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const LIVE_PUBLIC_WEB_URL =
  'https://ais-pre-7h4hnqtyd66b5aycnimgff-979831091301.europe-west2.run.app';

export function getScannableWebUrl(customUrl?: string): string {
  if (customUrl && customUrl.trim()) {
    const clean = customUrl.trim().replace(/\/+$/, '');
    if (clean.includes('#')) return clean;
    return `${clean}/?view=customer#customer-portal`;
  }

  let base = LIVE_PUBLIC_WEB_URL;
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;
    // In AI Studio, ais-dev- requires developer session authentication resulting in 403 on mobile.
    // Automatically map ais-dev- to the public ais-pre- Shared App URL.
    if (origin && origin.includes('ais-dev-')) {
      base = origin.replace('ais-dev-', 'ais-pre-');
    } else if (origin && origin.startsWith('https://') && !origin.includes('internal') && !origin.includes('localhost')) {
      base = origin;
    } else if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      base = `https://${hostname}`;
    }
  }
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/?view=customer#customer-portal`;
}

export const QrCodePanel: React.FC<QrCodePanelProps> = ({
  isModalOpen,
  onCloseModal,
}) => {
  const [customUrl, setCustomUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('sema_custom_qr_url') || '';
    } catch {
      return '';
    }
  });
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState(customUrl);
  const [copiedLink, setCopiedLink] = useState(false);
  const [show403Help, setShow403Help] = useState(false);

  const targetUrl = getScannableWebUrl(customUrl);

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const val = tempUrlInput.trim();
    setCustomUrl(val);
    try {
      if (val) {
        localStorage.setItem('sema_custom_qr_url', val);
      } else {
        localStorage.removeItem('sema_custom_qr_url');
      }
    } catch {
      // ignore
    }
    setIsEditingUrl(false);
  };

  const handleResetUrl = () => {
    setCustomUrl('');
    setTempUrlInput('');
    try {
      localStorage.removeItem('sema_custom_qr_url');
    } catch {
      // ignore
    }
    setIsEditingUrl(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <aside
        id="qr-section"
        className="bg-white border border-emerald-950/12 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4"
      >
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-900 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Customer Portal Direct Access
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Scan to Open Customer Portal
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Scan with any smartphone camera to open Safaricom SEMA directly.
          </p>
        </div>

        {/* Clean QR Code Display */}
        <div className="bg-emerald-50/60 border border-emerald-900/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-2xs w-full max-w-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <QRCodeSVG
              id="sema-landing-qr-svg"
              value={targetUrl}
              size={195}
              bgColor="#ffffff"
              fgColor="#064e3b"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center gap-2">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 break-all text-center cursor-pointer"
                title="Open Customer Portal URL"
              >
                <span>Direct Link: Customer Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded transition-colors cursor-pointer"
                title="Copy Target URL"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono break-all text-center leading-tight">
              {targetUrl}
            </span>
          </div>

          {/* URL customization and 403 diagnostic guide */}
          <div className="w-full pt-2 border-t border-emerald-900/10 space-y-2 text-2xs">
            <div className="flex items-center justify-between gap-1 text-slate-600">
              <button
                type="button"
                onClick={() => setIsEditingUrl((prev) => !prev)}
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>{customUrl ? 'Custom Domain Set' : 'Custom URL'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShow403Help((prev) => !prev)}
                className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-amber-700" />
                <span>Why 403 on phone?</span>
              </button>
            </div>

            {isEditingUrl && (
              <form onSubmit={handleSaveCustomUrl} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 text-left">
                <label className="block text-[10px] font-bold text-slate-700">
                  Target Domain / URL for QR Code:
                </label>
                <input
                  type="url"
                  value={tempUrlInput}
                  onChange={(e) => setTempUrlInput(e.target.value)}
                  placeholder="https://your-domain.com or ngrok URL"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:border-emerald-600"
                />
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded cursor-pointer"
                  >
                    Save URL
                  </button>
                  {customUrl && (
                    <button
                      type="button"
                      onClick={handleResetUrl}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {show403Help && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-left text-amber-950 space-y-1">
                <p className="font-bold text-[11px] text-amber-900">Why does your phone say &ldquo;403 That&rsquo;s an error&rdquo;?</p>
                <p className="text-[10px] text-amber-800 leading-snug">
                  1. <strong>Private AI Studio Container:</strong> By default, Google Cloud restricts developer URLs (<code>ais-dev-</code>) to your logged-in Google account session.
                </p>
                <p className="text-[10px] text-amber-800 leading-snug">
                  2. <strong>Fix:</strong> At the top right of the Google AI Studio window, click the <strong>&ldquo;Share&rdquo;</strong> button and enable public sharing (Anyone with link).
                </p>
                <p className="text-[10px] text-amber-800 leading-snug">
                  3. <strong>Alternative:</strong> Or deploy to a custom domain (e.g. Vercel, Cloud Run, Firebase, ngrok) and paste it into the <em>Custom URL</em> box above.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Enlarged QR Code Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="qr-modal-title" className="text-base font-bold text-slate-900">
                Scan with Phone Camera
              </h3>
              <button
                type="button"
                onClick={onCloseModal}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close QR Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-900/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <QRCodeSVG
                  value={targetUrl}
                  size={240}
                  bgColor="#ffffff"
                  fgColor="#064e3b"
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[10px] text-slate-600 font-mono break-all max-w-[260px]">
                {targetUrl}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
