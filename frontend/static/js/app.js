/* StudyLens · app.js — Full frontend logic */
'use strict';

// ──────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────
const State = {
  jobId:      null,
  results:    null,
  pollTimer:  null,
  fontSize:   1,         // 0=sm 1=md 2=lg 3=xl
  isDark:     true,
  filterConf: 'all',
};
const FS_CLASSES = ['fs-sm','fs-md','fs-lg','fs-xl'];

// ──────────────────────────────────────────────────────
// API
// ──────────────────────────────────────────────────────
const API = {
  base: '',   // same-origin

  async health() {
    const r = await fetch(`${API.base}/api/health`);
    return r.json();
  },
  async demo() {
    const r = await fetch(`${API.base}/api/demo`, { method: 'POST' });
    if (!r.ok) throw new Error(`Demo failed: ${r.status}`);
    return r.json();
  },
  async upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API.base}/api/upload`, { method: 'POST', body: fd });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed: ${r.status}`);
    }
    return r.json();
  },
  async poll(jobId) {
    const r = await fetch(`${API.base}/api/job/${jobId}`);
    if (!r.ok) throw new Error(`Poll failed: ${r.status}`);
    return r.json();
  },
  async results(jobId) {
    const r = await fetch(`${API.base}/api/results/${jobId}`);
    if (!r.ok) throw new Error(`Results fetch failed: ${r.status}`);
    return r.json();
  },
  exportUrl(jobId, fmt) {
    return `${API.base}/api/export/${jobId}?fmt=${fmt}`;
  },
};

// ──────────────────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────────────────
async function checkHealth() {
  const dot  = document.getElementById('healthDot');
  const text = document.getElementById('healthText');
  try {
    const h = await API.health();
    dot.className  = 'health-dot ok';
    const parsers  = Object.entries(h.parsers)
      .filter(([,v]) => v).map(([k]) => k.toUpperCase());
    text.textContent = `API online · ${parsers.join(', ') || 'Basic'} parser${parsers.length !== 1 ? 's' : ''}`;
  } catch {
    dot.className  = 'health-dot err';
    text.textContent = 'API offline — is the server running?';
  }
}

// ──────────────────────────────────────────────────────
// VIEW ROUTING
// ──────────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn[id^="nav-"]').forEach(b => b.classList.remove('active'));

  document.getElementById(`view-${name}`).classList.add('active');
  const nb = document.getElementById(`nav-${name}`);
  if (nb) nb.classList.add('active');

  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  // Update topbar breadcrumb
  const labels = { upload:'Home', processing:'Processing…', results:'Study Results', diagrams:'Diagrams', summary:'Summary', error:'Error' };
  const fc = document.getElementById('topbar-filename');
  if (fc) fc.textContent = State.results ? State.results.filename : '';
}

// ──────────────────────────────────────────────────────
// FILE UPLOAD & DEMO
// ──────────────────────────────────────────────────────
function handleFileSelect(evt) {
  const file = evt.target.files[0];
  if (file) startUpload(file);
}

async function startUpload(file) {
  showProcessingView(file.name);
  try {
    const { job_id } = await API.upload(file);
    startPolling(job_id);
  } catch (err) {
    showError(err.message);
  }
}

async function runDemo() {
  showProcessingView('Operating_Systems_Lecture_Notes.pdf');
  try {
    const { job_id } = await API.demo();
    startPolling(job_id);
  } catch (err) {
    showError(err.message);
  }
}

// ──────────────────────────────────────────────────────
// PROCESSING VIEW
// ──────────────────────────────────────────────────────
const PROC_STEPS = [
  { key:'queued',              label:'Queued',             detail:'Waiting to start…' },
  { key:'parsing',             label:'Parsing document',   detail:'Extracting text and structure…' },
  { key:'detecting_language',  label:'Detecting language', detail:'Identifying document language…' },
  { key:'extracting_topics',   label:'Extracting topics',  detail:'Finding all major concepts…' },
  { key:'generating_questions',label:'Generating questions','detail':'Producing study Q&A pairs…' },
  { key:'detecting_diagrams',  label:'Detecting diagrams', detail:'Locating embedded visuals…' },
  { key:'scoring',             label:'Scoring confidence', detail:'Calculating reliability scores…' },
  { key:'done',                label:'Finalising',         detail:'Preparing study results…' },
];

function showProcessingView(filename) {
  document.getElementById('proc-filename').textContent = filename;
  renderProcSteps('queued', 0);
  showView('processing');
}

