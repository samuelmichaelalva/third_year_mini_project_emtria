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
    if (n === 2 && totalFiles() === 0) return alert('Please stage at least one evidence file before running analysis.');
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
    el.ondrop = e => { e.preventDefault(); el.classList.remove('drag'); if (e.dataTransfer.files.length) onFile(type, { target: { files: e.dataTransfer.files } }); };
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
})();
