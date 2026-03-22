/* StudyLens Enhanced · Full-stack with Supabase */
'use strict';

import { Auth, DB, supabase } from './supabase.js';
import { initAuth, handleSignIn, handleSignUp, handleSignOut, switchAuthTab, toggleUserMenu, closeAuthModal, AuthState } from './auth.js';
import { loadDashboard, loadDocument, toggleFavorite, deleteDocument } from './dashboard.js';

// Make auth functions global
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleSignOut = handleSignOut;
window.switchAuthTab = switchAuthTab;
window.toggleUserMenu = toggleUserMenu;
window.closeAuthModal = closeAuthModal;

// Existing app.js state
const State = {
  jobId: null,
  results: null,
  currentDocId: null,
  pollTimer: null,
  fontSize: 1,
  isDark: true,
  filterConf: 'all',
};

window.State = State;

const FS_CLASSES = ['fs-sm','fs-md','fs-lg','fs-xl'];

// API (keeping existing implementation)
const API = {
  base: '',

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

// Health check
async function checkHealth() {
  const dot = document.getElementById('healthDot');
  const text = document.getElementById('healthText');
  try {
    const h = await API.health();
    dot.className = 'health-dot ok';
    const parsers = Object.entries(h.parsers)
      .filter(([,v]) => v).map(([k]) => k.toUpperCase());
    text.textContent = `API online · ${parsers.join(', ') || 'Basic'} parser${parsers.length !== 1 ? 's' : ''}`;
  } catch {
    dot.className = 'health-dot err';
    text.textContent = 'API offline — is the server running?';
  }
}

// View routing
window.showView = function(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn[id^="nav-"]').forEach(b => b.classList.remove('active'));

  document.getElementById(`view-${name}`)?.classList.add('active');
  const nb = document.getElementById(`nav-${name}`);
  if (nb) nb.classList.add('active');

  document.getElementById('sidebar')?.classList.remove('open');

  const fc = document.getElementById('topbar-filename');
  if (fc) fc.textContent = State.results ? State.results.filename : '';

  // Load dashboard when view is shown
  if (name === 'dashboard' && AuthState.user) {
    loadDashboard();
  }
};

// File upload
window.handleFileSelect = function(evt) {
  const file = evt.target.files[0];
  if (file) startUpload(file);
};

async function startUpload(file) {
  showProcessingView(file.name);
  try {
    const { job_id } = await API.upload(file);

    // Save to database if user is authenticated
    if (AuthState.user) {
      try {
        const docData = {
          user_id: AuthState.user.id,
          filename: file.name,
          file_size: file.size,
          file_type: file.type || file.name.split('.').pop(),
          pages: 0,
          processing_status: 'queued'
        };
        const savedDoc = await DB.saveDocument(docData);
        State.currentDocId = savedDoc.id;
      } catch (err) {
        console.error('Error saving document to DB:', err);
      }
    }

    startPolling(job_id);
  } catch (err) {
    showError(err.message);
  }
}

window.runDemo = async function() {
  showProcessingView('Operating_Systems_Lecture_Notes.pdf');
  try {
    const { job_id } = await API.demo();
    startPolling(job_id);
  } catch (err) {
    showError(err.message);
  }
};

// Processing view (keeping existing implementation)
const PROC_STEPS = [
  { key:'queued', label:'Queued', detail:'Waiting to start…' },
  { key:'parsing', label:'Parsing document', detail:'Extracting text and structure…' },
  { key:'detecting_language', label:'Detecting language', detail:'Identifying document language…' },
  { key:'extracting_topics', label:'Extracting topics', detail:'Finding all major concepts…' },
  { key:'generating_questions', label:'Generating questions', detail:'Producing study Q&A pairs…' },
  { key:'detecting_diagrams', label:'Detecting diagrams', detail:'Locating embedded visuals…' },
  { key:'scoring', label:'Scoring confidence', detail:'Calculating reliability scores…' },
  { key:'done', label:'Finalising', detail:'Preparing study results…' },
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
    return `<div class="proc-step ${stepCls}">
      <div class="step-status ${cls}">${icon}</div>
      <div class="step-info">
        <div class="step-name">${step.label}</div>
        <div class="step-detail">${detail}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('procFill').style.width = progress + '%';
  document.getElementById('procPct').textContent = progress + '%';
}

// Polling
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

        // Save results to database if user is authenticated
        if (AuthState.user && State.currentDocId) {
          try {
            await saveResultsToDatabase(results);
          } catch (err) {
            console.error('Error saving results to DB:', err);
          }
        }

        renderAllResults(results);
        showView('results');
        unlockNav();
        showToast('Document processed! Results ready.');
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

async function saveResultsToDatabase(results) {
  if (!State.currentDocId) return;

  // Update document status
  await DB.updateDocument(State.currentDocId, {
    pages: results.stats.pages,
    language: results.stats.language,
    processing_status: 'completed',
    processed_at: new Date().toISOString()
  });

  // Save topics
  const topicsToSave = results.topics.map((t, idx) => ({
    document_id: State.currentDocId,
    name: t.name,
    tag: t.tag,
    page: t.page,
    confidence: t.conf,
    order_index: idx
  }));
  const savedTopics = await DB.saveTopics(topicsToSave);

  // Save questions
  const questionsToSave = results.questions.map(q => {
    const topic = savedTopics.find(t => t.name === q.topic);
    return {
      document_id: State.currentDocId,
      topic_id: topic?.id || null,
      question_text: q.q,
      answer_text: q.a,
      tag: q.tag,
      page: q.page,
      confidence: q.conf
    };
  });
  await DB.saveQuestions(questionsToSave);

  // Save diagrams
  const diagramsToSave = results.diagrams.map(d => ({
    document_id: State.currentDocId,
    title: d.title,
    type: d.type,
    description: d.desc,
    page: d.page,
    confidence: d.conf,
    visual_type: d.visual,
    callouts: d.callouts
  }));
  await DB.saveDiagrams(diagramsToSave);

  // Update user stats
  if (AuthState.user) {
    const stats = await DB.getUserStats(AuthState.user.id);
    await DB.updateUserStats(AuthState.user.id, {
      total_documents: (stats?.total_documents || 0) + 1,
      total_questions: (stats?.total_questions || 0) + results.questions.length,
      last_activity: new Date().toISOString()
    });
  }
}

// Keep all existing rendering functions from original app.js
window.renderAllResults = renderAllResults;
window.unlockNav = unlockNav;

// Import remaining functions from original implementation
// (This is a partial implementation - you'd copy the rest from app.js)

window.setFont = function(dir) {
  State.fontSize = Math.max(0, Math.min(3, State.fontSize + dir));
  document.body.classList.remove(...FS_CLASSES);
  document.body.classList.add(FS_CLASSES[State.fontSize]);
};

window.toggleTheme = function() {
  State.isDark = !State.isDark;
  document.body.classList.toggle('dark', State.isDark);
  document.body.classList.toggle('light', !State.isDark);
  document.getElementById('themeBtn').textContent = State.isDark ? '☀️' : '🌙';
  showToast(State.isDark ? 'Dark mode' : 'Light mode');
};

window.toggleSidebar = function() {
  document.getElementById('sidebar')?.classList.toggle('open');
};

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg || 'An unexpected error occurred.';
  showView('error');
}

window.showToast = function(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
};

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

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Placeholder implementations - would include full implementations from original app.js
function renderAllResults(r) {
  console.log('renderAllResults', r);
  // Full implementation from original app.js would go here
}

function unlockNav() {
  ['results','diagrams','summary'].forEach(id => {
    const btn = document.getElementById(`nav-${id}`);
    if (btn) btn.disabled = false;
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initDragDrop();
  checkHealth();
  setInterval(checkHealth, 30000);

  // Initialize auth
  await initAuth();
});
