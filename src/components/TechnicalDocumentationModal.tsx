import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Printer,
  ExternalLink,
  X,
  Search,
  Server,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

interface TechnicalDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PDF_DOWNLOAD_URL = '/Safaricom-SEMA-Technical-Documentation.pdf';

export const TechnicalDocumentationModal: React.FC<TechnicalDocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'architecture' | 'setup' | 'voice-nlp' | 'noc-dispatch' | 'api-docs' | 'sops' | 'troubleshooting'
  >('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyEndpoint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-docs-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Top Header */}
        <header className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Safaricom PLC · Technology Division
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  v2.1 Enterprise
                </span>
              </div>
              <h2 id="tech-docs-title" className="text-lg font-bold text-white tracking-tight">
                SEMA Technical Documentation &amp; Engineering Manual
              </h2>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Print or Save using Browser Print Dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <a
              href="/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Open full 25-section HTML technical manual in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Full HTML</span>
            </a>

            <a
              href="/SEMA-2-Page-Technical-Architecture.html"
              download="Safaricom-SEMA-2-Page-Technical-Architecture.html"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              title="Download standalone 2-Page Technical Architecture & Flow Diagram (HTML)"
            >
              <Download className="w-3.5 h-3.5 text-amber-950" />
              <span>Download 2-Page Arch</span>
            </a>

            <a
              href="/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html"
              download="Safaricom-SEMA-Complete-System-Documentation.html"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Download standalone complete HTML system documentation (76 KB)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download HTML</span>
            </a>

            <a
              href={PDF_DOWNLOAD_URL}
              download="Safaricom-SEMA-Technical-Documentation.pdf"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              title="Download full formatted PDF technical manual"
            >
              <Download className="w-4 h-4 text-emerald-950" />
              <span>Download PDF</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'overview', label: '1. Overview', icon: FileText },
              { id: 'architecture', label: '2. Architecture', icon: Layers },
              { id: 'setup', label: '3. Setup & Config', icon: Terminal },
              { id: 'voice-nlp', label: '4. Voice & NLP', icon: Smartphone },
              { id: 'noc-dispatch', label: '5. NOC Dispatch', icon: Server },
              { id: 'api-docs', label: '6. API Reference', icon: Cpu },
              { id: 'sops', label: '7. SOPs & Runbooks', icon: ShieldCheck },
              { id: 'troubleshooting', label: '8. Troubleshooting', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative hidden md:block shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-40 pl-8 pr-3 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Documentation Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-sm leading-relaxed text-slate-300">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 1 · Executive Summary
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Safaricom SEMA System Overview
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Product Purpose, Architecture Goals &amp; Operational Value Proposition
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                <h4 className="text-base font-semibold text-white">What is SEMA?</h4>
                <p>
                  <strong>Safaricom SEMA</strong> (Sauti ya Mwananchi) is an intelligent citizen incident reporting and automated dispatch engine designed for Safaricom PLC Kenya. The system eliminates communication friction by providing zero-barrier voice and text reporting across all 47 Kenyan counties in English, Kiswahili Sanifu, and Kenyan Sheng.
                </p>
                <p>
                  Powered by Google Gemini 2.5 AI, real-time in-browser speech recognition, audio frequency analysis, and automated Network Operations Center (NOC) field engineer dispatch, SEMA cuts incident triage time from hours to seconds while tracking high-tension subscriber sentiment and enforcing strict SLA resolution milestones.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-white text-sm">Citizen Touchless Ingestion</h5>
                  <p className="text-xs text-slate-400">
                    Real-time speech-to-text without mandatory app downloads or logins. Deep-linked QR code points directly to the voice reporter.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-white text-sm">Trilingual AI Intelligence</h5>
                  <p className="text-xs text-slate-400">
                    Recognizes Sheng idioms (&ldquo;chapaa imekwama&rdquo;, &ldquo;router inawaka red&rdquo;) alongside Kiswahili and English with sentiment and tension scoring.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Server className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-white text-sm">Automated NOC Dispatch</h5>
                  <p className="text-xs text-slate-400">
                    Auto-routes incidents to Home Fibre, M-PESA, RAN, or Fraud engineering teams with SLA countdowns and automated email dispatch notices.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-semibold text-emerald-300 text-sm">
                    Download Complete 25-Chapter Technical Manual
                  </h5>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Includes all 25 chapters, architecture diagrams, sequence flows, database schemas, APIs, and operational SOPs.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href="/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html"
                    download="Safaricom-SEMA-Complete-System-Documentation.html"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 rounded-lg transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Complete HTML (76 KB)</span>
                  </a>
                  <a
                    href={PDF_DOWNLOAD_URL}
                    download="Safaricom-SEMA-Technical-Documentation.pdf"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 2 · System Architecture
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Full-Stack Architecture &amp; Data Flow
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">1. Frontend Presentation Layer</h4>
                  <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-300">
                    <li><strong>React 19 &amp; TypeScript:</strong> High-performance functional components and strict type safety.</li>
                    <li><strong>Tailwind CSS v4:</strong> Utility-first design tokens with customized Safaricom Emerald color palette.</li>
                    <li><strong>Web Speech API:</strong> Native in-browser speech recognition engine streaming text directly into textarea.</li>
                    <li><strong>Web Audio API:</strong> AudioContext and AnalyserNode rendering real-time soundwave equalizer bars.</li>
                    <li><strong>qrcode.react:</strong> Dynamic high-error-correction (Level H) SVG QR code pointing directly to Customer Portal deep link.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">2. Intelligence &amp; NLP Layer</h4>
                  <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-300">
                    <li><strong>Google Gemini 2.5 Flash:</strong> Multimodal inference engine parsing unstructured voice audio and text.</li>
                    <li><strong>Kenyan Linguistic Model:</strong> Built-in token dictionary parsing Kiswahili and Sheng vernacular.</li>
                    <li><strong>Sentiment &amp; Frustration Engine:</strong> 0-100 metric calculating distress, financial urgency, and red LOS outage severity.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">3. Backend &amp; Services Layer</h4>
                  <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-300">
                    <li><strong>Node.js &amp; Express REST API:</strong> Microservice handling submission ingestion, triage, and email dispatch notices.</li>
                    <li><strong>Safaricom NOC Dispatch Engine:</strong> Maps problems to 7 designated response teams and officer leads.</li>
                    <li><strong>Audit Logging &amp; Export:</strong> Maintains full audit trails with automated officer dispatch history and CSV export.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">4. Cloud Infrastructure</h4>
                  <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-300">
                    <li><strong>Google Cloud Run:</strong> Autoscaling containerized microservice execution behind HTTPS load balancer.</li>
                    <li><strong>GitHub CI/CD:</strong> Continuous integration and automated deployment sync to GitHub repository and Pages.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 3 · Setup &amp; Configuration
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Developer Setup &amp; Environment Variables
                </h3>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Environment Configuration (.env)</h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                  <p>PORT=3000</p>
                  <p>NODE_ENV=production</p>
                  <p>GEMINI_API_KEY=AIzaSy... # Optional: Google Gemini API key</p>
                  <p>VITE_PUBLIC_URL=https://ais-pre-zhdir2qsygkujxuwikuyds-576766090545.europe-west3.run.app</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Installation &amp; Execution Commands</h4>
                <div className="space-y-2">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between">
                    <span>npm install</span>
                    <span className="text-slate-500">Install dependencies</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between">
                    <span>npm run dev</span>
                    <span className="text-slate-500">Launch dev server on port 3000</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between">
                    <span>npm run build</span>
                    <span className="text-slate-500">Build production bundle</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between">
                    <span>npm start</span>
                    <span className="text-slate-500">Run production server</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VOICE & NLP */}
          {activeTab === 'voice-nlp' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 4 · Voice &amp; Linguistic Engine
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Speech Recognition &amp; Multilingual Parsing
                </h3>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                <h4 className="text-base font-semibold text-white">Browser Speech Recognition Architecture</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To eliminate microphone permission obstacles in sandboxed iframes, SEMA first executes an explicit <code>navigator.mediaDevices.getUserMedia({"{"} audio: true {"}"})</code> handshake. Once authorized, it binds a continuous <code>SpeechRecognition</code> stream that synchronizes interim words in real-time with the issue description textarea while feeding a live <code>AnalyserNode</code> frequency canvas.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                <h4 className="text-base font-semibold text-white">Kenyan Sheng &amp; Swahili Lexicon</h4>
                <p className="text-xs text-slate-300">
                  SEMA identifies colloquial tokens and patterns to route tickets appropriately:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 block font-semibold mb-1">Sheng Keywords</span>
                    manze, rada, noma, chapaa, keja, bazenga, tutaisort, mbio, chanueni, wasee
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 block font-semibold mb-1">Kiswahili Keywords</span>
                    shida, tatizo, stima, huduma, hospitali, mwananchi, haraka, wasilisha
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOC DISPATCH */}
          {activeTab === 'noc-dispatch' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 5 · NOC Dispatch &amp; Operations
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  NOC Command, Teams &amp; Automated Email Notices
                </h3>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                <h4 className="text-base font-semibold text-white">Response Teams &amp; Designated Leads</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-2 pr-4">Team</th>
                        <th className="py-2 pr-4">Lead Officer</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-white">Home Fibre &amp; Enterprise NOC</td>
                        <td className="py-2 pr-4">Eng. Dennis Kiprono</td>
                        <td className="py-2 pr-4 font-mono text-emerald-400">dennis.kiprono@safaricom.co.ke</td>
                        <td className="py-2">2 Hours</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-white">M-PESA Escalations &amp; Reversals</td>
                        <td className="py-2 pr-4">Officer Grace Mwangi</td>
                        <td className="py-2 pr-4 font-mono text-emerald-400">grace.mwangi@safaricom.co.ke</td>
                        <td className="py-2">30 Mins</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-white">4G/5G BTS &amp; RAN Mobile Team</td>
                        <td className="py-2 pr-4">Supervisor Brian Otieno</td>
                        <td className="py-2 pr-4 font-mono text-emerald-400">brian.otieno@safaricom.co.ke</td>
                        <td className="py-2">4 Hours</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold text-white">SIM Swap &amp; Cyber-Fraud Unit</td>
                        <td className="py-2 pr-4">Insp. Hassan Ali</td>
                        <td className="py-2 pr-4 font-mono text-emerald-400">hassan.ali@safaricom.co.ke</td>
                        <td className="py-2">1 Hour</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: API REFERENCE */}
          {activeTab === 'api-docs' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 6 · REST API Reference
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Complete HTTP Endpoint Documentation
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    method: 'POST',
                    path: '/api/submissions',
                    desc: 'Submit a new citizen incident report (voice, text, or hybrid).',
                    body: `{ "text": "Router inawaka red Roysambu", "countyOrWard": "Nairobi · Roysambu", "contactInfo": "0722123456", "captureMethod": "voice" }`,
                    response: `{ "submission": { "id": "sema-101", "referenceCode": "SEMA-SAF-8041", "status": "Received", "priority": "Urgent" } }`,
                  },
                  {
                    method: 'GET',
                    path: '/api/submissions',
                    desc: 'Retrieve all current incident records for public and NOC tracking.',
                    body: 'None (Query parameters supported)',
                    response: `{ "submissions": [ { "id": "sema-101", "status": "In Progress" } ] }`,
                  },
                  {
                    method: 'POST',
                    path: '/api/submissions/:id/ai-classify',
                    desc: 'Trigger Google Gemini 2.5 classification for an incident.',
                    body: 'None',
                    response: `{ "classification": { "category": "Home Fibre", "urgency": "Urgent", "recommendedTeam": "...", "estimatedSLA": "2 hours" } }`,
                  },
                  {
                    method: 'PATCH',
                    path: '/api/submissions/:id/assign',
                    desc: 'Assign an incident to a response team and officer with automated email alert notice.',
                    body: `{ "assignedTeam": "Home Fibre NOC", "assignedOfficer": "Eng. Dennis Kiprono", "priority": "Urgent", "sendEmailAlert": true }`,
                    response: `{ "submission": { ... }, "emailAlert": { "id": "email-1", "toEmail": "dennis.kiprono@safaricom.co.ke", "status": "Delivered" } }`,
                  },
                  {
                    method: 'POST',
                    path: '/api/submissions/auto-assign-all',
                    desc: 'Batch AI operation to classify, triage, assign, and dispatch email notices for all unassigned reports.',
                    body: 'None',
                    response: `{ "message": "Successfully classified and assigned 12 reports.", "count": 12, "emailAlertsCount": 12 }`,
                  },
                ].map((ep, idx) => (
                  <div key={idx} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            ep.method === 'POST'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : ep.method === 'PATCH'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-semibold text-white">{ep.path}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEndpoint(`${ep.method} ${ep.path}`)}
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                        title="Copy endpoint"
                      >
                        {copiedEndpoint === `${ep.method} ${ep.path}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300">{ep.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 overflow-x-auto">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans mb-1">Payload:</span>
                        {ep.body}
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 overflow-x-auto">
                        <span className="text-slate-500 block text-[10px] uppercase font-sans mb-1">Sample Response:</span>
                        {ep.response}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SOPS */}
          {activeTab === 'sops' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 7 · Standard Operating Procedures
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  NOC &amp; Field Engineering SOPs
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">SOP-01: Citizen Voice Reporting Protocol</h4>
                  <ol className="list-decimal list-inside text-xs space-y-2 text-slate-300">
                    <li>Citizen scans QR code on phone camera; browser opens directly into <code>#customer-portal</code>.</li>
                    <li>Citizen taps microphone, grants permission, and speaks in English, Kiswahili, or Sheng.</li>
                    <li>Speech streams live into box. Citizen reviews text and taps &ldquo;Submit Safaricom Report&rdquo;.</li>
                    <li>SEMA returns unique tracking code (e.g. SEMA-SAF-8041) with instant localized commitment response.</li>
                  </ol>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">SOP-02: NOC Rapid Triage &amp; AI Auto-Assignment</h4>
                  <ol className="list-decimal list-inside text-xs space-y-2 text-slate-300">
                    <li>NOC Controller logs into console via <code>#admin</code>.</li>
                    <li>Controller clicks &ldquo;AI Auto-Assign All&rdquo; marquee button.</li>
                    <li>Gemini AI processes unassigned queue, calculates SLA, and dispatches automated officer email notices.</li>
                    <li>High-tension incidents flagged with red accents are prioritized for immediate field dispatch.</li>
                  </ol>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-semibold text-white">SOP-03: Field Engineering Remediation</h4>
                  <ol className="list-decimal list-inside text-xs space-y-2 text-slate-300">
                    <li>Field engineer receives mobile dispatch notice with coordinates and diagnostic directives.</li>
                    <li>Engineer marks ticket &ldquo;In Progress&rdquo; upon arrival and executes physical repair.</li>
                    <li>Once service is restored, engineer updates milestone to &ldquo;Resolved&rdquo; with clearance notes.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TROUBLESHOOTING */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Chapter 8 · Troubleshooting &amp; Maintenance
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Common Diagnostics &amp; Mitigations
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2.5 pr-4">Symptom</th>
                      <th className="py-2.5 pr-4">Root Cause</th>
                      <th className="py-2.5">Resolution / Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="py-2.5 pr-4 font-semibold text-white">Microphone not initiating</td>
                      <td className="py-2.5 pr-4">Browser blocked permission or missing HTTPS</td>
                      <td className="py-2.5">Click &ldquo;Tap to Speak&rdquo; and click &ldquo;Allow&rdquo; on browser pop-up. HTTPS is mandatory.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-semibold text-white">QR resolves to localhost</td>
                      <td className="py-2.5 pr-4">Scanning dev container URL</td>
                      <td className="py-2.5">SEMA auto-substitutes public Cloud Run HTTPS domain for phone cameras.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-semibold text-white">Gemini API key missing</td>
                      <td className="py-2.5 pr-4">Unset GEMINI_API_KEY env var</td>
                      <td className="py-2.5">Built-in rule-based classifier and Sheng token engine operate autonomously.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <footer className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Safaricom PLC Technical Systems · Document Reference: SAF-SEMA-DOC-2026-v2.1</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={PDF_DOWNLOAD_URL}
              download="Safaricom-SEMA-Technical-Documentation.pdf"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF (60 KB)</span>
            </a>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