function renderProcSteps(currentStatus, progress) {
  const container = document.getElementById('procSteps');
  const statusOrder = PROC_STEPS.map(s => s.key);
  const currentIdx = statusOrder.indexOf(currentStatus);

  container.innerHTML = PROC_STEPS.map((step, i) => {
    let cls = 'wait-s', icon = '○', stepCls = '';
    if (i < currentIdx || currentStatus === 'done') {
      cls = 'done-s'; icon = '✓'; stepCls = 'done';
    } else if (i === currentIdx) {
      cls = 'run-s'; icon = '◌'; stepCls = 'running';
    }
    const detail = i <= currentIdx ? step.detail : 'Waiting…';
    return `<div class="proc-step ${stepCls}" id="pstep-${i}">
      <div class="step-status ${cls}">${icon}</div>
      <div class="step-info">
        <div class="step-name">${step.label}</div>
        <div class="step-detail">${detail}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('procFill').style.width = progress + '%';
  document.getElementById('procPct').textContent   = progress + '%';
}

// ──────────────────────────────────────────────────────
// POLLING
// ──────────────────────────────────────────────────────
function startPolling(jobId) {
  State.jobId = jobId;
  clearInterval(State.pollTimer);

  State.pollTimer = setInterval(async () => {
    try {
      const job = await API.poll(jobId);
      renderProcSteps(job.status, job.progress);

      if (job.status === 'done') {
        clearInterval(State.pollTimer);
        const results = await API.results(jobId);
        State.results = results;
        renderAllResults(results);
        showView('results');
        unlockNav();
        showToast('✅ Document processed! Results ready.');
        document.getElementById('exportBtn').style.display = '';
      } else if (job.status === 'error') {
        clearInterval(State.pollTimer);
        showError(job.error || 'Unknown processing error.');
      }
    } catch (err) {
      clearInterval(State.pollTimer);
      showError(err.message);
    }
  }, 800);
}

// ──────────────────────────────────────────────────────
// RENDER ALL RESULTS
// ──────────────────────────────────────────────────────
function renderAllResults(r) {
  const { topics, questions, diagrams, stats, filename } = r;

  // Meta labels
  document.getElementById('resultsMeta').textContent =
    `${filename} · ${stats.pages} pages · ${stats.language} · Processed in ${stats.proc_time_s}s`;
  document.getElementById('diagMeta').textContent =
    `${diagrams.length} diagram${diagrams.length !== 1 ? 's' : ''} detected`;
  document.getElementById('exportLabel').innerHTML =
    `<strong>${questions.length} questions</strong> from ${topics.length} topics · ${diagrams.length} diagrams`;
  document.getElementById('tc-q').textContent = questions.length;
  document.getElementById('tc-t').textContent = topics.length;
  document.getElementById('nb-qcount').textContent = questions.length;
  document.getElementById('nb-dcount').textContent = diagrams.length;

  renderTopicTree(topics);
  renderQuestions(questions);
  renderTopicsTab(topics);
  renderSourceMap(questions);
  renderDiagrams(diagrams);
  renderSummary(r);
}

// ──────────────────────────────────────────────────────
// SIDEBAR TOPIC TREE
// ──────────────────────────────────────────────────────
function renderTopicTree(topics) {
  const tree = document.getElementById('topicTree');
  tree.innerHTML = topics.map(t => {
    const cls = t.conf >= 85 ? 'conf-high' : t.conf >= 60 ? 'conf-mid' : 'conf-low';
    return `<div class="tree-item" onclick="scrollToTopic(${t.id})">
      <div class="tree-dot"></div>
      <span style="flex:1">${t.name}</span>
      <span class="tree-conf ${cls}">${t.conf}%</span>
    </div>`;
  }).join('');
}

function scrollToTopic(id) {
  showView('results');
  const el = document.getElementById(`qcard-topic-${id}`);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

// ──────────────────────────────────────────────────────
// QUESTIONS
// ──────────────────────────────────────────────────────
function renderQuestions(questions, filter = 'all') {
  let qs = questions;
  if (filter === 'high')    qs = questions.filter(q => q.conf >= 85);
  if (filter === 'concept') qs = questions.filter(q => q.tag && q.tag.toLowerCase().includes('concept'));
  if (filter === 'algo')    qs = questions.filter(q => q.tag && (q.tag.toLowerCase().includes('algo') || q.tag.toLowerCase().includes('algorithm')));

  const container = document.getElementById('questionsContainer');
  if (!qs.length) {
    container.innerHTML = '<div style="color:var(--text3);font-size:0.85rem;padding:20px 0">No questions match this filter.</div>';
    return;
  }
  container.innerHTML = qs.map((q, i) => {
    const cc = confClass(q.conf), cl = confLabel(q.conf);
    return `<div class="q-card" id="qcard-${q.id}">
      <div class="q-card-top">
        <div class="q-num">Q${String(i + 1).padStart(2, '0')}</div>
        <div class="q-text">${escHtml(q.q)}</div>
      </div>
      <div class="q-meta">
        <span class="q-tag">${escHtml(q.tag || 'General')}</span>
        <span class="q-page">📄 ${escHtml(q.page || '—')}</span>
        <span class="conf-pill ${cc}">${cl} · ${q.conf}%</span>
      </div>
      <div class="q-answer" id="ans-${q.id}">
        <span class="q-answer-label">Example Answer</span>
        ${escHtml(q.a)}
      </div>
      <button class="q-toggle" onclick="toggleAns(${q.id},this)">Show Answer ↓</button>
    </div>`;
  }).join('');
}

function toggleAns(id, btn) {
  const el = document.getElementById(`ans-${id}`);
  el.classList.toggle('open');
  btn.textContent = el.classList.contains('open') ? 'Hide Answer ↑' : 'Show Answer ↓';
}

function filterQuestions(btn, f) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (State.results) renderQuestions(State.results.questions, f);
}

// ──────────────────────────────────────────────────────
// TOPICS TAB
// ──────────────────────────────────────────────────────
function renderTopicsTab(topics) {
  document.getElementById('topicsContainer').innerHTML = topics.map(t => {
    const cc = confClass(t.conf);
    const color = t.conf >= 85 ? 'var(--accent2)' : t.conf >= 60 ? 'var(--gold)' : 'var(--red)';
    return `<div class="topic-card" id="qcard-topic-${t.id}">
      <div class="topic-card-top">
        <div class="topic-name">${escHtml(t.name)}</div>
        <span class="q-tag">${escHtml(t.tag || 'General')}</span>
        <span class="q-page">📄 ${escHtml(t.page || '—')}</span>
        <span class="conf-pill ${cc}">${t.conf}%</span>
      </div>
      <div class="topic-prog-bar">
        <div class="topic-prog-fill" style="width:${t.conf}%;background:${color}"></div>
      </div>
    </div>`;
  }).join('');
}

// ──────────────────────────────────────────────────────
// SOURCE MAP
// ──────────────────────────────────────────────────────
function renderSourceMap(questions) {
  document.getElementById('sourceMapContainer').innerHTML =
    `<div class="card">${questions.map(q =>
      `<div class="source-row">
        <span class="source-page">${escHtml(q.page || '—')}</span>
        <span class="source-q">${escHtml(q.q.substring(0, 70))}…</span>
        <span class="source-tag">${escHtml(q.topic || '—')}</span>
      </div>`
    ).join('')}</div>`;
}

// ──────────────────────────────────────────────────────
// DIAGRAMS
// ──────────────────────────────────────────────────────
function renderDiagrams(diagrams) {
  document.getElementById('diagramsContainer').innerHTML =
    diagrams.map(d => renderDiagramCard(d)).join('');
}

function renderDiagramCard(d) {
  const cc = confClass(d.conf), cl = confLabel(d.conf);
  const visual = buildInlineDiagram(d.visual || 'generic');
  const callouts = (d.callouts || []).map(c =>
    `<div class="callout">
       <span class="callout-lbl">${escHtml(c.label)}</span>
       <span>${escHtml(c.text)}</span>
     </div>`
  ).join('');

  return `<div class="diag-card">
    <div class="diag-visual">
      <span class="diag-type-badge">${escHtml(d.type)}</span>
      ${visual}
    </div>
    <div class="diag-body">
      <div class="diag-header">
        <div class="diag-title">${escHtml(d.title)}</div>
        <span class="conf-pill ${cc}">${cl} · ${d.conf}%</span>
        <span class="q-page">📄 ${escHtml(d.page || '—')}</span>
      </div>
      <div class="diag-desc">${escHtml(d.desc)}</div>
      <div style="font-size:0.66rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Labeled Callouts</div>
      <div class="callout-list">${callouts}</div>
      ${d.warn ? `<div class="diag-warn">⚠️ Low confidence — diagram may contain complex elements. Verify against source (${escHtml(d.page || '—')}).</div>` : ''}
    </div>
  </div>`;
}

function buildInlineDiagram(type) {
  const colors = ['var(--accent3)','var(--blue2)','var(--gold2)','var(--pink)','var(--accent)'];

  if (type === 'flow') {
    const nodes = ['Start','Process A','Decision','Process B','End'];
    return `<div class="flow-row">${nodes.map((n,i) =>
      `<div class="flow-box${i===2?' hl':''}">${n}</div>${i < nodes.length-1 ? '<div class="flow-arrow">→</div>' : ''}`
    ).join('')}</div>`;
  }

  if (type === 'gantt') {
    const rows = [['P1',0,4],['P2',4,8],['P3',8,12],['P4',12,16],['P1',16,20]];
    const total = 20;
    return `<div class="gantt-wrap">
      <div class="gantt-label">TIME →  0   4   8   12  16  20</div>
      ${rows.map(([p,s,e],i) =>
        `<div class="gantt-row">
          <div class="gantt-pid">${p}</div>
          <div class="gantt-bar" style="width:${(e-s)/total*280}px;background:${colors[i%colors.length]}">${s}–${e}</div>
        </div>`
      ).join('')}
    </div>`;
  }

  if (type === 'paging') {
    return `<div class="paging-wrap">
      <div class="paging-col">
        <div class="paging-col-lbl">Logical Address</div>
        <div class="addr-box">
          <div class="addr-part addr-pg">Page #</div>
          <div class="addr-part addr-off">Offset</div>
        </div>
      </div>
      <div class="paging-arrow">→</div>
      <div class="paging-col">
        <div class="paging-col-lbl">Page Table</div>
        <div class="paging-table">
          ${[['0','Frame 3'],['1','Frame 7'],['2','Frame 1'],['3','Frame 9']].map(([p,f]) =>
            `<div class="paging-row">
              <div class="paging-cell paging-idx">${p}</div>
              <div class="paging-cell paging-val">${f}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="paging-arrow">→</div>
      <div class="paging-col">
        <div class="paging-col-lbl">Physical Memory</div>
        <div class="paging-table">
          ${['Frame 1','Frame 3','Frame 7','Frame 9'].map(f =>
            `<div class="paging-row"><div class="paging-cell paging-val">${f}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  // generic
  return `<div style="text-align:center;color:var(--text3)">
    <div style="font-size:2.5rem;margin-bottom:8px">🗺</div>
    <div style="font-size:0.78rem">Diagram extracted — see callouts</div>
  </div>`;
}

// ──────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────
function renderSummary(r) {
  const { topics, questions, diagrams, stats } = r;

  // stat cards
  const statData = [
    { val: stats.pages,     lbl: 'Pages Processed',    color: 'var(--accent)',  pct: 85 },
    { val: stats.topics,    lbl: 'Topics Extracted',   color: 'var(--blue)',    pct: Math.min(stats.topics * 10, 100) },
    { val: stats.questions, lbl: 'Questions Generated',color: 'var(--gold)',    pct: Math.min(stats.questions * 5, 100) },
    { val: stats.diagrams,  lbl: 'Diagrams Clarified', color: 'var(--pink)',    pct: Math.min(stats.diagrams * 20, 100) },
  ];
  document.getElementById('summaryStats').innerHTML = statData.map(s =>
    `<div class="sum-stat">
       <div class="sum-val">${s.val}</div>
       <div class="sum-lbl">${s.lbl}</div>
       <div class="sum-bar"><div class="sum-bar-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
     </div>`
  ).join('');

  // outline
  document.getElementById('outlineContainer').innerHTML = topics.map((t, i) => {
    const color = t.conf >= 85 ? 'var(--accent2)' : t.conf >= 60 ? 'var(--gold)' : 'var(--red)';
    return `<div class="outline-item" onclick="showView('results');scrollToTopic(${t.id})">
      <span class="outline-num">${String(i + 1).padStart(2,'0')}</span>
      <span class="outline-name">${escHtml(t.name)}</span>
      <span class="outline-page">${escHtml(t.page || '—')}</span>
      <span class="outline-conf" style="color:${color}">${t.conf}%</span>
    </div>`;
  }).join('');

  // confidence chart
  const maxCount = Math.max(stats.conf_high, stats.conf_mid, stats.conf_low, 1);
  const bars = [
    { lbl:'High ≥85%', count: stats.conf_high, color:'var(--accent2)' },
    { lbl:'Mid 60–84%',count: stats.conf_mid,  color:'var(--gold)' },
    { lbl:'Low <60%',  count: stats.conf_low,  color:'var(--red)' },
  ];
  document.getElementById('confChart').innerHTML =
    `<div class="conf-bars">${bars.map(b =>
      `<div class="conf-bar-col">
        <div class="conf-bar-num" style="color:${b.color}">${b.count}</div>
        <div class="conf-bar-body" style="height:${Math.max(b.count/maxCount*50,4)}px;background:${b.color}"></div>
        <div class="conf-bar-lbl">${b.lbl}</div>
      </div>`
    ).join('')}</div>
    <div style="font-size:0.76rem;color:var(--text3)">Average confidence: <strong style="color:var(--text)">${stats.avg_conf}%</strong></div>`;

  // processing details
  const details = [
    ['File Name',       r.filename],
    ['File Size',       `${stats.file_size_kb} KB`],
    ['Pages',           stats.pages],
    ['Language',        stats.language],
    ['Processing Time', `${stats.proc_time_s}s`],
    ['Topics Found',    stats.topics],
    ['Questions',       stats.questions],
    ['Diagrams',        stats.diagrams],
  ];
  document.getElementById('procDetails').innerHTML = details.map(([k,v]) =>
    `<div class="proc-kv-key">${k}</div><div class="proc-kv-val">${escHtml(String(v))}</div>`
  ).join('');
}

// ──────────────────────────────────────────────────────
// EXPORT
// ──────────────────────────────────────────────────────
function exportResults(fmt) {
  if (!State.jobId) { showToast('⚠️ No results to export yet.'); return; }
  const url = API.exportUrl(State.jobId, fmt);
  const a = document.createElement('a');
  a.href = url; a.download = `studylens_${State.jobId}.${fmt}`;
  a.click();
  showToast(`📥 Downloading ${fmt.toUpperCase()} export…`);
}

function copyAllQuestions() {
  if (!State.results) { showToast('⚠️ No results yet.'); return; }
  const text = State.results.questions.map((q, i) =>
    `Q${i+1}. [${q.topic}] ${q.q}\nAnswer: ${q.a}\nSource: ${q.page}  Confidence: ${q.conf}%`
  ).join('\n\n');
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 All questions copied to clipboard!'))
    .catch(() => showToast('⚠️ Copy failed — try exporting instead.'));
}

// ──────────────────────────────────────────────────────
// CONFIDENCE HELPERS
// ──────────────────────────────────────────────────────
function confClass(n)  { return n >= 85 ? 'high' : n >= 60 ? 'mid' : 'low'; }
function confLabel(n)  { return n >= 85 ? '▲ High' : n >= 60 ? '◆ Mid' : '▼ Low'; }

// ──────────────────────────────────────────────────────
// NAV & UI HELPERS
// ──────────────────────────────────────────────────────
function unlockNav() {
  ['results','diagrams','summary'].forEach(id => {
    const btn = document.getElementById(`nav-${id}`);
    if (btn) btn.disabled = false;
  });
}

function switchTab(btn, panelId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

function setFilter(btn) {
  document.querySelectorAll('.filter-nav').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`🔍 Filter: ${btn.dataset.filter}`);
}

function setFont(dir) {
  State.fontSize = Math.max(0, Math.min(3, State.fontSize + dir));
  document.body.classList.remove(...FS_CLASSES);
  document.body.classList.add(FS_CLASSES[State.fontSize]);
}

function toggleTheme() {
  State.isDark = !State.isDark;
  document.body.classList.toggle('dark',  State.isDark);
  document.body.classList.toggle('light', !State.isDark);
  document.getElementById('themeBtn').textContent = State.isDark ? '☀️' : '🌙';
  showToast(State.isDark ? '🌙 Dark mode' : '☀️ Light mode');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg || 'An unexpected error occurred.';
  showView('error');
}

// ──────────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}

// ──────────────────────────────────────────────────────
// DRAG & DROP
// ──────────────────────────────────────────────────────
function initDragDrop() {
  const dz = document.getElementById('dropZone');
  if (!dz) return;

  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) startUpload(file);
  });
}

// ──────────────────────────────────────────────────────
// UTIL
// ──────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ──────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDragDrop();
  checkHealth();
  // Re-check health every 30s
  setInterval(checkHealth, 30000);
});
