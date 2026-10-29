/**
 * Comprehensive HTML Documentation Generator for Safaricom SEMA
 * Generates both /public/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html
 * and /public/SEMA-Technical-Documentation.html with complete 25 sections,
 * interactive sidebar, embedded diagrams, print-ready layout, and offline styling.
 */

import fs from 'fs';
import path from 'path';

// Markdown parser helper for tables, code blocks, lists, headers, etc.
function parseMarkdown(md) {
  let html = md;

  // Escape HTML entities inside inline code first
  html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
    const lines = p1.split('\n');
    const lang = lines[0].trim();
    const code = lines.slice(1).join('\n');
    const safeCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="code-container"><div class="code-header"><span class="code-lang">${lang || 'plaintext'}</span><button class="copy-code-btn" onclick="copyCode(this)">Copy</button></div><pre><code class="language-${lang}">${safeCode}</code></pre></div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Convert Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const rows = match.trim().split(/\r?\n/);
    if (rows.length < 2) return match;
    
    // Check if second row is separator
    if (!rows[1].includes('---')) return match;
    
    const parseRow = (row, isHeader = false) => {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      const tag = isHeader ? 'th' : 'td';
      return '<tr>' + cells.map(c => `<${tag}>${formatInline(c)}</${tag}>`).join('') + '</tr>';
    };

    const header = parseRow(rows[0], true);
    const body = rows.slice(2).map(r => parseRow(r, false)).join('\n');

    return `<div class="table-container"><table class="docs-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
  });

  // Headers with IDs
  html = html.replace(/^### (.*$)/gim, (m, p1) => {
    const id = p1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h3 id="${id}">${p1}</h3>`;
  });
  html = html.replace(/^## (.*$)/gim, (m, p1) => {
    const id = p1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h2 id="${id}"><span class="h2-anchor">#</span> ${p1}</h2>`;
  });
  html = html.replace(/^# (.*$)/gim, (m, p1) => {
    return `<h1>${p1}</h1>`;
  });

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="docs-divider" />');

  // Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, (match) => {
    return `<ul class="docs-list">${match}</ul>`;
  });

  // Blockquotes
  html = html.replace(/^\>\s+(.*$)/gim, '<blockquote class="docs-quote">$1</blockquote>');

  // Format Bold & Italics
  html = formatInline(html);

  // Paragraphs
  html = html.split('\n\n').map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<table') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
      return p;
    }
    return `<p>${p}</p>`;
  }).join('\n\n');

  return html;
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

