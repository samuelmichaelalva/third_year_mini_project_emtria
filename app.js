/**
 * EMTRIA FORENSIC INTELLIGENCE — INTERACTIVE CONTROLLER
 * Simple, Clean 3-Step Guided Wizard Workflow
 */

(function () {
  'use strict';

  // --- THEME MANAGEMENT ---
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');

  const savedTheme = localStorage.getItem('emtria_theme') || 'light';
  htmlEl.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      htmlEl.setAttribute('data-theme', newTheme);
      localStorage.setItem('emtria_theme', newTheme);
    });
  }

  // --- WIZARD STEP NAVIGATION ---
  window.goToStep = function (stepNum) {
    // Hide all step views
    document.querySelectorAll('.step-view').forEach(view => {
      view.classList.remove('active');
    });

    // Show target step view
    const targetView = document.getElementById('wizard-step-' + stepNum);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update Stepper Buttons & Connectors
    for (let i = 1; i <= 3; i++) {
      const btn = document.getElementById('step-btn-' + i);
      if (btn) {
        btn.classList.remove('active', 'completed');
        if (i < stepNum) {
          btn.classList.add('completed');
        } else if (i === stepNum) {
          btn.classList.add('active');
        }
      }
    }

    const conn1 = document.getElementById('connector-1');
    const conn2 = document.getElementById('connector-2');
    if (conn1) conn1.classList.toggle('completed', stepNum > 1);
    if (conn2) conn2.classList.toggle('completed', stepNum > 2);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- STEP 1: SELECT EVIDENCE CARD ---
  window.selectEvidenceTab = function (type) {
    document.querySelectorAll('.evidence-box').forEach(box => {
      box.classList.remove('active-evidence');
    });
    const selected = document.getElementById('ev-card-' + type);
    if (selected) {
      selected.classList.add('active-evidence');
    }
  };

  // --- STEP 2: RUN PROCESSING SIMULATION ---
  window.startProcessing = function () {
    window.goToStep(2);

    // Progressive step simulation
    const steps = [
      { id: 'pstep-1', delay: 400 },
      { id: 'pstep-2', delay: 800 },
      { id: 'pstep-3', delay: 1200 },
      { id: 'pstep-4', delay: 1600 }
    ];

    steps.forEach(({ id, delay }) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.style.opacity = '1';
        }
      }, delay);
    });
  };

  // --- STEP 3: INTERACTIVE EVIDENCE INSPECTOR ---
  const evidenceDetailsData = {
    door: {
      badge: '📸 PHOTO EVIDENCE',
      title: 'OBJ_01: Damaged Entry Door',
      coords: 'Coordinates: [x:80, y:60, w:140, h:350]',
      source: 'Microsoft Florence-2-base (Dense Caption)',
      status: '✔ Verified & Mapped to Evidence Set',
      action: 'Preserve frame latch fragments for mechanical toolmark comparison',
      svgMarkup: `
        <rect width="500" height="320" fill="#0b0f17" rx="6"/>
        <rect x="40" y="30" width="420" height="260" fill="none" stroke="#334155" stroke-dasharray="6 3"/>
        <rect x="70" y="45" width="110" height="230" fill="rgba(2, 132, 199, 0.25)" stroke="#38bdf8" stroke-width="3" rx="4"/>
        <rect x="70" y="45" width="140" height="24" fill="#0284c7" rx="3"/>
        <text x="78" y="61" fill="#ffffff" font-size="11" font-weight="bold" font-family="JetBrains Mono">OBJ_01: Door</text>
        <rect x="220" y="200" width="80" height="40" fill="none" stroke="#334155" stroke-width="1" rx="3" opacity="0.3"/>
        <circle cx="350" cy="220" r="25" fill="none" stroke="#334155" stroke-width="1" opacity="0.3"/>
      `
    },
    knife: {
      badge: '📸 PHOTO EVIDENCE',
      title: 'OBJ_02: Metallic Knife / Blade',
      coords: 'Coordinates: [x:320, y:320, w:120, h:80]',
      source: 'Microsoft Florence-2-base (Object Detection)',
      status: '✔ Verified & Mapped to Evidence Set',
      action: 'Recover weapon for latent fingerprint analysis and DNA swab',
      svgMarkup: `
        <rect width="500" height="320" fill="#0b0f17" rx="6"/>
        <rect x="40" y="30" width="420" height="260" fill="none" stroke="#334155" stroke-dasharray="6 3"/>
        <rect x="70" y="45" width="110" height="230" fill="none" stroke="#334155" stroke-width="1" opacity="0.3"/>
        <rect x="180" y="160" width="140" height="70" fill="rgba(6, 182, 212, 0.25)" stroke="#22d3ee" stroke-width="3" rx="4"/>
        <rect x="180" y="160" width="130" height="24" fill="#0891b2" rx="3"/>
        <text x="188" y="176" fill="#ffffff" font-size="11" font-weight="bold" font-family="JetBrains Mono">OBJ_02: Knife</text>
        <circle cx="370" cy="210" r="25" fill="none" stroke="#334155" stroke-width="1" opacity="0.3"/>
      `
    },
    cctv: {
      badge: '📹 CCTV FOOTAGE',
      title: 'VID_001: Figure Outside 4B',
      coords: 'Timestamp: 00:01:23.000 [Hallway Cam 04]',
      source: 'OpenCV Frame Sampler + Florence-2',
      status: '✔ Verified & Correlated to Timeline',
      action: 'Request extended building perimeter cameras for exterior egress path',
      svgMarkup: `
        <rect width="500" height="320" fill="#080c14" rx="6"/>
        <text x="25" y="35" fill="#10b981" font-size="11" font-family="JetBrains Mono">&#9679; CAM-04 REPLAY @ 00:01:23.000</text>
        <rect x="160" y="70" width="180" height="200" fill="rgba(139, 92, 246, 0.15)" stroke="#a78bfa" stroke-width="2" rx="6"/>
        <circle cx="250" cy="120" r="25" fill="rgba(139, 92, 246, 0.3)" stroke="#a78bfa" stroke-width="2"/>
        <path d="M 215 220 C 215 165, 285 165, 285 220 Z" fill="rgba(139, 92, 246, 0.3)" stroke="#a78bfa" stroke-width="2"/>
        <rect x="160" y="70" width="160" height="22" fill="#7c3aed" rx="3"/>
        <text x="168" y="85" fill="#ffffff" font-size="10" font-weight="bold" font-family="JetBrains Mono">FIGURE DETECTED</text>
      `
    },
    audio: {
      badge: '🎙️ DISPATCH AUDIO',
      title: 'AUD_001: 911 Caller Wood Fracture Sound',
      coords: 'Segment: 00:14.20 – 00:17.80 [Speaker: CALLER]',
      source: 'OpenAI Whisper-base (ASR Timestamped)',
      status: '✔ Verified & Audio-Text Aligned',
      action: 'Preserve uncompressed 911 dispatch telephony recording for acoustic forensics',
      svgMarkup: `
        <rect width="500" height="320" fill="#0b0f17" rx="6"/>
        <text x="25" y="35" fill="#f59e0b" font-size="11" font-family="JetBrains Mono">&#9679; AUD_001.wav &#8282; Segment 2 of 3 (00:14.20)</text>
        <g transform="translate(40, 100)">
          <rect x="0" y="30" width="16" height="40" fill="#f59e0b" rx="2"/>
          <rect x="25" y="10" width="16" height="80" fill="#f59e0b" rx="2"/>
          <rect x="50" y="0" width="16" height="100" fill="#f59e0b" rx="2"/>
          <rect x="75" y="20" width="16" height="60" fill="#f59e0b" rx="2"/>
          <rect x="100" y="5" width="16" height="90" fill="#f59e0b" rx="2"/>
          <rect x="125" y="25" width="16" height="50" fill="#f59e0b" rx="2"/>
          <rect x="150" y="40" width="16" height="20" fill="#f59e0b" rx="2"/>
          <rect x="175" y="15" width="16" height="70" fill="#f59e0b" rx="2"/>
          <rect x="200" y="0" width="16" height="100" fill="#f59e0b" rx="2"/>
          <rect x="225" y="10" width="16" height="80" fill="#f59e0b" rx="2"/>
          <rect x="250" y="30" width="16" height="40" fill="#f59e0b" rx="2"/>
          <rect x="275" y="42" width="16" height="16" fill="#f59e0b" rx="2"/>
          <rect x="300" y="35" width="16" height="30" fill="#f59e0b" rx="2"/>
          <rect x="325" y="20" width="16" height="60" fill="#f59e0b" rx="2"/>
          <rect x="350" y="10" width="16" height="80" fill="#f59e0b" rx="2"/>
          <rect x="375" y="35" width="16" height="30" fill="#f59e0b" rx="2"/>
        </g>
        <text x="35" y="260" fill="#cbd5e1" font-size="12" font-style="italic">"It sounded like the door just got kicked in — wood cracking, loud impact."</text>
      `
    },
    correlation: {
      badge: '⏱️ TEMPORAL CORRELATION',
      title: 'Cross-Modal Match: CCTV & 911 Call',
      coords: 'Correlation Delta: < 2.4s between acoustic bang & door recoil',
      source: 'Python Temporal Alignment Engine',
      status: '✔ Temporal Entailment Supported',
      action: 'Correlate with building electrical access control log timestamp',
      svgMarkup: `
        <rect width="500" height="320" fill="#0b0f17" rx="6"/>
        <text x="25" y="35" fill="#a78bfa" font-size="11" font-family="JetBrains Mono">&#9679; CROSS-MODAL TEMPORAL ALIGNMENT</text>
        <line x1="50" y1="120" x2="450" y2="120" stroke="#334155" stroke-width="2"/>
        <line x1="50" y1="200" x2="450" y2="200" stroke="#334155" stroke-width="2"/>
        
        <circle cx="210" cy="120" r="10" fill="#8b5cf6"/>
        <text x="140" y="100" fill="#a78bfa" font-size="10" font-family="JetBrains Mono">CCTV Door Move: 00:02:08</text>
        
        <circle cx="230" cy="200" r="10" fill="#f59e0b"/>
        <text x="140" y="235" fill="#fbbf24" font-size="10" font-family="JetBrains Mono">911 Audio Impact: 00:14.20</text>
        
        <line x1="210" y1="120" x2="230" y2="200" stroke="#34d399" stroke-width="2" stroke-dasharray="4 2"/>
        <rect x="235" y="150" width="130" height="22" fill="#065f46" rx="3"/>
        <text x="242" y="165" fill="#6ee7b7" font-size="9" font-weight="bold" font-family="JetBrains Mono">SYNCED (&Delta; ~1.8s)</text>
      `
    },
    phone: {
      badge: '📸 PHOTO EVIDENCE',
      title: 'OBJ_04: Dislodged Telephone',
      coords: 'Coordinates: [x:570, y:180, w:130, h:100]',
      source: 'Microsoft Florence-2-base (Dense Caption)',
      status: '✔ Verified & Mapped to Evidence Set',
      action: 'Check call history and handset for touch DNA transfer',
      svgMarkup: `
        <rect width="500" height="320" fill="#0b0f17" rx="6"/>
        <rect x="40" y="30" width="420" height="260" fill="none" stroke="#334155" stroke-dasharray="6 3"/>
        <rect x="70" y="45" width="110" height="230" fill="none" stroke="#334155" stroke-width="1" opacity="0.3"/>
        <rect x="280" y="110" width="150" height="110" fill="rgba(139, 92, 246, 0.25)" stroke="#a78bfa" stroke-width="3" rx="4"/>
        <rect x="280" y="110" width="150" height="24" fill="#6d28d9" rx="3"/>
        <text x="288" y="126" fill="#ffffff" font-size="11" font-weight="bold" font-family="JetBrains Mono">OBJ_04: Phone</text>
      `
    },
    stain: {
      badge: '🧪 PHYSICAL LAB MANDATE',
      title: 'OBJ_03: Red Liquid / Stain',
      coords: 'Coordinates: [x:440, y:340, w:100, h:90]',
      source: 'Florence-2 Visual Detection ONLY',
      status: '⚠ UNVERIFIED — Lab Confirmation Required',
      action: 'MANDATORY: Submit cotton swab for Kastle-Meyer serology & DNA typing',
      svgMarkup: `
        <rect width="500" height="320" fill="#0b0f17" rx="6"/>
        <rect x="40" y="30" width="420" height="260" fill="none" stroke="#334155" stroke-dasharray="6 3"/>
        <circle cx="260" cy="160" r="55" fill="rgba(220, 38, 38, 0.3)" stroke="#ef4444" stroke-width="3" stroke-dasharray="4 2"/>
        <rect x="180" y="90" width="160" height="24" fill="#991b1b" rx="3"/>
        <text x="188" y="106" fill="#ffffff" font-size="10" font-weight="bold" font-family="JetBrains Mono">OBJ_03: Red Stain</text>
        <rect x="150" y="240" width="220" height="26" fill="#450a0a" stroke="#dc2626" rx="3"/>
        <text x="160" y="257" fill="#fca5a5" font-size="10" font-weight="bold" font-family="JetBrains Mono">LAB ACTION: Serology Required</text>
      `
    }
  };

  window.showEvidenceDetail = function (key) {
    const data = evidenceDetailsData[key];
    if (!data) return;

    // Highlight clicked card
    document.querySelectorAll('.finding-simple-card').forEach(card => {
      card.classList.remove('active-card');
    });
    if (window.event && window.event.currentTarget) {
      window.event.currentTarget.classList.add('active-card');
    }

    // Update inspector view
    const b = document.getElementById('insp-badge');
    const t = document.getElementById('insp-title');
    const c = document.getElementById('insp-coords');
    const v = document.getElementById('insp-viewport');
    const s = document.getElementById('insp-source');
    const st = document.getElementById('insp-status');
    const a = document.getElementById('insp-action');

    if (b) b.textContent = data.badge;
    if (t) t.textContent = data.title;
    if (c) c.textContent = data.coords;
    if (s) s.textContent = data.source;
    if (st) {
      st.textContent = data.status;
      st.className = key === 'stain' ? 'insp-val' : 'insp-val green-text';
      if (key === 'stain') st.style.color = '#ef4444';
      else st.style.color = '';
    }
    if (a) a.textContent = data.action;

    if (v) {
      v.innerHTML = `<svg viewBox="0 0 500 320" class="inspector-svg">${data.svgMarkup}</svg>`;
    }
  };

  // Print function
  window.printReport = function () {
    window.print();
  };

})();
