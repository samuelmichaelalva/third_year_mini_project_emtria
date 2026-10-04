/**
 * EMTRIA FORENSIC INTELLIGENCE — INTERACTIVE CORE CONTROLLER
 * Evidence-grounded Multimodal Traceable Reporting Architecture
 */

(function () {
  'use strict';

  // --- THEME MANAGEMENT (Default Light Mode) ---
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

  // --- PAGE NAVIGATION ---
  window.navigateTo = function (pageId) {
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active-panel');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const targetPanel = document.getElementById('page-' + pageId);
    const targetNav = document.getElementById('nav-' + pageId);

    if (targetPanel) {
      targetPanel.style.display = 'block';
      targetPanel.classList.add('active-panel');
    }

    if (targetNav) {
      targetNav.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- MODALITY TAB SWITCHING ---
  window.switchModality = function (modality) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.modality-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active-modality');
    });

    const activeBtn = document.getElementById('tab-' + modality);
    const activeContent = document.getElementById('modality-' + modality);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) {
      activeContent.style.display = 'block';
      activeContent.classList.add('active-modality');
    }
  };

  // --- INTERACTIVE EVIDENCE GROUNDING & CITATION HIGHLIGHTING ---
  window.highlightCitation = function (type, targetId) {
    if (type === 'image') {
      window.switchModality('image');

      // Highlight SVG Bounding Box
      document.querySelectorAll('.bbox-overlay').forEach(b => b.classList.remove('active-highlight'));
      const targetBBox = document.getElementById('box-' + targetId);
      if (targetBBox) {
        targetBBox.classList.add('active-highlight');
      }

      // Highlight Candidate Card
      document.querySelectorAll('.evidence-item-card').forEach(c => c.classList.remove('active-card'));
      const targetCard = document.getElementById('card-' + targetId);
      if (targetCard) {
        targetCard.classList.add('active-card');
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    } else if (type === 'video') {
      window.switchModality('video');
      if (targetId === '00:01:23') {
        window.seekExactTime('00:01:23', 48);
      } else if (targetId === '00:02:08') {
        window.seekExactTime('00:02:08', 72);
      } else {
        window.seekExactTime('00:00:24', 15);
      }

    } else if (type === 'audio') {
      window.switchModality('audio');
      document.querySelectorAll('.dialogue-card').forEach(d => d.classList.remove('active-audio-card'));
      const seg = document.getElementById('aud-seg-2');
      if (seg) {
        seg.classList.add('active-audio-card');
        seg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // --- SELECT EVIDENCE ITEM FROM CANVAS / LIST ---
  window.selectEvidenceItem = function (evidenceId) {
    document.querySelectorAll('.bbox-overlay').forEach(b => b.classList.remove('active-highlight'));
    document.querySelectorAll('.evidence-item-card').forEach(c => c.classList.remove('active-card'));

    const bbox = document.getElementById('box-' + evidenceId);
    if (bbox) bbox.classList.add('active-highlight');

    const card = document.getElementById('card-' + evidenceId);
    if (card) {
      card.classList.add('active-card');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // --- TOGGLE BOUNDING BOXES ON/OFF ---
  window.toggleBoundingBoxes = function (isChecked) {
    const overlays = document.querySelectorAll('.bbox-overlay');
    overlays.forEach(overlay => {
      overlay.style.display = isChecked ? 'block' : 'none';
    });
  };

  // --- VIDEO SCRUBBER SEEKING ---
  window.seekExactTime = function (timestampStr, pct) {
    const progress = document.getElementById('video-progress');
    const display = document.getElementById('vid-time-display');
    const activeLabel = document.getElementById('active-video-ts');

    if (progress) progress.style.width = pct + '%';
    if (display) display.textContent = timestampStr + '.000';
    if (activeLabel) activeLabel.textContent = 'Current: ' + timestampStr;

    document.querySelectorAll('.keyframe-thumbnail').forEach(kf => kf.classList.remove('active-kf'));
    if (pct < 30) {
      const kf = document.getElementById('kf-1');
      if (kf) kf.classList.add('active-kf');
    } else if (pct < 60) {
      const kf = document.getElementById('kf-2');
      if (kf) kf.classList.add('active-kf');
    } else {
      const kf = document.getElementById('kf-3');
      if (kf) kf.classList.add('active-kf');
    }
  };

  window.seekVideoTimeline = function (e) {
    const track = document.getElementById('video-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

    const totalSeconds = 180;
    const currentSec = Math.floor((pct / 100) * totalSeconds);
    const mm = String(Math.floor(currentSec / 60)).padStart(2, '0');
    const ss = String(currentSec % 60).padStart(2, '0');

    window.seekExactTime(`${mm}:${ss}`, pct);
  };

  // --- REPORT FILTERING ---
  window.filterReport = function (category) {
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    const activeChip = Array.from(document.querySelectorAll('.filter-chip')).find(
      c => c.getAttribute('data-cat') === category
    );
    if (activeChip) activeChip.classList.add('active');

    const sections = document.querySelectorAll('.report-sec');
    sections.forEach(sec => {
      const secCat = sec.getAttribute('data-category');
      if (category === 'all' || !secCat) {
        sec.style.display = 'flex';
      } else if (secCat === category) {
        sec.style.display = 'flex';
      } else {
        sec.style.display = 'none';
      }
    });
  };

  // --- GPU CACHE PURGE SIMULATION (For Academic Defense) ---
  window.purgeGPUCache = function () {
    const vramBar = document.getElementById('vram-bar');
    const vramText = document.getElementById('vram-val-text');

    if (vramBar && vramText) {
      vramBar.style.width = '5.8%';
      vramText.textContent = '0.35 GB / 6.00 GB';
      vramBar.style.backgroundColor = '#10b981';

      setTimeout(() => {
        alert('PyTorch GPU VRAM Cache Purged Successfully (torch.cuda.empty_cache).\nVRAM Reset to Base Footprint: 0.35 GB.');
        vramBar.style.width = '23.6%';
        vramText.textContent = '1.42 GB / 6.00 GB';
      }, 600);
    }
  };

  // --- IMAGE FILE SWITCHER ---
  window.switchImageFile = function (fileName) {
    alert(`Loaded evidence file: ${fileName}.jpg\nModality Analyzer: Microsoft Florence-2-base (Dense Caption & Grounding Activated)`);
  };

  // --- RUN ANALYSIS SIMULATION ---
  window.runAnalysisSimulation = function () {
    alert('Running EMTRIA Evidence-Grounded Pipeline:\n[1/3] Florence-2: Extracted 4 localized objects & dense captions\n[2/3] OpenCV & Whisper: Synced 3 video candidate moments & audio transcripts\n[3/3] Deterministic Validation: 100% of claims cited and mapped to evidence IDs.');
  };

  // --- EXPORT & PRINT REPORT ---
  window.exportReport = function () {
    const jsonReport = {
      case_id: "#CASE-2026-084B",
      architecture: "EMTRIA v2.1",
      evidence_grounding_rate: "100%",
      findings_count: 7,
      status: "preliminary_verified"
    };
    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EMTRIA_Case_2026_084B_Preliminary_Report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  window.printReport = function () {
    window.print();
  };

})();