const mdPath = path.resolve('public/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Parse Sections for TOC
const sections = [];
const lines = mdContent.split('\n');
lines.forEach(l => {
  if (l.startsWith('## ') && !l.includes('TABLE OF CONTENTS')) {
    const title = l.replace('## ', '').trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    sections.push({ title, id });
  }
});

const contentHtml = parseMarkdown(mdContent);

const fullHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Safaricom SEMA — Complete System Architecture &amp; Technical Manual</title>
  <meta name="description" content="Complete end-to-end technical documentation, system architecture, database schemas, APIs, and operational runbook for Safaricom SEMA." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --saf-green: #008751;
      --saf-green-dark: #00663d;
      --saf-green-light: #e6f4ea;
      --saf-emerald: #10b981;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
      --text-main: #0f172a;
      --text-muted: #475569;
      --code-bg: #0f172a;
      --sidebar-w: 320px;
      --header-h: 68px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    html {
      scroll-behavior: smooth;
      font-size: 15px;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text-main);
      background-color: #ffffff;
      line-height: 1.68;
      -webkit-font-smoothing: antialiased;
    }

    /* Fixed Top Navigation Bar */
    .top-navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--header-h);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-badge {
      background: linear-gradient(135deg, #008751 0%, #00b36b 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.5px;
      padding: 6px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0, 135, 81, 0.25);
    }

    .brand-titles h1 {
      font-size: 15px;
      font-weight: 700;
      color: var(--slate-900);
      line-height: 1.2;
    }

    .brand-titles span {
      font-size: 11px;
      color: var(--saf-green);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease-in-out;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: #008751;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #007043;
      box-shadow: 0 2px 8px rgba(0, 135, 81, 0.3);
    }

    .btn-secondary {
      background: var(--slate-100);
      color: var(--slate-700);
      border-color: var(--slate-200);
    }
    .btn-secondary:hover {
      background: var(--slate-200);
      color: var(--slate-900);
    }

    /* Layout Structure */
    .docs-wrapper {
      display: flex;
      margin-top: var(--header-h);
      min-height: calc(100vh - var(--header-h));
    }

    /* Sticky Sidebar */
    .docs-sidebar {
      width: var(--sidebar-w);
      height: calc(100vh - var(--header-h));
      position: sticky;
      top: var(--header-h);
      background: var(--slate-50);
      border-right: 1px solid var(--slate-200);
      padding: 1.25rem 1rem;
      overflow-y: auto;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar-search-box {
      position: relative;
    }

    .sidebar-search-input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      border-radius: 8px;
      border: 1px solid var(--slate-200);
      background: #ffffff;
      font-size: 12px;
      color: var(--slate-900);
      outline: none;
      transition: border-color 0.15s;
    }
    .sidebar-search-input:focus {
      border-color: var(--saf-green);
      box-shadow: 0 0 0 2px rgba(0, 135, 81, 0.12);
    }

    .sidebar-search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: var(--slate-600);
    }

    .sidebar-menu-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--slate-600);
      margin-bottom: 6px;
      padding: 0 6px;
    }

    .sidebar-nav {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar-link {
      display: block;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12.5px;
      color: var(--slate-700);
      text-decoration: none;
      line-height: 1.35;
      transition: all 0.15s;
    }

    .sidebar-link:hover {
      background: rgba(0, 135, 81, 0.08);
      color: var(--saf-green-dark);
      font-weight: 500;
    }

    .sidebar-link.active {
      background: #008751;
      color: #ffffff;
      font-weight: 600;
    }

    /* Main Content Area */
    .docs-main {
      flex: 1;
      max-width: 960px;
      padding: 3rem 4rem 8rem 4rem;
      margin: 0 auto;
    }

    /* Typography & Hierarchy */
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid var(--saf-green);
      padding-bottom: 1rem;
    }

    h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-top: 3.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--slate-200);
      scroll-margin-top: calc(var(--header-h) + 20px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .h2-anchor {
      color: var(--saf-green);
      font-size: 1.2rem;
      opacity: 0.7;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--slate-800);
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      scroll-margin-top: calc(var(--header-h) + 20px);
    }

    p {
      margin-bottom: 1.15rem;
      color: #334155;
    }

    strong {
      color: var(--slate-900);
      font-weight: 600;
    }

    /* Architecture Visual Diagrams */
    .diagram-card {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.75rem 0;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
      border: 1px solid #1e293b;
    }

    .diagram-title {
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: #34d399;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .diagram-body {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre;
      color: #f1f5f9;
    }

    /* Tables */
    .table-container {
      margin: 1.75rem 0;
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--slate-200);
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .docs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    .docs-table th {
      background: var(--slate-100);
      color: var(--slate-900);
      font-weight: 600;
      padding: 10px 14px;
      border-bottom: 1px solid var(--slate-200);
      white-space: nowrap;
    }

    .docs-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--slate-100);
      color: var(--slate-700);
      vertical-align: top;
    }

    .docs-table tbody tr:hover {
      background-color: var(--slate-50);
    }

    /* Code Blocks */
    .code-container {
      background: var(--code-bg);
      border-radius: 10px;
      margin: 1.5rem 0;
      overflow: hidden;
      border: 1px solid var(--slate-800);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .code-header {
      background: #1e293b;
      padding: 6px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .code-lang {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
    }

    .copy-code-btn {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .copy-code-btn:hover {
      background: #475569;
    }

    pre code {
      display: block;
      padding: 1rem 1.25rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #f8fafc;
      overflow-x: auto;
    }

    .inline-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88em;
      background: var(--slate-100);
      color: #b91c1c;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--slate-200);
    }

    /* Lists */
    .docs-list {
      margin: 0.75rem 0 1.25rem 1.5rem;
      color: var(--slate-700);
    }
    .docs-list li {
      margin-bottom: 0.5rem;
    }

    /* Blockquotes & Callouts */
    .docs-quote {
      border-left: 4px solid var(--saf-green);
      background: var(--saf-green-light);
      padding: 12px 18px;
      border-radius: 0 8px 8px 0;
      margin: 1.5rem 0;
      color: var(--saf-green-dark);
      font-size: 13.5px;
    }

    .docs-divider {
      border: none;
      border-top: 1px solid var(--slate-200);
      margin: 2.5rem 0;
    }

    /* Print & Offline Layout */
    @media print {
      .top-navbar, .docs-sidebar, .top-actions, .copy-code-btn {
        display: none !important;
      }
      .docs-wrapper {
        margin-top: 0 !important;
      }
      .docs-main {
        max-width: 100% !important;
        padding: 0 !important;
      }
      h2 {
        page-break-before: always;
      }
      .code-container, .table-container, .diagram-card {
        page-break-inside: avoid;
      }
    }

    @media (max-width: 900px) {
      .docs-sidebar {
        display: none;
      }
      .docs-main {
        padding: 2rem 1.5rem 5rem 1.5rem;
      }
    }
  </style>
</head>
<body>

  <!-- Top Sticky Navigation Bar -->
  <nav class="top-navbar">
    <div class="brand-section">
      <div class="brand-logo-badge">
        <span>SAFARICOM</span>
      </div>
      <div class="brand-titles">
        <h1>SEMA Technical Architecture &amp; System Manual</h1>
        <span>Enterprise Production v2.1 · Engineering Division</span>
      </div>
    </div>

    <div class="top-actions">
      <a href="/" class="btn btn-secondary">
        &larr; Back to SEMA App
      </a>
      <button onclick="window.print()" class="btn btn-secondary">
        🖨️ Print / Save as PDF
      </button>
      <a href="/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html" download="Safaricom-SEMA-Complete-Architecture-Manual.html" class="btn btn-primary">
        💾 Download HTML File
      </a>
    </div>
  </nav>

  <div class="docs-wrapper">
    <!-- Sticky Navigation Sidebar -->
    <aside class="docs-sidebar">
      <div class="sidebar-search-box">
        <span class="sidebar-search-icon">🔍</span>
        <input 
          type="text" 
          id="docsSearch" 
          class="sidebar-search-input" 
          placeholder="Filter documentation..." 
          onkeyup="filterSections()"
        />
      </div>

      <div class="sidebar-menu-title">Table of Contents (25 Chapters)</div>
      <ul class="sidebar-nav" id="sidebarNav">
        ${sections.map((s, idx) => `
          <li>
            <a href="#${s.id}" class="sidebar-link" title="${s.title}">
              ${s.title}
            </a>
          </li>
        `).join('')}
      </ul>
    </aside>

    <!-- Main Content Reader -->
    <main class="docs-main">
      <!-- Executive Architecture Diagram Banner -->
      <div class="diagram-card">
        <div class="diagram-title">⚡ HIGHLIGHT: SAFARICOM SEMA ZERO-BARRIER INGESTION &amp; NOC DISPATCH PIPELINE</div>
        <div class="diagram-body">
+---------------------------------------------------------------------------------------------------------+
|                                    SAFARICOM SEMA ENTERPRISE PLATFORM                                    |
+---------------------------------------------------------------------------------------------------------+
       |
       |-- [1. CITIZEN TOUCHLESS INGESTION]
       |     * In-Browser Web Speech API + Web Audio Oscilloscope (No App Store / Zero Friction)
       |     * Trilingual Ingestion: English, Kiswahili Sanifu, Sheng ("router inawaka red", "chapaa")
       |     * Dynamic GPS / Ward Geotagging + MSISDN Verification
       |
       |-- [2. INTELLIGENT AI TRIAGE (Google Gemini 2.5 Flash)]
       |     * Zero-Shot Dialect Normalization &amp; English Technical Translation
       |     * 7-Category Operational Classification (Home Fibre, M-PESA, 4G/5G RAN, Billing, Core)
       |     * Dynamic Tension &amp; Churn Risk Scoring (Critical, High, Medium, Low)
       |     * 3-Step Prescriptive Engineering Directives Generation
       |
       |-- [3. MULTI-CHANNEL OMNICHANNEL INFLOW AGGREGATOR]
       |     * Ingests Call Center CRM, WhatsApp, Twitter (X), LinkedIn, Instagram, Email &amp; Voice Portal
       |     * Real-time Multi-Dimensional Category &amp; County/Town Filter Stream
       |
       |-- [4. AUTOMATED ROOT CAUSE CLUSTERING &amp; OUTAGE ISOLATION]
       |     * Dynamic Geo-Spatial Cluster Detection (e.g., Ruaka 96-Core Limuru Rd Fiber Cut)
       |     * Automatic Deduplication: 73 duplicate calls merged into 1 Master Outage Incident
       |     * 1-Click Mass Broadcast SMS ("Tunaomba radhi, wataalamu wetu wako kazini...")
       |
       |-- [5. NOC FIELD DISPATCH &amp; SLA ORCHESTRATION]
       |     * Instant Lead Field Engineer Assignment (Eng. Dennis Kiprop, Eng. Faith Wanjiku, etc.)
       |     * Automated HTML Dispatch Alert Email with Technical Scope &amp; Direct Dashboard Deeplink
       |     * Real-time SLA Countdown Clocks &amp; Escalation Threshold Warnings
+---------------------------------------------------------------------------------------------------------+
        </div>
      </div>

      <!-- Main Unabridged Markdown-Rendered Documentation -->
      ${contentHtml}

    </main>
  </div>

  <script>
    // Copy code button handler
    function copyCode(btn) {
      const pre = btn.closest('.code-container').querySelector('pre code');
      if (!pre) return;
      navigator.clipboard.writeText(pre.innerText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.background = '';
        }, 2000);
      });
    }

    // Sidebar search filter
    function filterSections() {
      const q = document.getElementById('docsSearch').value.toLowerCase();
      const items = document.querySelectorAll('#sidebarNav li');
      items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    }

    // Scroll spy for active TOC link
    window.addEventListener('DOMContentLoaded', () => {
      const links = document.querySelectorAll('.sidebar-link');
      const headers = document.querySelectorAll('h2[id]');

      function onScroll() {
        let currentId = '';
        const scrollPos = window.scrollY + 100;

        headers.forEach(h => {
          if (h.offsetTop <= scrollPos) {
            currentId = h.id;
          }
        });

        links.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + currentId) {
            link.classList.add('active');
          }
        });
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    });
  </script>
</body>
</html>`;

// Write to both paths for seamless access
fs.writeFileSync(path.resolve('public/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html'), fullHtml, 'utf8');
fs.writeFileSync(path.resolve('public/SEMA-Technical-Documentation.html'), fullHtml, 'utf8');

console.log("Successfully generated both HTML documentation files!");
console.log("File 1: public/SEMA-COMPLETE-SYSTEM-DOCUMENTATION.html (" + fullHtml.length + " bytes)");
console.log("File 2: public/SEMA-Technical-Documentation.html (" + fullHtml.length + " bytes)");
