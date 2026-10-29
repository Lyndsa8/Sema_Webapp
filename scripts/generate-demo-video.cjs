const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_DIR = path.join(__dirname, 'demo_temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 7 Scenes totalling 75 seconds
const SCENES = [
  {
    id: 1,
    title: 'Customer Portal & Multilingual Typewriter',
    duration: 11,
    narration: 'Welcome to Safaricom SEMA, the intelligent citizen incident reporting and NOC response platform. When a customer opens the portal, they are greeted in English, Kiswahili, or Sheng with zero login barriers.',
    render: (frameRatio) => {
      // frameRatio from 0 to 1
      const cursorX = 350 + frameRatio * 200;
      const cursorY = 280 + Math.sin(frameRatio * Math.PI) * 40;
      const phrases = ['Tell Safaricom the problem and we will fix it.', 'Tuambie shida yako ya Safaricom na tutaitatua.', 'Tuchanue rada ya Safaricom ni gani na tutaisort.'];
      const activePhrase = phrases[Math.floor(frameRatio * phrases.length) % phrases.length];
      return `
        <rect width="1280" height="720" fill="#0f172a"/>
        <!-- Browser Window -->
        <rect x="40" y="30" width="1200" height="660" rx="14" fill="#ffffff" stroke="#334155" stroke-width="2"/>
        <rect x="40" y="30" width="1200" height="42" rx="14" fill="#f8fafc"/>
        <circle cx="65" cy="51" r="5" fill="#ef4444"/>
        <circle cx="80" cy="51" r="5" fill="#f59e0b"/>
        <circle cx="95" cy="51" r="5" fill="#10b981"/>
        <rect x="240" y="38" width="600" height="26" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="255" y="55" font-family="monospace" font-size="12" fill="#065f46">https://safaricom.co.ke/sema#customer-portal</text>

        <!-- Safaricom Header -->
        <rect x="40" y="72" width="1200" height="64" fill="#064e3b"/>
        <rect x="70" y="86" width="36" height="36" rx="8" fill="#10b981"/>
        <text x="82" y="110" font-family="sans-serif" font-weight="bold" font-size="20" fill="#ffffff">S</text>
        <text x="118" y="105" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff">SAFARICOM SEMA</text>
        <text x="118" y="120" font-family="sans-serif" font-size="10" fill="#a7f3d0">Sauti ya Mwananchi · Rapid Response Portal</text>

        <!-- Header Nav Items -->
        <text x="760" y="109" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff">Customer Portal</text>
        <text x="890" y="109" font-family="sans-serif" font-size="12" fill="#d1fae5">Technical Docs</text>
        <text x="1000" y="109" font-family="sans-serif" font-size="12" fill="#d1fae5">NOC Console</text>
        <rect x="1110" y="88" width="100" height="32" rx="6" fill="#10b981"/>
        <text x="1125" y="108" font-family="sans-serif" font-weight="bold" font-size="11" fill="#064e3b">75s Demo</text>

        <!-- Main Portal Hero -->
        <text x="70" y="180" font-family="sans-serif" font-size="12" font-weight="bold" fill="#065f46">OFFICIAL RAPID INCIDENT REPORTING · SAFARICOM KENYA</text>
        <text x="70" y="215" font-family="sans-serif" font-weight="900" font-size="26" fill="#0f172a">${activePhrase}</text>
        <rect x="70" y="235" width="80" height="24" rx="4" fill="#ecfdf5" stroke="#a7f3d0"/>
        <text x="80" y="251" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065f46">English</text>
        <rect x="160" y="235" width="85" height="24" rx="4" fill="#ecfdf5" stroke="#a7f3d0"/>
        <text x="170" y="251" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065f46">Kiswahili</text>
        <rect x="255" y="235" width="75" height="24" rx="4" fill="#ecfdf5" stroke="#a7f3d0"/>
        <text x="265" y="251" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065f46">Sheng</text>

        <!-- Voice & Text Box Container (Left 8 cols) -->
        <rect x="70" y="275" width="730" height="320" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <rect x="70" y="275" width="730" height="45" rx="12" fill="#f8fafc"/>
        <text x="90" y="303" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">SEMA Voice &amp; Text Capture Box</text>
        <text x="90" y="335" font-family="sans-serif" font-size="11" fill="#64748b">Speak in English, Kiswahili, or Sheng — words transcribe in real-time</text>

        <!-- Mic Button -->
        <rect x="90" y="355" width="180" height="42" rx="8" fill="#047857"/>
        <circle cx="112" cy="376" r="8" fill="#ffffff"/>
        <text x="128" y="381" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">Tap to Speak (Mic)</text>

        <!-- Textarea Mock -->
        <rect x="90" y="410" width="690" height="110" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="105" y="440" font-family="sans-serif" font-size="13" fill="#94a3b8">Describe your Home Fibre, M-PESA or network problem here...</text>

        <!-- Submit Button -->
        <rect x="90" y="535" width="220" height="42" rx="8" fill="#047857"/>
        <text x="110" y="561" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">Submit Safaricom Report</text>

        <!-- QR Code Panel (Right 4 cols) -->
        <rect x="830" y="275" width="380" height="320" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="850" y="305" font-family="sans-serif" font-weight="bold" font-size="13" fill="#0f172a">Customer Portal Direct QR</text>
        <rect x="920" y="325" width="190" height="190" rx="8" fill="#ecfdf5" stroke="#a7f3d0"/>
        <!-- Simulated QR Pattern -->
        <rect x="940" y="345" width="50" height="50" fill="#064e3b"/>
        <rect x="950" y="355" width="30" height="30" fill="#ffffff"/>
        <rect x="1040" y="345" width="50" height="50" fill="#064e3b"/>
        <rect x="1050" y="355" width="30" height="30" fill="#ffffff"/>
        <rect x="940" y="445" width="50" height="50" fill="#064e3b"/>
        <rect x="950" y="455" width="30" height="30" fill="#ffffff"/>
        <rect x="1010" y="415" width="30" height="30" fill="#064e3b"/>
        <text x="870" y="540" font-family="sans-serif" font-weight="bold" font-size="11" fill="#065f46">Scan with Phone to Open Portal</text>
        <text x="860" y="560" font-family="monospace" font-size="10" fill="#64748b">safaricom.co.ke/?view=customer#portal</text>

        <!-- Animated Mouse Cursor -->
        <polygon points="${cursorX},${cursorY} ${cursorX+12},${cursorY+20} ${cursorX+18},${cursorY+18} ${cursorX+24},${cursorY+28} ${cursorX+29},${cursorY+26} ${cursorX+22},${cursorY+15} ${cursorX+28},${cursorY+12}" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
      `;
    },
  },
  {
    id: 2,
    title: 'Continuous Voice Recording & Live Audio Waveform',
    duration: 13,
    narration: 'With one tap on the microphone, the citizen speaks naturally. Our continuous Speech Recognition engine transcribes every word in real time directly into the text box, accompanied by a dynamic frequency audio visualizer.',
    render: (frameRatio) => {
      const fullText = "Router ya Safaricom Home Fibre inawaka red hapa Roysambu karibu na TRM tangu jana usiku, internet imelost na kazi imesimama. Tafadhali tusaidieni kuangalia fiber cable haraka.";
      const charsToShow = Math.floor(frameRatio * fullText.length);
      const streamedText = fullText.substring(0, charsToShow);
      const line1 = streamedText.substring(0, 75);
      const line2 = streamedText.substring(75);

      return `
        <rect width="1280" height="720" fill="#0f172a"/>
        <!-- Browser Window -->
        <rect x="40" y="30" width="1200" height="660" rx="14" fill="#ffffff" stroke="#334155" stroke-width="2"/>
        <rect x="40" y="30" width="1200" height="42" rx="14" fill="#f8fafc"/>
        <text x="255" y="55" font-family="monospace" font-size="12" fill="#065f46">https://safaricom.co.ke/sema#customer-portal</text>

        <!-- Safaricom Header -->
        <rect x="40" y="72" width="1200" height="64" fill="#064e3b"/>
        <text x="118" y="105" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff">SAFARICOM SEMA</text>
        <text x="118" y="120" font-family="sans-serif" font-size="10" fill="#a7f3d0">Voice &amp; Text Incident Ingestion</text>

        <!-- Voice Capture Box Focused -->
        <rect x="70" y="160" width="730" height="460" rx="12" fill="#ffffff" stroke="#059669" stroke-width="2"/>
        <rect x="70" y="160" width="730" height="50" rx="12" fill="#ecfdf5"/>
        <text x="95" y="192" font-family="sans-serif" font-weight="bold" font-size="15" fill="#064e3b">● Live Voice Stream Active · Kenyan Speech Engine</text>
        <rect x="670" y="172" width="110" height="26" rx="4" fill="#dc2626"/>
        <circle cx="682" cy="185" r="4" fill="#ffffff"/>
        <text x="692" y="189" font-family="sans-serif" font-weight="bold" font-size="11" fill="#ffffff">RECORDING</text>

        <!-- Dynamic Equalizer Frequency Waveform (28 bars) -->
        <rect x="90" y="230" width="690" height="60" rx="8" fill="#064e3b"/>
        ${Array.from({ length: 28 }).map((_, i) => {
          const h = 10 + Math.abs(Math.sin(i * 0.7 + frameRatio * 15)) * 40;
          const yPos = 260 - h / 2;
          return `<rect x="${110 + i * 23}" y="${yPos}" width="8" height="${h}" rx="3" fill="#34d399"/>`;
        }).join('')}

        <!-- Transcribing Text Area -->
        <rect x="90" y="310" width="690" height="150" rx="8" fill="#f8fafc" stroke="#059669" stroke-width="1.5"/>
        <text x="110" y="345" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0f172a">${line1}</text>
        <text x="110" y="375" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0f172a">${line2}</text>
        <rect x="${110 + (line2.length ? line2.length * 8.5 : line1.length * 8.5)}" y="${line2.length ? 362 : 332}" width="2.5" height="18" fill="#059669"/>

        <!-- Detected Language Tag -->
        <rect x="90" y="480" width="220" height="30" rx="6" fill="#ecfdf5" stroke="#a7f3d0"/>
        <text x="105" y="500" font-family="sans-serif" font-weight="bold" font-size="11" fill="#065f46">✓ Detected: Kiswahili (Kenyan Voice)</text>

        <!-- Submit Button -->
        <rect x="90" y="530" width="220" height="42" rx="8" fill="#059669"/>
        <text x="110" y="556" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">Submit Safaricom Report</text>

        <!-- Right Side Panel -->
        <rect x="830" y="160" width="380" height="460" rx="12" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="855" y="195" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">Continuous Real-Time Processing</text>
        <rect x="855" y="220" width="330" height="90" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="870" y="245" font-family="sans-serif" font-size="12" font-weight="bold" fill="#047857">Web Speech Recognition API</text>
        <text x="870" y="265" font-family="sans-serif" font-size="11" fill="#64748b">Streaming interim words instantly</text>
        <text x="870" y="285" font-family="sans-serif" font-size="11" fill="#64748b">zero typing required</text>
      `;
    },
  },
  {
    id: 3,
    title: 'Sheng Dialect Detection & AI Text Translation',
    duration: 12,
    narration: 'The built-in Kenyan linguistic engine instantly detects the dialect, normalizes colloquial Sheng terms, and offers one-click translation into professional English and Swahili for technical clarity.',
    render: (frameRatio) => {
      return `
        <rect width="1280" height="720" fill="#0f172a"/>
        <!-- Browser Window -->
        <rect x="40" y="30" width="1200" height="660" rx="14" fill="#ffffff" stroke="#334155" stroke-width="2"/>
        <rect x="40" y="30" width="1200" height="42" rx="14" fill="#f8fafc"/>
        <text x="255" y="55" font-family="monospace" font-size="12" fill="#065f46">https://safaricom.co.ke/sema#customer-portal</text>

        <!-- Header -->
        <rect x="40" y="72" width="1200" height="64" fill="#064e3b"/>
        <text x="118" y="105" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff">SAFARICOM SEMA</text>
        <text x="118" y="120" font-family="sans-serif" font-size="10" fill="#a7f3d0">Kenyan Multilingual NLP Normalizer</text>

        <!-- Dialect Comparison Grid -->
        <rect x="70" y="160" width="1140" height="460" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="100" y="200" font-family="sans-serif" font-weight="bold" font-size="18" fill="#0f172a">Kenyan Sheng &amp; Swahili Automatic Translation Engine</text>

        <!-- Original Sheng/Swahili Card -->
        <rect x="100" y="230" width="530" height="180" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <rect x="100" y="230" width="530" height="36" rx="10" fill="#e2e8f0"/>
        <text x="120" y="253" font-family="sans-serif" font-weight="bold" font-size="12" fill="#334155">Original Citizen Speech (Kiswahili / Sheng Mix)</text>
        <text x="120" y="295" font-family="sans-serif" font-size="14" fill="#0f172a">"Router ya Safaricom Home Fibre inawaka red hapa</text>
        <text x="120" y="325" font-family="sans-serif" font-size="14" fill="#0f172a">Roysambu karibu na TRM tangu jana usiku, internet imelost</text>
        <text x="120" y="355" font-family="sans-serif" font-size="14" fill="#0f172a">na kazi imesimama. Tusaidieni kuangalia cable haraka."</text>

        <!-- AI English Technical Translation Card -->
        <rect x="670" y="230" width="530" height="180" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
        <rect x="670" y="230" width="530" height="36" rx="10" fill="#10b981"/>
        <text x="690" y="253" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff">Google Gemini 2.5 Technical English Translation</text>
        <text x="690" y="295" font-family="sans-serif" font-size="14" fill="#064e3b">"The Safaricom Home Fibre router displays a blinking red</text>
        <text x="690" y="325" font-family="sans-serif" font-size="14" fill="#064e3b">LOS optical indicator in Roysambu near TRM since last night.</text>
        <text x="690" y="355" font-family="sans-serif" font-size="14" fill="#064e3b">Total broadband outage halting commercial remote work."</text>

        <!-- Location Dropdown Mock -->
        <rect x="100" y="440" width="530" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="120" y="470" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">County / Ward: Nairobi · Roysambu / Lumumba Drive</text>

        <rect x="670" y="440" width="530" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="690" y="470" font-family="sans-serif" font-size="13" font-weight="bold" fill="#047857">Category: Home Fibre &amp; Fixed Internet (Red LOS Outage)</text>

        <rect x="490" y="525" width="300" height="46" rx="8" fill="#047857"/>
        <text x="540" y="554" font-family="sans-serif" font-weight="bold" font-size="15" fill="#ffffff">Submit Safaricom Report</text>
      `;
    },
  },
  {
    id: 4,
    title: 'Incident Logging, Reference Code & SLA Commitment',
    duration: 12,
    narration: 'The citizen clicks submit and immediately receives an official tracking reference code, priority classification, and a localized commitment message assuring them field engineers are mobilized.',
    render: (frameRatio) => {
      return `
        <rect width="1280" height="720" fill="#0f172a"/>
        <!-- Browser Window -->
        <rect x="40" y="30" width="1200" height="660" rx="14" fill="#ffffff" stroke="#334155" stroke-width="2"/>
        <rect x="40" y="30" width="1200" height="42" rx="14" fill="#f8fafc"/>
        <text x="255" y="55" font-family="monospace" font-size="12" fill="#065f46">https://safaricom.co.ke/sema#customer-portal</text>

        <!-- Header -->
        <rect x="40" y="72" width="1200" height="64" fill="#064e3b"/>
        <text x="118" y="105" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff">SAFARICOM SEMA</text>
        <text x="118" y="120" font-family="sans-serif" font-size="10" fill="#a7f3d0">Incident Logged &amp; Verified</text>

        <!-- Large Confirmation Card Modal -->
        <rect x="240" y="160" width="800" height="460" rx="16" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
        <rect x="240" y="160" width="800" height="70" rx="16" fill="#ecfdf5"/>
        <circle cx="280" cy="195" r="16" fill="#10b981"/>
        <path d="M272 195 L278 201 L289 190" stroke="#ffffff" stroke-width="3" fill="none"/>
        <text x="310" y="196" font-family="sans-serif" font-weight="bold" font-size="18" fill="#064e3b">Incident Successfully Registered</text>
        <text x="310" y="215" font-family="sans-serif" font-size="11" fill="#047857">Transmitted directly to Safaricom Network Operations Center (NOC)</text>

        <rect x="880" y="178" width="130" height="32" rx="6" fill="#dc2626"/>
        <text x="898" y="199" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff">URGENT (2h SLA)</text>

        <!-- Incident Metadata Table -->
        <rect x="280" y="250" width="720" height="170" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="310" y="285" font-family="sans-serif" font-size="13" fill="#64748b">Incident Reference Code:</text>
        <text x="540" y="285" font-family="monospace" font-weight="bold" font-size="16" fill="#065f46">SEMA-SAF-8041</text>

        <text x="310" y="320" font-family="sans-serif" font-size="13" fill="#64748b">Designated Response Team:</text>
        <text x="540" y="320" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">Safaricom Home Fibre &amp; Enterprise NOC</text>

        <text x="310" y="355" font-family="sans-serif" font-size="13" fill="#64748b">Assigned Lead Engineer:</text>
        <text x="540" y="355" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">Eng. Dennis Kiprono (dennis.kiprono@safaricom.co.ke)</text>

        <text x="310" y="390" font-family="sans-serif" font-size="13" fill="#64748b">Incident Location:</text>
        <text x="540" y="390" font-family="sans-serif" font-size="14" fill="#0f172a">Nairobi · Roysambu / Lumumba Drive</text>

        <!-- SEMA Commitment Notice -->
        <rect x="280" y="440" width="720" height="70" rx="8" fill="#064e3b"/>
        <text x="310" y="468" font-family="sans-serif" font-weight="bold" font-size="12" fill="#a7f3d0">SEMA OFFICIAL ACTION COMMITMENT:</text>
        <text x="310" y="492" font-family="sans-serif" font-size="13" fill="#ffffff">"Tumepokea ripoti yako kuhusu mtandao wa Home Fibre Roysambu. Timu ya fiber engineering imetumwa."</text>

        <rect x="540" y="535" width="200" height="40" rx="8" fill="#0f172a"/>
        <text x="575" y="560" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">Track in NOC Console</text>
      `;
    },
  },
  {
    id: 5,
    title: 'Mobile Scannable QR Code Direct Deep-Linking',
    duration: 10,
    narration: 'On posters, bills, or router packages, the scannable QR code provides direct mobile access, automatically routing smartphone cameras straight into the customer reporting flow without admin delays.',
    render: (frameRatio) => {
      return `
        <rect width="1280" height="720" fill="#064e3b"/>
        <!-- Background Grid -->
        <rect x="100" y="60" width="1080" height="600" rx="20" fill="#ffffff"/>

        <text x="150" y="120" font-family="sans-serif" font-weight="bold" font-size="14" fill="#065f46">SAFARICOM SEMA · TOUCHLESS MOBILE ONBOARDING</text>
        <text x="150" y="160" font-family="sans-serif" font-weight="900" font-size="28" fill="#0f172a">Scan QR Code with Any Phone Camera</text>
        <text x="150" y="190" font-family="sans-serif" font-size="14" fill="#64748b">Direct link routes instantly to Customer Portal voice capture on iOS and Android</text>

        <!-- Giant High-Def QR Code Mockup -->
        <rect x="150" y="220" width="340" height="340" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <rect x="175" y="245" width="80" height="80" fill="#064e3b"/>
        <rect x="195" y="265" width="40" height="40" fill="#ffffff"/>
        <rect x="385" y="245" width="80" height="80" fill="#064e3b"/>
        <rect x="405" y="265" width="40" height="40" fill="#ffffff"/>
        <rect x="175" y="455" width="80" height="80" fill="#064e3b"/>
        <rect x="195" y="475" width="40" height="40" fill="#ffffff"/>
        <rect x="290" y="340" width="60" height="60" fill="#10b981"/>
        <text x="210" y="585" font-family="monospace" font-weight="bold" font-size="12" fill="#065f46">SEMA-CUSTOMER-PORTAL-QR</text>

        <!-- Simulated Smartphone Camera Preview -->
        <rect x="560" y="190" width="280" height="440" rx="30" fill="#0f172a" stroke="#334155" stroke-width="4"/>
        <rect x="580" y="220" width="240" height="380" rx="14" fill="#1e293b"/>
        <!-- Camera Viewfinder reticle -->
        <rect x="610" y="260" width="180" height="180" rx="10" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="8 6"/>
        <text x="635" y="360" font-family="sans-serif" font-size="11" fill="#a7f3d0">QR Code Detected</text>

        <!-- iOS/Android Notification Banner Mockup -->
        <rect x="590" y="235" width="220" height="50" rx="10" fill="#ffffff"/>
        <rect x="600" y="245" width="30" height="30" rx="6" fill="#064e3b"/>
        <text x="638" y="258" font-family="sans-serif" font-weight="bold" font-size="10" fill="#0f172a">Camera · Safaricom</text>
        <text x="638" y="274" font-family="sans-serif" font-size="10" fill="#059669">Open in Safari (SEMA)</text>

        <!-- Feature Points -->
        <text x="890" y="260" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">Zero Installation Friction</text>
        <text x="890" y="290" font-family="sans-serif" font-size="13" fill="#64748b">• No App Store download required</text>
        <text x="890" y="320" font-family="sans-serif" font-size="13" fill="#64748b">• Native camera QR recognition</text>
        <text x="890" y="350" font-family="sans-serif" font-size="13" fill="#64748b">• Resolves directly to #customer-portal</text>
        <text x="890" y="380" font-family="sans-serif" font-size="13" fill="#64748b">• Deployed on public Cloud Run domain</text>

        <rect x="890" y="420" width="230" height="42" rx="8" fill="#047857"/>
        <text x="915" y="446" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">Open Portal Experience</text>
      `;
    },
  },
  {
    id: 6,
    title: 'Safaricom NOC Dispatch Command & Automated Email Routing',
    duration: 12,
    narration: 'Behind the scenes, NOC controllers access the dispatch console. High-tension sentiment and critical outages are flagged in red. With one click, AI Auto-Assign routes tickets and dispatches automated email alerts to field engineers.',
    render: (frameRatio) => {
      return `
        <rect width="1280" height="720" fill="#0f172a"/>
        <!-- Browser Window -->
        <rect x="40" y="30" width="1200" height="660" rx="14" fill="#ffffff" stroke="#334155" stroke-width="2"/>
        <rect x="40" y="30" width="1200" height="42" rx="14" fill="#f8fafc"/>
        <text x="255" y="55" font-family="monospace" font-size="12" fill="#065f46">https://safaricom.co.ke/sema#admin</text>

        <!-- NOC Top Command Bar -->
        <rect x="40" y="72" width="1200" height="60" fill="#064e3b"/>
        <text x="70" y="108" font-family="sans-serif" font-weight="bold" font-size="17" fill="#ffffff">SAFARICOM NOC DISPATCH COMMAND CONSOLE</text>
        <rect x="940" y="86" width="160" height="32" rx="6" fill="#10b981"/>
        <text x="955" y="106" font-family="sans-serif" font-weight="bold" font-size="12" fill="#064e3b">AI Auto-Assign All</text>

        <!-- KPI Metrics Banner -->
        <rect x="70" y="145" width="1140" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="95" y="180" font-family="sans-serif" font-size="13" fill="#64748b">Queue Total: <tspan font-weight="bold" fill="#0f172a">42 Incidents</tspan></text>
        <text x="320" y="180" font-family="sans-serif" font-size="13" fill="#64748b">High-Tension Flags: <tspan font-weight="bold" fill="#dc2626">8 Urgent</tspan></text>
        <text x="580" y="180" font-family="sans-serif" font-size="13" fill="#64748b">Dispatched: <tspan font-weight="bold" fill="#059669">34 Tickets</tspan></text>
        <text x="820" y="180" font-family="sans-serif" font-size="13" fill="#64748b">Automated Email Alerts: <tspan font-weight="bold" fill="#2563eb">34 Sent</tspan></text>

        <!-- High-Tension Highlight Card -->
        <rect x="70" y="220" width="1140" height="110" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
        <rect x="90" y="235" width="170" height="24" rx="4" fill="#dc2626"/>
        <text x="100" y="251" font-family="sans-serif" font-weight="bold" font-size="11" fill="#ffffff">HIGH TENSION (92/100)</text>
        <text x="270" y="251" font-family="monospace" font-weight="bold" font-size="13" fill="#0f172a">SEMA-SAF-8041 · Home Fibre Red LOS Indicator</text>
        <text x="90" y="280" font-family="sans-serif" font-size="12" fill="#7f1d1d">"Router ya Safaricom Home Fibre inawaka red hapa Roysambu tangu jana usiku... remote work blocked"</text>
        <rect x="90" y="295" width="460" height="24" rx="4" fill="#ffffff" stroke="#fca5a5"/>
        <text x="100" y="311" font-family="sans-serif" font-size="11" fill="#991b1b">Assigned to: Eng. Dennis Kiprono (Automated Notice Dispatched)</text>

        <!-- Data Table Mockup -->
        <rect x="70" y="345" width="1140" height="280" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="70" y="345" width="1140" height="35" rx="10" fill="#f1f5f9"/>
        <text x="90" y="367" font-family="sans-serif" font-weight="bold" font-size="11" fill="#475569">Reference</text>
        <text x="240" y="367" font-family="sans-serif" font-weight="bold" font-size="11" fill="#475569">Category</text>
        <text x="450" y="367" font-family="sans-serif" font-weight="bold" font-size="11" fill="#475569">Location</text>
        <text x="670" y="367" font-family="sans-serif" font-weight="bold" font-size="11" fill="#475569">Assigned Team &amp; Officer</text>
        <text x="940" y="367" font-family="sans-serif" font-weight="bold" font-size="11" fill="#475569">Status</text>
        <text x="1060" y="367" font-family="sans-serif" font-weight="bold" font-size="11" fill="#475569">SLA</text>

        <!-- Table Row 1 -->
        <line x1="70" y1="420" x2="1210" y2="420" stroke="#f1f5f9"/>
        <text x="90" y="405" font-family="monospace" font-weight="bold" font-size="11" fill="#065f46">SEMA-SAF-8041</text>
        <text x="240" y="405" font-family="sans-serif" font-size="11" fill="#0f172a">Home Fibre &amp; Fixed Internet</text>
        <text x="450" y="405" font-family="sans-serif" font-size="11" fill="#0f172a">Nairobi · Roysambu</text>
        <text x="670" y="405" font-family="sans-serif" font-size="11" fill="#0f172a">Eng. Dennis Kiprono</text>
        <rect x="940" y="392" width="80" height="20" rx="4" fill="#dbeafe"/>
        <text x="955" y="406" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1e40af">Assigned</text>
        <text x="1060" y="405" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">2 Hours</text>

        <!-- Table Row 2 -->
        <line x1="70" y1="460" x2="1210" y2="460" stroke="#f1f5f9"/>
        <text x="90" y="445" font-family="monospace" font-weight="bold" font-size="11" fill="#065f46">SEMA-SAF-8042</text>
        <text x="240" y="445" font-family="sans-serif" font-size="11" fill="#0f172a">M-PESA &amp; Financial Services</text>
        <text x="450" y="445" font-family="sans-serif" font-size="11" fill="#0f172a">Nairobi · Umoja Hospital</text>
        <text x="670" y="445" font-family="sans-serif" font-size="11" fill="#0f172a">Officer Grace Mwangi</text>
        <rect x="940" y="432" width="80" height="20" rx="4" fill="#fef3c7"/>
        <text x="955" y="446" font-family="sans-serif" font-size="10" font-weight="bold" fill="#92400e">Urgent</text>
        <text x="1060" y="445" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">30 Mins</text>
      `;
    },
  },
  {
    id: 7,
    title: 'Audit Trails, Tech Stack & Downloadable Documentation PDF',
    duration: 5,
    narration: 'Complete with audit trails, SLA tracking, and downloadable technical documentation, Safaricom SEMA transforms customer feedback into rapid field action.',
    render: (frameRatio) => {
      return `
        <rect width="1280" height="720" fill="#064e3b"/>
        <!-- Decorative Background Pattern -->
        <circle cx="640" cy="360" r="320" fill="#047857" opacity="0.4"/>

        <!-- Safaricom Logo Badge -->
        <rect x="580" y="160" width="120" height="120" rx="28" fill="#10b981"/>
        <text x="620" y="245" font-family="sans-serif" font-weight="bold" font-size="72" fill="#ffffff">S</text>

        <text x="640" y="340" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="44" fill="#ffffff">SAFARICOM SEMA</text>
        <text x="640" y="380" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#a7f3d0">Sauti ya Mwananchi · Intelligent NOC Rapid Response</text>

        <!-- Feature Badges -->
        <rect x="240" y="430" width="240" height="60" rx="10" fill="#ffffff"/>
        <text x="360" y="465" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="13" fill="#064e3b">Trilingual Voice &amp; Text</text>

        <rect x="520" y="430" width="240" height="60" rx="10" fill="#ffffff"/>
        <text x="640" y="465" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="13" fill="#064e3b">Google Gemini 2.5 AI</text>

        <rect x="800" y="430" width="240" height="60" rx="10" fill="#ffffff"/>
        <text x="920" y="465" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="13" fill="#064e3b">Field Officer Auto-Dispatch</text>

        <text x="640" y="550" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#ecfdf5">Production Enterprise Release v2.1 · Safaricom PLC Kenya</text>
        <text x="640" y="580" text-anchor="middle" font-family="monospace" font-size="12" fill="#6ee7b7">Download PDF Manual: /Safaricom-SEMA-Technical-Documentation.pdf</text>
      `;
    },
  },
];

async function generateFullVideo() {
  console.log('Generating 75-second professional video with audio narration...');
  const segmentFiles = [];

  for (const scene of SCENES) {
    const sceneId = scene.id;
    const duration = scene.duration;
    console.log(`Rendering Scene ${sceneId}: ${scene.title} (${duration}s)...`);

    // Render 2 keyframes per second to simulate motion
    const fps = 2;
    const totalFrames = duration * fps;
    const sceneFrameDir = path.join(TEMP_DIR, `scene_${sceneId}`);
    if (!fs.existsSync(sceneFrameDir)) fs.mkdirSync(sceneFrameDir, { recursive: true });

    for (let f = 0; f < totalFrames; f++) {
      const ratio = f / totalFrames;
      let innerContent = scene.render(ratio);
      // Auto-escape any stray raw ampersands not part of XML entities
      innerContent = innerContent.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');

      const safeTitle = scene.title.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
      const safeNarration = scene.narration.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;').replace(/"/g, '&quot;');

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        ${innerContent}
        <!-- Subtitle Bar on bottom of video -->
        <rect x="60" y="620" width="1160" height="60" rx="10" fill="#0f172a" opacity="0.95"/>
        <text x="80" y="642" font-family="sans-serif" font-weight="bold" font-size="11" fill="#10b981">AI VOICEOVER NARRATION [Scene ${sceneId}/7 · ${safeTitle}]</text>
        <text x="80" y="663" font-family="sans-serif" font-size="12" fill="#f8fafc">&quot;${safeNarration}&quot;</text>
      </svg>`;

      const frameFilename = path.join(sceneFrameDir, `frame_${String(f).padStart(4, '0')}.svg`);
      fs.writeFileSync(frameFilename, svgContent);
    }

    // Audio narration via flite
    const cleanNarration = scene.narration.replace(/['"]/g, '');
    const audioFile = path.join(TEMP_DIR, `scene_${sceneId}_audio.wav`);
    try {
      execSync(`ffmpeg -y -f lavfi -i "flite=text='${cleanNarration}':voice=kal" -af "apad,aresample=44100" -t ${duration} "${audioFile}"`, { stdio: 'ignore' });
    } catch {
      // Fallback silence tone with beep
      execSync(`ffmpeg -y -f lavfi -i "sine=frequency=440:duration=0.2" -f lavfi -i "anullsrc=r=44100:cl=mono" -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" -t ${duration} "${audioFile}"`, { stdio: 'ignore' });
    }

    // Compile scene video
    const videoSegment = path.join(TEMP_DIR, `scene_${sceneId}.mp4`);
    execSync(`ffmpeg -y -framerate ${fps} -i "${sceneFrameDir}/frame_%04d.svg" -i "${audioFile}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -t ${duration} "${videoSegment}"`, { stdio: 'inherit' });

    segmentFiles.push(videoSegment);
  }

  // Concatenate all 7 scenes
  console.log('Concatenating scenes into complete 75-second MP4 and WebM...');
  const concatList = path.join(TEMP_DIR, 'concat.txt');
  fs.writeFileSync(concatList, segmentFiles.map((f) => `file '${f}'`).join('\n'));

  const outMp4Public = path.join(__dirname, '../public/Safaricom-SEMA-75s-Demo-Walkthrough.mp4');
  const outWebmPublic = path.join(__dirname, '../public/Safaricom-SEMA-75s-Demo-Walkthrough.webm');
  const outMp4Docs = path.join(__dirname, '../docs/Safaricom-SEMA-75s-Demo-Walkthrough.mp4');
  const outWebmDocs = path.join(__dirname, '../docs/Safaricom-SEMA-75s-Demo-Walkthrough.webm');
  const outMp4Dist = path.join(__dirname, '../dist/Safaricom-SEMA-75s-Demo-Walkthrough.mp4');
  const outWebmDist = path.join(__dirname, '../dist/Safaricom-SEMA-75s-Demo-Walkthrough.webm');

  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "${outMp4Public}"`, { stdio: 'inherit' });
  execSync(`ffmpeg -y -i "${outMp4Public}" -c:v libvpx-vp9 -b:v 1500k -c:a libopus "${outWebmPublic}"`, { stdio: 'inherit' });

  // Copy to docs and dist
  [outMp4Docs, outMp4Dist].forEach((dest) => {
    if (fs.existsSync(path.dirname(dest))) fs.copyFileSync(outMp4Public, dest);
  });
  [outWebmDocs, outWebmDist].forEach((dest) => {
    if (fs.existsSync(path.dirname(dest))) fs.copyFileSync(outWebmPublic, dest);
  });

  console.log('Finished! Professional video created at:');
  console.log(outMp4Public);
  console.log(outWebmPublic);
}

generateFullVideo().catch(console.error);
