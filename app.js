/* EMTRIA — Minimal Controller */
(function(){
  const $ = id => document.getElementById(id);
  window.$ = $;

  // Theme
  const html = document.documentElement;
  const setTh = t => { html.dataset.theme = t; localStorage.setItem('emtria_theme', t); $('theme-toggle').textContent = t === 'dark' ? '☀️' : '🌙'; };
  setTh(localStorage.getItem('emtria_theme') || 'dark');
  $('theme-toggle').onclick = () => setTh(html.dataset.theme === 'dark' ? 'light' : 'dark');

  // Navigation & Dynamic Step 2 Sync
  window.go = function(n) {
    if ((n === 2 || n === 3) && totalFiles() === 0) {
      showToast('Upload at least one evidence file before proceeding.', 'warn');
      return;
    }
    if (n === 2) syncPipeline();
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    $('step' + n).classList.add('active');
    for (let i = 1; i <= 3; i++) $('sb' + i).className = 's-btn' + (i < n ? ' done' : i === n ? ' active' : '');
    if ($('ln1')) $('ln1').className = 'line' + (n > 1 ? ' done' : '');
    if ($('ln2')) $('ln2').className = 'line' + (n > 2 ? ' done' : '');
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Multi-File Evidence Store
  const files = { pic: [], vid: [], aud: [] };
  const totalFiles = () => files.pic.length + files.vid.length + files.aud.length;

  function renderList(type) {
    const list = files[type], fl = $('fl-' + type), em = $('em-' + type), st = $(type + '-st'), fn = $('fn-' + type);
    em.style.display = list.length ? 'none' : 'flex';
    fl.style.display = list.length ? 'flex' : 'none';
    st.textContent = list.length ? `${list.length} File${list.length>1?'s':''}` : '0 Files';
    st.className = 'pill' + (list.length ? ' up' : '');
    fn.textContent = list.length ? `${list.length} file${list.length>1?'s':''} staged` : 'No files selected';
    fl.innerHTML = list.map((f, i) => `
      <div class="file-chip">
        <div class="file-chip-left"><span class="chip-id">${f.id}</span><span class="chip-name" title="${f.name}">${f.name}</span></div>
        <button class="chip-del" onclick="event.stopPropagation();delFile('${type}',${i})" title="Remove">×</button>
      </div>`).join('');
  }

  function updateStatus() {
    const n = totalFiles(), msg = $('status-msg'), btn = $('btn-run');
    if (msg) msg.innerHTML = n > 0 ? `🟢 <strong>${n} evidence file${n>1?'s':''}</strong> staged for analysis` : `⚪ No evidence files loaded`;
    if (btn) btn.style.opacity = n > 0 ? '1' : '0.6';
  }

  window.delFile = function(type, i) {
    URL.revokeObjectURL(files[type][i].url);
    files[type].splice(i, 1);
    files[type].forEach((f, idx) => f.id = (type === 'pic' ? 'IMG' : type === 'vid' ? 'VID' : 'AUD') + '_' + String(idx + 1).padStart(3, '0'));
    renderList(type); updateStatus();
  };

  window.onFile = function(type, e) {
    const fls = Array.from(e.target.files || []);
    if (!fls.length) return;
    const prefix = type === 'pic' ? 'IMG' : type === 'vid' ? 'VID' : 'AUD';
    fls.forEach(f => {
      if (type === 'pic' && !f.type.startsWith('image/')) return alert(`${f.name} is not an image.`);
      if (type === 'vid' && !f.type.startsWith('video/')) return alert(`${f.name} is not a video.`);
      if (type === 'aud' && !f.type.startsWith('audio/')) return alert(`${f.name} is not an audio file.`);
      if (files[type].some(x => x.name === f.name && x.size === f.size)) return;
      files[type].push({ id: prefix + '_' + String(files[type].length + 1).padStart(3, '0'), name: f.name, size: f.size, url: URL.createObjectURL(f) });
    });
    renderList(type); updateStatus();
    if ($('inp-' + type)) $('inp-' + type).value = '';
  };

  window.resetAll = function() {
    ['pic','vid','aud'].forEach(t => { files[t].forEach(f => URL.revokeObjectURL(f.url)); files[t] = []; renderList(t); });
    updateStatus();
  };

  // Drag & drop
  ['dz-pic','dz-vid','dz-aud'].forEach(id => {
    const el = $(id), type = id.split('-')[1];
    if (!el) return;
    el.ondragover = e => { e.preventDefault(); el.classList.add('drag'); };
    el.ondragleave = () => el.classList.remove('drag');
    el.ondrop = e => {
      e.preventDefault();
      el.classList.remove('drag');
      if (!e.dataTransfer.files.length) return;
      if (!authManager.isLoggedIn()) {
        authManager.requestAuth('files', { type, files: Array.from(e.dataTransfer.files) }, 'Officer Authentication Required to ingest dropped files into custody');
        return;
      }
      onFile(type, { target: { files: e.dataTransfer.files } });
    };
  });

  // Dynamic Pipeline Adaptation (Step 2)
  function syncPipeline() {
    const np = files.pic.length, nv = files.vid.length, na = files.aud.length;
    // Stage 1 (Vision)
    $('s1-desc').textContent = (np || nv) ? `Scanning ${np} photo${np!==1?'s':''} and ${nv} video feed${nv!==1?'s':''} frame-by-frame.` : `Visual Analysis: Skipped (0 visual files provided).`;
    $('s1-tag').textContent = (np || nv) ? 'READY' : 'SKIPPED';
    $('s1-tag').className = 'p-tag ' + ((np || nv) ? 'green' : 'dim');
    // Stage 2 (Audio)
    $('s2-desc').textContent = na ? `Transcribing ${na} audio recording${na!==1?'s':''} and speech cues.` : `Audio Transcription: Skipped (0 audio files provided).`;
    $('s2-tag').textContent = na ? 'READY' : 'SKIPPED';
    $('s2-tag').className = 'p-tag ' + (na ? 'green' : 'dim');
    // Stage 3 (Temporal)
    const canTemp = (nv > 0 && na > 0) || (np > 1 && na > 0);
    $('s3-desc').textContent = canTemp ? `Correlating timestamps across ${nv+na} video and audio sources.` : `Temporal Matching: Skipped (Requires both visual & audio feeds).`;
    $('s3-tag').textContent = canTemp ? 'READY' : 'SKIPPED';
    $('s3-tag').className = 'p-tag ' + (canTemp ? 'green' : 'dim');
    // Stage 4 (Guardrail)
    $('s4-desc').textContent = `Cross-referencing all findings against ${totalFiles()} staged evidence files.`;
  }

  // Inspector data
  const D = {
    door:        { badge:'📷 PHOTO', title:'OBJ_01: Damaged Entry Door', coords:'[80, 60, 220, 410]', src:'Florence-2-base', stat:'✔ Verified', act:'Preserve splinter patterns for toolmark exam', color:'#38bdf8' },
    knife:       { badge:'📷 PHOTO', title:'OBJ_02: Metallic Knife', coords:'[320, 320, 120, 80]', src:'Florence-2-base', stat:'✔ Verified', act:'Recover for fingerprint + DNA swab', color:'#22d3ee' },
    video:       { badge:'🎥 VIDEO', title:'VID_001: Figure Outside 4B', coords:'Frame #2490 @ 00:01:23', src:'OpenCV + Florence-2', stat:'✔ Verified', act:'Check building perimeter cameras', color:'#a78bfa' },
    audio:       { badge:'🎙️ AUDIO', title:'AUD_001: Wood Fracture Sound', coords:'00:14.20 – 00:17.80', src:'Whisper-base ASR', stat:'✔ Verified', act:'Preserve 911 recording for acoustic forensics', color:'#fbbf24' },
    correlation: { badge:'⏱️ TEMPORAL', title:'Cross-Modal: Video + Audio', coords:'Δ ~1.8s between events', src:'Temporal Alignment Engine', stat:'✔ Supported', act:'Correlate with access control logs', color:'#34d399' },
    phone:       { badge:'📷 PHOTO', title:'OBJ_04: Dislodged Telephone', coords:'[570, 180, 130, 100]', src:'Florence-2-base', stat:'✔ Verified', act:'Check call history + touch DNA', color:'#a78bfa' },
    stain:       { badge:'🧪 LAB', title:'OBJ_03: Red Liquid Stain', coords:'[440, 340, 100, 90]', src:'Florence-2 Visual Only', stat:'⚠ UNVERIFIED — Lab Required', act:'Submit for Kastle-Meyer serology', color:'#f87171', warn:true }
  };

  window.inspect = function(key, el) {
    const d = D[key]; if (!d) return;
    document.querySelectorAll('.f-card').forEach(c => c.classList.remove('active-f'));
    if (el) el.classList.add('active-f');
    $('insp-badge').textContent = d.badge;
    $('insp-title').textContent = d.title;
    $('insp-coords').textContent = d.coords;
    $('insp-src').textContent = d.src;
    $('insp-stat').textContent = d.stat;
    $('insp-stat').className = d.warn ? '' : 'green';
    if (d.warn) $('insp-stat').style.color = '#ef4444'; else $('insp-stat').style.color = '';
    $('insp-act').textContent = d.act;

    const body = $('insp-body');
    const p0 = files.pic[0]?.url, v0 = files.vid[0]?.url, a0 = files.aud[0]?.url;
    if (['door','knife','phone','stain'].includes(key) && p0) {
      body.innerHTML = `<img src="${p0}" style="max-width:100%;max-height:200px;object-fit:contain;border-radius:6px">`;
    } else if (key === 'video' && v0) {
      body.innerHTML = `<video src="${v0}" controls muted style="width:100%;max-height:200px;object-fit:contain"></video>`;
    } else if (key === 'audio' && a0) {
      body.innerHTML = `<audio src="${a0}" controls style="width:90%"></audio>`;
    } else {
      body.innerHTML = `<svg viewBox="0 0 400 200"><rect width="400" height="200" fill="#0b0f17" rx="6"/><rect x="30" y="20" width="340" height="160" fill="none" stroke="#334155" stroke-dasharray="4"/><rect x="60" y="40" width="100" height="120" fill="${d.color}22" stroke="${d.color}" stroke-width="2" rx="4"/><text x="70" y="60" fill="${d.color}" font-size="11" font-weight="bold" font-family="JetBrains Mono">${d.title.split(':')[0]}</text></svg>`;
    }
  };

  // --- Studio-Grade Dynamic Forensic Background Animation System ---
  const cvs = $('bg-canvas');
  if (cvs && cvs.getContext) {
    const ctx = cvs.getContext('2d');
    let W = 0, H = 0;
    const resize = () => { W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    // Preload photorealistic 3D forensic concept artwork
    const imgDark = new Image(); imgDark.src = 'bg-dark.jpg';
    const imgLight = new Image(); imgLight.src = 'bg-light.jpg';

    // 14 3D neural brain node clusters mapped to the brain artwork (normalized 1024x576)
    const brainNodes = [
      { x: 0.640, y: 0.290 }, { x: 0.690, y: 0.200 }, { x: 0.740, y: 0.145 },
      { x: 0.810, y: 0.140 }, { x: 0.880, y: 0.180 }, { x: 0.930, y: 0.250 },
      { x: 0.900, y: 0.330 }, { x: 0.840, y: 0.380 }, { x: 0.770, y: 0.385 },
      { x: 0.700, y: 0.340 }, { x: 0.750, y: 0.260 }, { x: 0.820, y: 0.245 },
      { x: 0.860, y: 0.285 }, { x: 0.790, y: 0.315 }
    ];
    // Synaptic connections between brain nodes
    const brainEdges = [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0],
      [1,10],[2,11],[3,11],[4,12],[5,12],[6,13],[7,13],[8,10],[10,11],[11,12],[12,13],[13,10]
    ];

    // High-resolution digital fingerprint voxel grid (24x30)
    const fpPattern = [
      ".......##########.......",
      ".....##############.....",
      "...##################...",
      "..#####..........#####..",
      ".####..##########..####.",
      ".###..############..###.",
      "###..##############..###",
      "###.####........####.###",
      "##..###..######..###..##",
      "##.###..########..###.##",
      "##.###.###....###.###.##",
      "##.###.##..##..##.###.##",
      "##.###.##.####.##.###.##",
      "##.###.##.####.##.###.##",
      "##.###.##..##..##.###.##",
      "##.###.###....###.###.##",
      "##.###..########..###.##",
      "##..###..######..###..##",
      "###.####........####.###",
      "###..##############..###",
      ".###..############..###.",
      ".####..##########..####.",
      "..#####..........#####..",
      "...##################...",
      ".....##############.....",
      ".......##########......."
    ];

    let t = 0;
    function render() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      const isDark = document.documentElement.dataset.theme !== 'light';
      const curImg = isDark ? imgDark : imgLight;

      // Color Palette adapting dynamically to theme
      const cSky = isDark ? 'rgba(56, 189, 248, ' : 'rgba(2, 132, 199, ';
      const cGold = isDark ? 'rgba(251, 191, 36, ' : 'rgba(217, 119, 6, ';
      const cPur = isDark ? 'rgba(167, 139, 250, ' : 'rgba(139, 92, 246, ';
      const cGrn = isDark ? 'rgba(52, 211, 153, ' : 'rgba(16, 185, 129, ';

      // 1. Render Photorealistic 3D Forensic Concept Backdrop
      let dw = W, dh = W / (1024 / 576);
      if (dh < H) { dh = H; dw = H * (1024 / 576); }
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;

      if (curImg.complete && curImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(curImg, dx, dy, dw, dh);

        // Ambient depth vignette ensuring 100% UI text readability across viewports
        const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.85);
        vig.addColorStop(0, isDark ? 'rgba(10, 14, 26, 0.28)' : 'rgba(248, 250, 252, 0.32)');
        vig.addColorStop(1, isDark ? 'rgba(10, 14, 26, 0.72)' : 'rgba(248, 250, 252, 0.76)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // --- ANIMATION 1: Fingerprint Creating in Pixels (Top to Bottom -> Vanish -> Loop) ---
      const fpBoxX = dx + 0.125 * dw;
      const fpBoxY = dy + 0.045 * dh;
      const fpBoxW = 0.330 * dw;
      const fpBoxH = 0.650 * dh;

      const fpPeriod = 7.0; // 7-second complete cycle
      const fpCycle = t % fpPeriod;
      let buildProgress = 0;
      let fpOpacity = 1;

      if (fpCycle < 3.5) {
        // Assembling from top to bottom
        buildProgress = fpCycle / 3.5;
        fpOpacity = 1;
      } else if (fpCycle < 5.0) {
        // Fully assembled, glowing resonance
        buildProgress = 1;
        fpOpacity = 1;
      } else if (fpCycle < 6.2) {
        // Disintegrating into pixels and vanishing
        buildProgress = 1;
        fpOpacity = 1 - (fpCycle - 5.0) / 1.2;
      } else {
        // Brief pause before repeating
        buildProgress = 0;
        fpOpacity = 0;
      }

      if (fpOpacity > 0.01) {
        ctx.save();
        const rows = fpPattern.length;
        const cols = fpPattern[0].length;
        const cellW = fpBoxW / cols;
        const cellH = fpBoxH / rows;
        const maxRow = Math.floor(buildProgress * rows);
        const curRowFrac = (buildProgress * rows) - maxRow;

        for (let r = 0; r < rows; r++) {
          if (r > maxRow) break;
          const rowStr = fpPattern[r];
          const isScanningEdge = (r === maxRow);
          const cellAlpha = (isScanningEdge ? curRowFrac * fpOpacity : fpOpacity);

          for (let c = 0; c < cols; c++) {
            if (rowStr[c] === '#') {
              const px = fpBoxX + c * cellW;
              const py = fpBoxY + r * cellH;
              // Pixel block with digital glow
              ctx.fillStyle = cSky + (0.35 * cellAlpha).toFixed(3) + ')';
              ctx.fillRect(px + 1, py + 1, cellW - 1.5, cellH - 1.5);

              // Specular core on active pixels
              if ((r + c) % 4 === 0) {
                ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${(0.45 * cellAlpha).toFixed(3)})` : `rgba(2, 132, 199, ${(0.6 * cellAlpha).toFixed(3)})`;
                ctx.fillRect(px + cellW * 0.25, py + cellH * 0.25, cellW * 0.5, cellH * 0.5);
              }
            }
          }
        }

        // Active laser scanline beam sweeping downwards
        if (buildProgress > 0 && buildProgress < 1) {
          const scanY = fpBoxY + buildProgress * fpBoxH;
          ctx.beginPath();
          ctx.moveTo(fpBoxX - 15, scanY);
          ctx.lineTo(fpBoxX + fpBoxW + 15, scanY);
          ctx.strokeStyle = cSky + (0.85 * fpOpacity).toFixed(3) + ')';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#38bdf8';
          ctx.stroke();

          // Laser guide beam flare
          ctx.beginPath();
          ctx.arc(fpBoxX + fpBoxW * 0.5 + Math.sin(t * 8) * (fpBoxW * 0.4), scanY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }

        // Forensic ID badge when fully assembled
        if (buildProgress >= 1 && fpOpacity > 0.3) {
          ctx.font = '600 11px JetBrains Mono, monospace';
          ctx.fillStyle = cSky + (0.9 * fpOpacity).toFixed(3) + ')';
          ctx.fillText(`[ FP_RECONSTRUCTION: COMPLETE // 99.8% ]`, fpBoxX, fpBoxY + fpBoxH + 18);
        }
        ctx.restore();
      }

      // --- ANIMATION 2: Brain Neurons Activating & Sending Info (Floating Synaptic AI) ---
      const bBaseX = dx + 0.765 * dw;
      const bBaseY = dy + 0.260 * dh;
      const bFloatY = Math.sin(t * 1.3) * 6;
      const bFloatX = Math.cos(t * 0.9) * 3;

      ctx.save();
      ctx.translate(bFloatX, bFloatY);

      // Compute screen positions of brain nodes
      const nodeCoords = brainNodes.map(n => ({
        x: dx + n.x * dw,
        y: dy + n.y * dh
      }));

      // Draw axon synaptic pathways
      brainEdges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(nodeCoords[i].x, nodeCoords[i].y);
        ctx.lineTo(nodeCoords[j].x, nodeCoords[j].y);
        ctx.strokeStyle = cPur + '0.22)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Synaptic action potentials (traveling electric information pulses)
      brainEdges.forEach(([i, j], idx) => {
        const pulseSpeed = 1.1;
        const progress = ((t * pulseSpeed) + idx * 0.16) % 1;
        const px = nodeCoords[i].x + (nodeCoords[j].x - nodeCoords[i].x) * progress;
        const py = nodeCoords[i].y + (nodeCoords[j].y - nodeCoords[i].y) * progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = (idx % 2 === 0 ? cSky : cGold) + '0.85)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = idx % 2 === 0 ? '#38bdf8' : '#fbbf24';
        ctx.fill();
      });

      // Brain neuron soma nodes (pulsing with activation blooms)
      nodeCoords.forEach((p, idx) => {
        const pulse = Math.sin(t * 2.5 + idx * 1.2) * 0.5 + 0.5;
        const radius = 3.5 + pulse * 2.5;

        // Glowing outer halo
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3);
        halo.addColorStop(0, (idx % 3 === 0 ? cGold : cSky) + (0.45 + pulse * 0.4) + ')');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node center core
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#ffffff' : (idx % 3 === 0 ? '#d97706' : '#0284c7');
        ctx.fill();
      });

      // Neural telemetry label
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillStyle = cPur + '0.75)';
      ctx.fillText(`NEURAL_SYNAPSE // ACTIVE`, bBaseX + 15, bBaseY - 110);
      ctx.restore();

      // --- ANIMATION 3: Magnifying Glass Rotating/Floating & Searching Over Image ---
      const lx = dx + 0.534 * dw;
      const ly = dy + 0.625 * dh;
      const lr = 0.136 * dw;

      const mgFloatX = Math.cos(t * 0.7) * 4;
      const mgFloatY = Math.sin(t * 0.8) * 4;
      const searchAngle = t * 0.45;

      ctx.save();
      ctx.translate(mgFloatX, mgFloatY);

      // Rotating forensic radar search sweep sector inside the lens
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, lr * 0.95, 0, Math.PI * 2);
      ctx.clip(); // Keep search effects confined within the glass lens

      // Radar sweep cone
      const sweepGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      sweepGrad.addColorStop(0, cSky + '0.08)');
      sweepGrad.addColorStop(1, cSky + '0.22)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.arc(lx, ly, lr, searchAngle - 0.45, searchAngle);
      ctx.closePath();
      ctx.fill();

      // Rotating search sweep line
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(searchAngle) * lr, ly + Math.sin(searchAngle) * lr);
      ctx.strokeStyle = cSky + '0.75)';
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.stroke();

      // Forensic super-resolution enhancement pixel grid scanning over the photo
      const pGridSize = 14;
      const scanPhase = (t * 1.5) % 1;
      const scanLineX = lx - lr + scanPhase * (lr * 2);
      for (let gx = lx - lr * 0.8; gx < lx + lr * 0.8; gx += pGridSize) {
        for (let gy = ly - lr * 0.8; gy < ly + lr * 0.8; gy += pGridSize) {
          const distFromCenter = Math.hypot(gx - lx, gy - ly);
          if (distFromCenter < lr * 0.88 && Math.abs(gx - scanLineX) < pGridSize * 2) {
            ctx.strokeStyle = cSky + '0.35)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(gx, gy, pGridSize - 2, pGridSize - 2);
            if ((gx + gy) % 3 === 0) {
              ctx.fillStyle = cSky + '0.18)';
              ctx.fillRect(gx, gy, pGridSize - 2, pGridSize - 2);
            }
          }
        }
      }
      ctx.restore();

      // Forensic HUD reticle over lens circumference
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.strokeStyle = cSky + '0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Reticle crosshair ticks
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(lx + Math.cos(a) * (lr - 8), ly + Math.sin(a) * (lr - 8));
        ctx.lineTo(lx + Math.cos(a) * (lr + 8), ly + Math.sin(a) * (lr + 8));
        ctx.strokeStyle = cSky + '0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Specular rotating light glint along chrome rim
      const glintAngle = Math.sin(t * 0.8) * Math.PI;
      const gx = lx + Math.cos(glintAngle) * lr;
      const gy = ly + Math.sin(glintAngle) * lr;
      ctx.beginPath();
      ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.fill();

      // Dynamic telemetry readout
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillStyle = cSky + '0.85)';
      ctx.fillText(`TARGET_LOC // RESOLVING 4K OPTICAL`, lx - 65, ly + lr + 18);
      ctx.restore();

      // --- ANIMATION 4: Floating Photo Depth Markers ---
      const photoX = dx + 0.100 * dw;
      const photoY = dy + 0.640 * dh;
      const photoW = 0.410 * dw;
      const photoH = 0.310 * dh;
      const pPulse = Math.sin(t * 2) * 0.3 + 0.7;

      ctx.save();
      ctx.strokeStyle = cSky + (0.45 * pPulse).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      // Corner brackets on the crime scene photo
      const brLen = 12;
      // Top-left
      ctx.beginPath(); ctx.moveTo(photoX, photoY + brLen); ctx.lineTo(photoX, photoY); ctx.lineTo(photoX + brLen, photoY); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(photoX, photoY + photoH - brLen); ctx.lineTo(photoX, photoY + photoH); ctx.lineTo(photoX + brLen, photoY + photoH); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(photoX + photoW - brLen, photoY + photoH); ctx.lineTo(photoX + photoW, photoY + photoH); ctx.lineTo(photoX + photoW, photoY + photoH - brLen); ctx.stroke();
      ctx.restore();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  // ==========================================================
  // FORENSIC OFFICER AUTHENTICATION & CHAIN-OF-CUSTODY MANAGER
  // ==========================================================
  const DEFAULT_OFFICERS = [
    { badge: 'DET-4092', name: 'Lead Inv. Samuel N.', unit: 'Cyber & Physical Forensics Div', pass: 'emtria2026' }
  ];

  const authManager = {
    pendingAction: null,
    getUsers() {
      try {
        const stored = localStorage.getItem('emtria_users');
        if (!stored) {
          localStorage.setItem('emtria_users', JSON.stringify(DEFAULT_OFFICERS));
          return [...DEFAULT_OFFICERS];
        }
        return JSON.parse(stored);
      } catch (e) {
        return [...DEFAULT_OFFICERS];
      }
    },
    getActiveUser() {
      try {
        const u = localStorage.getItem('emtria_active_user');
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },
    setActiveUser(user) {
      if (user) {
        localStorage.setItem('emtria_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('emtria_active_user');
      }
      this.syncAuthNav();
    },
    isLoggedIn() {
      return !!this.getActiveUser();
    },
    syncAuthNav() {
      const slot = $('auth-nav-slot');
      if (!slot) return;
      const user = this.getActiveUser();
      if (user) {
        const shortName = user.name.replace(/^(Lead |Det\. |Inv\. )/, '');
        slot.innerHTML =
          '<div class="officer-badge-pill" title="' + user.name + ' (' + (user.unit || 'Forensics') + ')">' +
            '<span class="status-pulse-dot"></span>' +
            '<span class="officer-name">' + user.badge + ' \u00b7 ' + shortName + '</span>' +
            '<button class="btn-signout" onclick="authSignOut()" title="Sign Out">\u2715</button>' +
          '</div>';
      } else {
        slot.innerHTML =
          '<button type="button" class="nav-lock-btn" id="nav-lock-trigger" onclick="openAuthModal(\'Sign in to upload &amp; process forensic evidence\')" title="Officer Login">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
            '<span>Officer Login</span>' +
          '</button>';
      }
    },
    requestAuth(actionType, payload, reason) {
      this.pendingAction = { type: actionType, payload: payload };
      openAuthModal(reason || 'Officer Authentication Required to stage Chain-of-Custody evidence');
    },
    login(badge, pass) {
      const users = this.getUsers();
      const user = users.find(u => u.badge.toUpperCase() === badge.trim().toUpperCase() && u.pass === pass);
      if (user) {
        this.setActiveUser(user);
        completeAuthSuccess(user);
        return true;
      }
      return false;
    },
    register(name, badge, unit, pass) {
      const users = this.getUsers();
      const exists = users.some(u => u.badge.toUpperCase() === badge.trim().toUpperCase());
      if (exists) {
        showToast('Badge ' + badge.toUpperCase() + ' is already registered in EMTRIA system', 'warn');
        return false;
      }
      const newUser = { name: name.trim(), badge: badge.trim().toUpperCase(), unit: unit.trim(), pass: pass };
      users.push(newUser);
      localStorage.setItem('emtria_users', JSON.stringify(users));
      this.setActiveUser(newUser);
      completeAuthSuccess(newUser);
      return true;
    },
    logout() {
      this.setActiveUser(null);
      this.pendingAction = null;
      showToast('🔒 Officer signed out. Evidence upload is locked to guests.', 'info');
    }
  };

  function completeAuthSuccess(user) {
    closeAuthModal();
    showToast('\u2714 Welcome, ' + user.name + ' (' + user.badge + ') \u2014 Authorized', 'success');
    const act = authManager.pendingAction;
    authManager.pendingAction = null;
    if (!act) return;

    if (act.type === 'picker') {
      setTimeout(function() {
        const inp = $('inp-' + act.payload);
        if (inp) inp.click();
      }, 120);
    } else if (act.type === 'files') {
      setTimeout(function() {
        if (act.payload && act.payload.files && act.payload.files.length) {
          onFile(act.payload.type, { target: { files: act.payload.files } });
          showToast('📁 Staged ' + act.payload.files.length + ' dropped file(s) into custody', 'info');
        }
      }, 120);
    } else if (act.type === 'run') {
      setTimeout(function() {
        go(2);
      }, 120);
    }
  }

  // Window-level handlers for HTML integration
  window.handleEvidenceClick = function(type) {
    if (!authManager.isLoggedIn()) {
      authManager.requestAuth('picker', type, 'Officer Authentication Required to stage Chain-of-Custody evidence');
    } else {
      const inp = $('inp-' + type);
      if (inp) inp.click();
    }
  };

  window.handleRunAnalysis = function() {
    if (!authManager.isLoggedIn()) {
      authManager.requestAuth('run', null, 'Officer Sign-In Required to execute AI Pipeline on RTX 4050');
    } else {
      if (totalFiles() === 0) {
        showToast('Stage at least one evidence file before executing pipeline.', 'warn');
        return;
      }
      go(2);
    }
  };

  window.loginDemoOfficer = function() {
    const defaultUser = DEFAULT_OFFICERS[0];
    authManager.setActiveUser(defaultUser);
    completeAuthSuccess(defaultUser);
  };

  window.authSignOut = function() {
    authManager.logout();
  };

  window.openAuthModal = function(reason) {
    const modal = $('auth-modal');
    if (!modal) return;
    if (reason && $('auth-gate-reason')) {
      $('auth-gate-reason').textContent = '\u26a0\ufe0f ' + reason;
    }
    modal.classList.add('open');
    switchAuthTab('signin');
    setTimeout(function() {
      const inp = $('signin-badge');
      if (inp) inp.focus();
    }, 60);
  };

  window.closeAuthModal = function() {
    const modal = $('auth-modal');
    if (modal) modal.classList.remove('open');
  };

  window.switchAuthTab = function(tab) {
    const isSignIn = tab === 'signin';
    const tabIn = $('tab-signin'), tabReg = $('tab-register');
    const formIn = $('form-signin'), formReg = $('form-register');
    if (tabIn) tabIn.className = 'auth-tab' + (isSignIn ? ' active' : '');
    if (tabReg) tabReg.className = 'auth-tab' + (!isSignIn ? ' active' : '');
    if (formIn) formIn.style.display = isSignIn ? 'block' : 'none';
    if (formReg) formReg.style.display = !isSignIn ? 'block' : 'none';
  };

  window.handleSignInSubmit = function(e) {
    e.preventDefault();
    const badge = $('signin-badge').value;
    const pass = $('signin-pass').value;
    const success = authManager.login(badge, pass);
    if (!success) {
      showToast('\u274c Invalid Officer ID or PIN. Use the Quick Demo button for 1-click test.', 'error');
    }
  };

  window.handleRegisterSubmit = function(e) {
    e.preventDefault();
    const name = $('reg-name').value;
    const badge = $('reg-badge').value;
    const unit = $('reg-unit').value;
    const pass = $('reg-pass').value;
    authManager.register(name, badge, unit, pass);
  };

  window.showToast = function(msg, type) {
    type = type || 'info';
    const box = $('toast-box');
    if (!box) return;
    const item = document.createElement('div');
    var cls = 'toast-item';
    if (type === 'success') cls += ' toast-success';
    else if (type === 'warn') cls += ' toast-warn';
    else if (type === 'error') cls += ' toast-error';
    item.className = cls;
    item.innerHTML = '<span>' + msg + '</span>';
    box.appendChild(item);
    setTimeout(function() {
      item.classList.add('hiding');
      setTimeout(function() { item.remove(); }, 250);
    }, 3500);
  };

  // Sync initial nav state
  authManager.syncAuthNav();

  // Scroll Reveal Observer
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.upload-card, .pipeline, .cat, .inspector, .action-bar').forEach(function(el) {
      el.classList.add('reveal-on-scroll');
      revealObserver.observe(el);
    });
  }

  // Keyboard shortcut: ESC to close auth modal
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAuthModal();
  });

})();


