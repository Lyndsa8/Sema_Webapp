const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

function generateDocumentationPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function addHeaderFooter(pageNum, totalPages) {
    if (pageNum === 1) return; // skip on cover
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SAFARICOM SEMA · Technical System Documentation v2.1', margin, 25);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    doc.text('Safaricom PLC · Confidential & Engineering Internal', margin, pageHeight - 18);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 18);
    doc.restoreGraphicsState();
  }

  function checkPageBreak(requiredHeight) {
    if (y + requiredHeight > pageHeight - 45) {
      doc.addPage();
      y = 45;
    }
  }

  function addHeading1(title) {
    checkPageBreak(50);
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(6, 78, 59); // Emerald-900
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(16, 185, 129); // Emerald-500
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 80, y);
    y += 16;
  }

  function addHeading2(title) {
    checkPageBreak(35);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(title, margin, y);
    y += 14;
  }

  function addHeading3(title) {
    checkPageBreak(25);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(title, margin, y);
    y += 12;
  }

  function addParagraph(text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 12 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 6;
  }

  function addBullet(bulletTitle, bulletText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 78, 59);
    const prefix = '• ' + (bulletTitle ? bulletTitle + ': ' : '');
    const prefixWidth = doc.getTextWidth(prefix);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const remainingWidth = contentWidth - 14;
    const fullText = (bulletTitle ? bulletTitle + ': ' : '') + bulletText;
    const lines = doc.splitTextToSize(fullText, remainingWidth);

    checkPageBreak(lines.length * 12 + 4);
    doc.text('•', margin, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    if (bulletTitle) {
      doc.text(bulletTitle + ':', margin + 12, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const titleW = doc.getTextWidth(bulletTitle + ': ');
      const firstLineRemaining = doc.splitTextToSize(bulletText, remainingWidth - titleW);
      doc.text(firstLineRemaining[0] || '', margin + 12 + titleW, y);
      if (firstLineRemaining.length > 1) {
        const restLines = doc.splitTextToSize(bulletText, remainingWidth);
        for (let i = 1; i < restLines.length; i++) {
          y += 12;
          doc.text(restLines[i], margin + 12, y);
        }
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text(lines, margin + 12, y);
    }
    y += 14;
  }

  function addCodeBlock(code) {
    const lines = doc.splitTextToSize(code, contentWidth - 16);
    const blockHeight = lines.length * 11 + 14;
    checkPageBreak(blockHeight);

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, blockHeight, 4, 4, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(lines, margin + 8, y + 12);
    y += blockHeight + 10;
  }

  function addTable(headers, rows, colWidths) {
    const rowHeight = 18;
    const tableHeight = (rows.length + 1) * rowHeight + 10;
    checkPageBreak(tableHeight);

    // Header row
    doc.setFillColor(6, 78, 59); // Emerald-900
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    headers.forEach((h, idx) => {
      const w = (colWidths[idx] / 100) * contentWidth;
      doc.text(h, curX + 4, y + 12);
      curX += w;
    });
    y += rowHeight;

    // Body rows
    rows.forEach((row, rIdx) => {
      checkPageBreak(rowHeight + 5);
      if (rIdx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      let cellX = margin;
      row.forEach((cell, cIdx) => {
        const w = (colWidths[cIdx] / 100) * contentWidth;
        const truncated = doc.splitTextToSize(String(cell), w - 8)[0] || '';
        doc.text(truncated, cellX + 4, y + 12);
        cellX += w;
      });
      y += rowHeight;
    });
    y += 10;
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 200, 'F');

  // Decorative accent line
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 195, pageWidth, 6, 'F');

  // Cover Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('SAFARICOM SEMA', margin, 90);

  doc.setFontSize(14);
  doc.setTextColor(209, 250, 229); // Emerald 100
  doc.text('Technical System Documentation & Engineering Manual', margin, 118);

  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text('Intelligent Rapid Citizen Incident Ingestion & NOC Dispatch Operations', margin, 138);

  y = 235;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 110, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DOCUMENT SPECIFICATIONS & AUDIT PROFILE', margin + 14, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('System Name: Safaricom SEMA (Sauti ya Mwananchi)', margin + 14, y + 38);
  doc.text('Release Version: v2.1.0 Enterprise Production', margin + 14, y + 52);
  doc.text('Target Environment: Google Cloud Run & Safaricom Hybrid Network Stack', margin + 14, y + 66);
  doc.text('Document Classification: Technical Engineering Specification & SOP Manual', margin + 14, y + 80);
  doc.text('Authoring Unit: Safaricom Technology Architecture & NOC Escalations Desk', margin + 14, y + 94);

  y += 130;

  // Executive Abstract
  addHeading2('Executive Abstract');
  addParagraph(
    'Safaricom SEMA is an enterprise-grade citizen incident reporting and automated dispatch engine designed for Safaricom PLC Kenya. The system eliminates communication friction by providing zero-barrier voice and text reporting across all 47 Kenyan counties in English, Kiswahili Sanifu, and Kenyan Sheng. Powered by Google Gemini 2.5 AI, real-time in-browser speech recognition, audio frequency analysis, and automated Network Operations Center (NOC) field engineer dispatch, SEMA cuts incident triage time from hours to seconds while tracking high-tension subscriber sentiment and enforcing strict SLA resolution milestones.'
  );

  addHeading2('Document Organization');
  addParagraph(
    'This manual serves system administrators, DevOps engineers, full-stack developers, NOC supervisors, and technical field officers. It is structured into 9 core operational sections covering architecture, setup, APIs, algorithms, SOPs, and troubleshooting.'
  );

  // Table of Contents Summary
  const tocRows = [
    ['1. System Architecture & Tech Stack', 'Section 1', 'Frontend, NLP, Backend & Cloud Infra'],
    ['2. Setup, Installation & Environment Config', 'Section 2', 'Prerequisites, env vars, build pipelines'],
    ['3. Customer Portal & Direct QR Engine', 'Section 3', 'Mobile deep-linking, touchless routing'],
    ['4. Real-Time Voice Streaming Subsystem', 'Section 4', 'Web Speech API, Audio Visualizer, Gemini'],
    ['5. Kenyan Multilingual NLP & Sentiment', 'Section 5', 'Sheng/Swahili lexicons, Frustration scoring'],
    ['6. NOC Admin Dispatch & Email Automation', 'Section 6', 'Field officer dispatch notices, SLAs'],
    ['7. Comprehensive REST API Reference', 'Section 7', 'All HTTP endpoints, schemas, payloads'],
    ['8. Standard Operating Procedures (SOPs)', 'Section 8', 'SOP-01 to SOP-04 workflow guidelines'],
    ['9. Troubleshooting, Security & Maintenance', 'Section 9', 'Microphone permissions, recovery, audit'],
  ];
  addTable(['Section Title', 'Reference', 'Primary Scope'], tocRows, [40, 20, 40]);

  // ==========================================
  // PAGE 2: ARCHITECTURE & TECH STACK
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('1. System Architecture & Tech Stack');
  addParagraph(
    'SEMA employs a modular, decoupled full-stack architecture built on modern web standards and Google Cloud services. The system is designed for high availability, sub-100ms UI responsiveness, and real-time offline-tolerant operation.'
  );

  addHeading2('1.1 Layer-by-Layer Architectural Decomposition');
  addBullet('Frontend Presentation Layer', 'React 19, TypeScript, Tailwind CSS v4, Vite bundler, motion animation library, Lucide icon system, and qrcode.react SVG engine.');
  addBullet('Speech & Audio Processing Layer', 'HTML5 Web Speech API (SpeechRecognition for real-time continuous client-side speech-to-text), Web Audio API (AudioContext + AnalyserNode for live soundwave visualizer), and SpeechSynthesis for accessibility feedback.');
  addBullet('Intelligence & Multilingual NLP Layer', 'Google Gemini 2.5 Flash multimodal model via @google/genai TypeScript SDK, supplemented by rule-based Sheng/Kiswahili morphological lexicons for instant zero-latency offline triage.');
  addBullet('Backend Microservices Layer', 'Node.js 20+ with Express REST API server, automated incident dispatch routing, SLA turnaround calculation, and automated officer email dispatch generator.');
  addBullet('Infrastructure & DevOps Layer', 'Containerized Google Cloud Run execution, Docker containers, Cloud SQL persistence compatibility, GitHub Actions CI/CD, and GitHub Pages static synchronization.');

  addHeading2('1.2 Architectural Data Flow');
  addCodeBlock(`[Citizen Device] -> (Camera QR Scan / Direct Web URL)
      │
      ▼
[SEMA Customer Portal]
      ├── 1. Mic Input -> Web Speech API (Continuous Interim Transcription)
      ├── 2. Audio Wave -> Web Audio Analyser (Real-Time Canvas Frequency Bars)
      ├── 3. Text Edit & Language Hint -> Client-side normalization
      └── 4. Form Submit -> POST /api/submissions
              │
              ▼
[Node.js Express API & Gemini AI Engine]
      ├── Language Identification (English / Kiswahili / Sheng)
      ├── Issue Categorization (Home Fibre, M-PESA, 4G/5G BTS, etc.)
      ├── Frustration & High-Tension Sentiment Scoring (0-100)
      ├── SLA Window Calculation (30m, 2h, 4h, 24h)
      └── Automated Response Team Matching
              │
              ▼
[Safaricom NOC Dispatch Console]
      ├── Interactive Real-Time Triage & Status Dot Filtering
      ├── Auto-Assign All Unassigned (1-Click Batch AI Dispatch)
      ├── Automated Officer Email Notices (Eng. Dennis Kiprono, Grace Mwangi)
      └── CSV Operations Audit Export`);

  // ==========================================
  // PAGE 3: SETUP & CONFIGURATION
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('2. Setup, Installation & Configuration');
  addParagraph(
    'SEMA can be deployed as a local development instance, a full-stack production container on Google Cloud Run, or a static client on GitHub Pages.'
  );

  addHeading2('2.1 System Prerequisites');
  addBullet('Node.js Runtime', 'Node.js v20.x or higher LTS (with npm v10+ or Bun).');
  addBullet('Browser Compatibility', 'Google Chrome, Microsoft Edge, Safari 15+, or Firefox with microphone access enabled.');
  addBullet('Network Connectivity', 'HTTPS protocol required in production to allow browser navigator.mediaDevices microphone permissions.');

  addHeading2('2.2 Environment Configuration');
  addParagraph('Create a `.env` file in the root workspace directory containing:');
  addCodeBlock(`# SEMA Environment Configuration
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=AIzaSy... # Optional: Google Gemini API key for live multimodal processing
VITE_PUBLIC_URL=https://ais-pre-zhdir2qsygkujxuwikuyds-576766090545.europe-west3.run.app`);

  addHeading2('2.3 Build & Execution Commands');
  addTable(
    ['Command', 'Target Execution', 'Description'],
    [
      ['npm run dev', 'Development', 'Spawns Express API + Vite middleware on port 3000'],
      ['npm run build', 'Production', 'Compiles React TypeScript into /dist and mirrors to /docs'],
      ['npm start', 'Production', 'Launches production Node.js server from server.ts via tsx'],
      ['npm run lint', 'Verification', 'Runs TypeScript strict type-checking across codebase'],
    ],
    [30, 25, 45]
  );

  // ==========================================
  // PAGE 4: VOICE CAPTURE & NLP ENGINE
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('3. Customer Voice & Multilingual NLP Engine');
  addParagraph(
    'One of SEMAs foremost innovations is its zero-barrier voice capture system, engineered to transcribe Kenyan accents and idioms accurately.'
  );

  addHeading2('3.1 Continuous Speech Recognition Subsystem');
  addParagraph(
    'SEMA leverages the browser SpeechRecognition API with explicit initial getUserMedia() permission negotiation to avoid iframe sandbox permission blocks. Transcription features include:'
  );
  addBullet('Continuous Streaming', 'Speech is captured in real-time chunks without requiring the user to pause.');
  addBullet('Interim Text Sync', 'Interim transcriptions appear directly inside the textarea element with auto-scroll.');
  addBullet('Dual Language Listeners', 'Switches between en-KE (Kenyan English) and sw-KE (Kenyan Kiswahili) recognizers automatically.');
  addBullet('Web Audio Visualizer', 'Reads live frequency decibels to render 32 interactive green equalizer bars while the user speaks.');
  addBullet('Gemini AI Fallback', 'If the browser lacks SpeechRecognition (e.g. legacy browsers), recorded audio chunks are sent via Base64 to POST /api/transcribe where gemini-3.5-transcribe extracts the text.');

  addHeading2('3.2 Kenyan Sheng & Kiswahili Linguistic Rules');
  addParagraph(
    'SEMA incorporates a specialized token analysis dictionary containing over 50 Kenyan colloquial terms:'
  );
  addTable(
    ['Language/Dialect', 'Sample Key Tokens', 'Routing Application'],
    [
      ['Kenyan Sheng', 'manze, rada, noma, chapaa, keja, bazenga, tutaisort, mbio', 'Auto-identifies youth/informal reports; generates friendly local responses'],
      ['Kiswahili Sanifu', 'shida, tatizo, stima, huduma, hospitali, mwananchi, haraka', 'Applies national language acknowledgement; flags urgency words'],
      ['Kenyan English', 'outage, router, optical, fiber, downtime, payment, transaction', 'Directly extracts technical domain nouns for automated dispatch'],
    ],
    [25, 40, 35]
  );

  addHeading2('3.3 Frustration & High-Tension Detection Scoring');
  addParagraph(
    'Every incident receives a Frustration Score from 0 to 100 based on linguistic sentiment, emergency keywords (e.g., hospital discharge, medical paybill stuck, commercial link down), and outage duration. Reports scoring 70+ are automatically flagged as High Tension, triggering visual danger badges in the NOC console and expedited 30-minute / 2-hour SLAs.'
  );

  // ==========================================
  // PAGE 5: NOC ADMIN DISPATCH & EMAIL AUTOMATION
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('4. NOC Admin Dispatch & Email Automation');
  addParagraph(
    'The Network Operations Center (NOC) Admin Console provides real-time triage, interactive milestone tracking, automated AI team assignment, and email dispatch notices for field engineers.'
  );

  addHeading2('4.1 Safaricom Response Teams & Designated Leads');
  const teamsTable = [
    ['Home Fibre & Enterprise NOC', 'Eng. Dennis Kiprono', 'dennis.kiprono@safaricom.co.ke', '2 Hours'],
    ['M-PESA Escalations & Reversals', 'Officer Grace Mwangi', 'grace.mwangi@safaricom.co.ke', '30 Mins'],
    ['4G/5G BTS & RAN Mobile Team', 'Supervisor Brian Otieno', 'brian.otieno@safaricom.co.ke', '4 Hours'],
    ['SIM Swap & Cyber-Fraud Unit', 'Insp. Hassan Ali', 'hassan.ali@safaricom.co.ke', '1 Hour'],
    ['Customer Care & Airtime Billing', 'Coord. Agnes Muthoni', 'agnes.muthoni@safaricom.co.ke', '24 Hours'],
    ['Lipa Na M-PESA & Merchant Desk', 'Lead John Kimani', 'john.kimani@safaricom.co.ke', '6 Hours'],
  ];
  addTable(['Response Team Name', 'Lead Officer', 'Official Email Address', 'Target SLA'], teamsTable, [30, 25, 30, 15]);

  addHeading2('4.2 Automated Incident Dispatch Notices');
  addParagraph(
    'When an incident is assigned (either manually or via the 1-Click AI Auto-Assign All button), the system generates an official dispatch notice sent to the assigned field officers email. The notice includes incident reference, SLA deadline, full original text, translation, coordinates, and diagnostic directives.'
  );

  addHeading2('4.3 Incident Lifecycle Milestones');
  addBullet('Received (Amber)', 'Newly logged by citizen; awaiting NOC triage or initial engineering review.');
  addBullet('Assigned (Blue)', 'Field officer and response team assigned; dispatch notice transmitted.');
  addBullet('In Progress (Purple)', 'Field crew mobilized on-site; optical fiber splicing or switch query active.');
  addBullet('Resolved (Emerald)', 'Remedial action verified; customer link restored; SLA cleared.');

  // ==========================================
  // PAGE 6: COMPREHENSIVE REST API REFERENCE
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('5. Comprehensive REST API Reference');
  addParagraph('All endpoints accept and return JSON payloads and run on the primary server application.');

  addHeading2('5.1 Public Reporting Endpoints');
  addBullet('POST /api/submissions', 'Submit an incident report. Accepts { text, countyOrWard, contactInfo, captureMethod }. Returns created submission with referenceCode, detectedLanguage, priority, and aiCommitmentResponse.');
  addBullet('POST /api/transcribe', 'Transcribe voice audio chunk. Accepts { audioBase64, mimeType, languageHint, clientTranscript }. Returns { transcript, detectedLanguage, englishTranslation }.');
  addBullet('POST /api/transform-text', 'Refine or translate text. Accepts { text, targetMode: "polish"|"to_en"|"to_sw"|"to_sheng" }. Returns { transformedText }.');
  addBullet('POST /api/sample-voice', 'Fetch sample audio with Kenyan accent. Accepts { language: "en"|"sw"|"sheng" }. Returns sample transcript and base64 audio.');

  addHeading2('5.2 NOC Dispatch & Management Endpoints');
  addBullet('GET /api/submissions', 'Fetch all logged incident reports with current status, priority, and assigned team.');
  addBullet('POST /api/submissions/:id/ai-classify', 'Execute Gemini AI classification for a single incident to generate category, urgency, SLA, and rationale.');
  addBullet('PATCH /api/submissions/:id/assign', 'Assign an incident to a response team and officer. Body: { assignedTeam, assignedOfficer, priority, status, adminNotes, sendEmailAlert }. Returns updated record and created email alert.');
  addBullet('POST /api/submissions/:id/send-email-alert', 'Manually dispatch or re-send dispatch email alert notice to the assigned officer.');
  addBullet('POST /api/submissions/auto-assign-all', 'Marquee batch operation: Triages all unassigned reports using Gemini AI, assigns optimal teams, and dispatches email notices.');
  addBullet('PATCH /api/submissions/:id/status', 'Quick status update for an incident (e.g. Received -> In Progress -> Resolved). Body: { status }.');
  addBullet('GET /api/email-alerts', 'Fetch all dispatched officer email audit records.');

  // ==========================================
  // PAGE 7: STANDARD OPERATING PROCEDURES (SOPS)
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('6. Standard Operating Procedures (SOPs)');

  addHeading2('SOP-01: Citizen Voice Reporting Protocol');
  addParagraph('Purpose: Ensure high-fidelity capture of citizen network or payment issues without typing barriers.');
  addBullet('Step 1', 'Citizen scans SEMA QR Code on poster, router box, or bill. The device immediately opens https://<domain>/?view=customer#customer-portal.');
  addBullet('Step 2', 'Citizen clicks "Tap to Speak (Mic)" and speaks naturally in English, Kiswahili, or Sheng.');
  addBullet('Step 3', 'Real-time transcript streams into the text box. The user verifies the text, selects county/ward, and clicks "Submit Safaricom Report".');
  addBullet('Step 4', 'System generates SEMA-SAF reference code and instant localized AI commitment response.');

  addHeading2('SOP-02: NOC Rapid Triage & AI Batch Auto-Assignment');
  addParagraph('Purpose: Prevent backlog and mobilize field teams within 5 minutes of incident logging.');
  addBullet('Step 1', 'NOC Controller accesses Dispatch Console at #admin.');
  addBullet('Step 2', 'Reviews unassigned queue metric counter. Clicks "AI Auto-Assign All" marquee button.');
  addBullet('Step 3', 'Gemini AI evaluates all pending reports, calculates urgency SLAs, maps to specialized teams, and dispatches email alerts to team leads.');
  addBullet('Step 4', 'NOC Controller verifies high-tension (red border) items and contacts field leads directly if required.');

  addHeading2('SOP-03: Field Engineering Remediation & SLA Clearance');
  addParagraph('Purpose: Verify on-site technical resolution and update central records.');
  addBullet('Step 1', 'Field engineer receives dispatch notice email on mobile with incident coordinates and customer problem statement.');
  addBullet('Step 2', 'Engineer opens dispatch link, sets status to "In Progress", and conducts physical repair (e.g. fiber OTDR re-splicing or BTS reset).');
  addBullet('Step 3', 'Once optical power or network carriers are verified within specification, engineer sets status to "Resolved" and logs clearance notes.');

  // ==========================================
  // PAGE 8: TROUBLESHOOTING & SECURITY
  // ==========================================
  doc.addPage();
  y = 45;

  addHeading1('7. Troubleshooting, Security & Reliability');

  addHeading2('7.1 Troubleshooting Matrix');
  const troubleRows = [
    ['Microphone Access Denied', 'Browser blocked mic permission or iframe lack', 'Call explicit navigator.mediaDevices.getUserMedia before SpeechRecognition.start()'],
    ['SpeechRecognition Not Found', 'Firefox or older browser without webkitSpeechRecognition', 'App falls back to client textarea editing and Gemini server-side transcription'],
    ['QR Code Resolving to Localhost', 'Phone camera scanning localhost URL', 'getScannableWebUrl() dynamically substitutes public HTTPS Cloud Run domain'],
    ['Gemini API Rate Limit / No Key', 'Missing or exhausted GEMINI_API_KEY env variable', 'Autonomous fallback to built-in rule-based classifier and Sheng token engine'],
  ];
  addTable(['Observed Issue', 'Root Cause', 'Automated Mitigation / Resolution'], troubleRows, [30, 30, 40]);

  addHeading2('7.2 Security & Data Privacy Protocols');
  addBullet('Anonymity by Default', 'Citizen phone numbers and contacts are strictly optional; anonymous civic reporting is fully supported.');
  addBullet('No Secret Storage in Frontend', 'All Gemini AI calls and email dispatch configurations reside on the backend server.');
  addBullet('Sanitized Git Configuration', 'PATs and deployment credentials are removed immediately after deployment sync.');
  addBullet('Data Sanitization', 'Submissions strip malicious HTML/script injections before storage and rendering.');

  addHeading2('7.3 Version History & Release Notes');
  addBullet('v1.0.0 (Launch)', 'Core citizen text reporting, basic admin table, and rule-based categorization.');
  addBullet('v1.2.0 (Intelligence)', 'Integrated Google Gemini 2.5 AI, Sheng linguistic model, and interactive SLA tracking.');
  addBullet('v1.5.0 (Voice & QR)', 'Added real-time Web Speech transcription, audio wave visualizer, and dynamic QR code.');
  addBullet('v2.1.0 (Current)', 'High-tension sentiment scoring, automated field engineer email routing, and one-click PDF technical manual export.');

  // Add headers/footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  // Save to public, dist, and docs
  const outPathPublic = path.join(__dirname, '../public/Safaricom-SEMA-Technical-Documentation.pdf');
  const outPathDocs = path.join(__dirname, '../docs/Safaricom-SEMA-Technical-Documentation.pdf');
  const outPathDist = path.join(__dirname, '../dist/Safaricom-SEMA-Technical-Documentation.pdf');

  const pdfData = doc.output();
  fs.writeFileSync(outPathPublic, pdfData, 'binary');
  console.log('PDF generated successfully at:', outPathPublic);

  if (fs.existsSync(path.dirname(outPathDocs))) {
    fs.writeFileSync(outPathDocs, pdfData, 'binary');
  }
  if (fs.existsSync(path.dirname(outPathDist))) {
    fs.writeFileSync(outPathDist, pdfData, 'binary');
  }
}

generateDocumentationPdf();
