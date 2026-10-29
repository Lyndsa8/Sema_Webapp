import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface FooterContactProps {
  onOpenTechDocs?: () => void;
  onOpenDemoVideo?: () => void;
}

export const FooterContact: React.FC<FooterContactProps> = () => {
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackName, setCallbackName] = useState('');
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const [callbackError, setCallbackError] = useState('');

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackError('');
    const cleaned = callbackPhone.trim();
    if (!cleaned || cleaned.length < 9) {
      setCallbackError('Please enter a valid Kenyan phone number (e.g., 0712 345 678).');
      return;
    }
    setCallbackSubmitted(true);
    setCallbackPhone('');
    setCallbackName('');
  };

  return (
    <footer
      id="footer-contact"
      className="w-full bg-emerald-950 text-white border-t border-emerald-900 mt-14"
    >
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-emerald-800/70">
          {/* Column 1: Brand & Mission (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                S
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                SAFARICOM SEMA
              </span>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed max-w-sm">
              Safaricom PLC Customer &amp; Network Rapid Response Portal. Capturing subscriber feedback across all 47 Kenyan counties in English,
              Kiswahili, and Sheng. Tell us the issue and our specialized response teams will fix it.
            </p>
            <div className="text-xs text-emerald-300/90 flex flex-wrap items-center gap-2">
              <span>English</span>
              <span aria-hidden="true">·</span>
              <span>Kiswahili</span>
              <span aria-hidden="true">·</span>
              <span>Sheng</span>
              <span aria-hidden="true">·</span>
              <span>Home Fibre · M-PESA · 5G</span>
            </div>
          </div>

          {/* Column 2: Direct Contact Details (4 cols) */}
          <div className="md:col-span-4 space-y-3.5">
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
              Safaricom Support Hotlines &amp; NOC
            </h3>
            <ul className="space-y-3 text-sm text-emerald-50/90">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold block text-white">General Customer Care:</span>
                  <a href="tel:100" className="hover:text-emerald-300 underline font-mono">100</a> (PrePay free) or{' '}
                  <a href="tel:200" className="hover:text-emerald-300 underline font-mono">200</a> (PostPay free)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold block text-white">Home Fibre Dedicated Desk:</span>
                  <a href="tel:400" className="hover:text-emerald-300 underline font-mono font-bold">400</a> (24/7 Red LOS &amp; Router Support)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold block text-white">Official Care Email:</span>
                  <a href="mailto:customercare@safaricom.co.ke" className="hover:text-emerald-300 underline">
                    customercare@safaricom.co.ke
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold block text-white">Headquarters:</span>
                  <span>Safaricom House, Waiyaki Way, Westlands, P.O. Box 66827-00800, Nairobi, Kenya</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold block text-white">SEMA Operating Hours:</span>
                  <span>24 Hours / 7 Days a Week / 365 Days</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Request Urgent Call-Back Form (4 cols) */}
          <div className="md:col-span-4 bg-emerald-900/40 p-5 rounded-2xl border border-emerald-800/80 space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-300">
              <Phone className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Request Rapid Call-Back</h3>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              If your internet is completely down or you prefer speaking directly with an engineer, enter your phone number below:
            </p>

            {callbackSubmitted ? (
              <div className="p-3 bg-emerald-900/80 rounded-xl border border-emerald-700 text-xs space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Call-Back Requested!</span>
                </div>
                <p className="text-emerald-100">
                  A Safaricom support specialist has queued your request and will call you within 15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setCallbackSubmitted(false)}
                  className="mt-2 text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
                >
                  Request another call-back
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestCallback} className="space-y-2.5">
                <div>
                  <label htmlFor="cb-name" className="block text-[11px] text-emerald-200 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    id="cb-name"
                    type="text"
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    placeholder="e.g., Amani Kamau"
                    className="w-full px-3 py-2 text-xs bg-emerald-950/90 border border-emerald-700 rounded-lg text-white placeholder-emerald-400/60 focus:outline-hidden focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label htmlFor="cb-phone" className="block text-[11px] text-emerald-200 mb-1">
                    Kenyan Mobile Number <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="cb-phone"
                    type="tel"
                    required
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    placeholder="07XX XXX XXX or 01XX XXX XXX"
                    className="w-full px-3 py-2 text-xs bg-emerald-950/90 border border-emerald-700 rounded-lg text-white placeholder-emerald-400/60 focus:outline-hidden focus:border-emerald-400 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Call-Back Request</span>
                </button>
                {callbackError && (
                  <p className="text-xs text-amber-300">{callbackError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Navigation Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
          <p>© {new Date().getFullYear()} Safaricom PLC. SEMA Customer &amp; Network Operations. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#customer-portal" className="hover:text-white transition-colors">
              Customer Portal
            </a>
            <a href="#voice-capture" className="hover:text-white transition-colors">
              Voice Capture
            </a>
            <a href="#qr-section" className="hover:text-white transition-colors">
              QR Code
            </a>
            <a
              href="/Safaricom-SEMA-Technical-Documentation.pdf"
              download="Safaricom-SEMA-Technical-Documentation.pdf"
              className="hover:text-white transition-colors inline-flex items-center gap-1 font-semibold text-emerald-300"
              title="Download Full PDF System Documentation"
            >
              <span>📄 PDF Manual</span>
            </a>
            <a
              href="/SEMA-Technical-Documentation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1 text-emerald-300"
              title="Open HTML System Documentation"
            >
              <span>🌐 HTML Docs</span>
            </a>
            <a
              href="/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.md"
              download="SEMA-COMPLETE-SYSTEM-DOCUMENTATION.md"
              className="hover:text-white transition-colors inline-flex items-center gap-1 text-emerald-300"
              title="Download Complete Markdown Documentation"
            >
              <span>📝 Specs (.md)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
