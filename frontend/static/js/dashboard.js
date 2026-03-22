import { DB } from './supabase.js';
import { AuthState } from './auth.js';

export async function loadDashboard() {
  if (!AuthState.user) {
    console.error('No authenticated user');
    return;
  }

  try {
    const [documents, stats] = await Promise.all([
      DB.getDocuments(AuthState.user.id),
      DB.getUserStats(AuthState.user.id)
    ]);

    renderDashboardStats(stats, documents);
    renderDocumentGrid(documents);
  } catch (err) {
    console.error('Error loading dashboard:', err);
    if (window.showToast) {
      window.showToast('Error loading dashboard data');
    }
  }
}

function renderDashboardStats(stats, documents) {
  const container = document.getElementById('dashboardStats');
  if (!container) return;

  const totalDocs = documents?.length || 0;
  const completedDocs = documents?.filter(d => d.processing_status === 'completed').length || 0;
  const favoriteDocs = documents?.filter(d => d.is_favorite).length || 0;

  container.innerHTML = `
    <div class="dash-stat">
      <div class="dash-stat-icon">📚</div>
      <div class="dash-stat-value">${totalDocs}</div>
      <div class="dash-stat-label">Total Documents</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-icon">✅</div>
      <div class="dash-stat-value">${completedDocs}</div>
      <div class="dash-stat-label">Processed</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-icon">❤️</div>
      <div class="dash-stat-value">${favoriteDocs}</div>
      <div class="dash-stat-label">Favorites</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-icon">🔥</div>
      <div class="dash-stat-value">${stats?.streak_days || 0}</div>
      <div class="dash-stat-label">Day Streak</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-icon">⏱️</div>
      <div class="dash-stat-value">${stats?.total_study_time_minutes || 0}</div>
      <div class="dash-stat-label">Study Minutes</div>
    </div>
    <div class="dash-stat">
      <div class="dash-stat-icon">❓</div>
      <div class="dash-stat-value">${stats?.total_questions || 0}</div>
      <div class="dash-stat-label">Questions</div>
    </div>
  `;
}

function renderDocumentGrid(documents) {
  const container = document.getElementById('documentGrid');
  if (!container) return;

  if (!documents || documents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3 class="empty-title">No documents yet</h3>
        <p class="empty-text">Upload your first document to start studying smarter with AI-powered insights</p>
        <button class="btn-primary" onclick="showView('upload')">Upload Document</button>
      </div>
    `;
    return;
  }

  container.innerHTML = documents.map(doc => {
    const statusColor = doc.processing_status === 'completed' ? 'var(--accent)' :
                       doc.processing_status === 'processing' ? 'var(--blue)' :
                       doc.processing_status === 'failed' ? 'var(--red)' : 'var(--gold)';

    const fileIcon = doc.file_type.includes('pdf') ? '📕' :
                    doc.file_type.includes('ppt') ? '📊' :
                    doc.file_type.includes('doc') ? '📝' : '📄';

    const createdDate = new Date(doc.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div class="doc-card" onclick="loadDocument('${doc.id}')" data-doc-id="${doc.id}">
        <div class="doc-card-header">
          <div class="doc-icon">${fileIcon}</div>
          <div class="doc-info">
            <div class="doc-name" title="${escHtml(doc.filename)}">${escHtml(doc.filename)}</div>
            <div class="doc-meta">
              <span>${createdDate}</span>
              <span>${doc.pages} pages</span>
              <span>${(doc.file_size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
        <div class="doc-footer">
          <span class="doc-badge" style="color:${statusColor};background:${statusColor}15">
            ${doc.processing_status}
          </span>
          <div class="doc-actions" onclick="event.stopPropagation()">
            <button class="doc-action-btn ${doc.is_favorite ? 'active' : ''}"
                    onclick="toggleFavorite('${doc.id}', ${!doc.is_favorite})"
                    title="${doc.is_favorite ? 'Remove from favorites' : 'Add to favorites'}">
              ${doc.is_favorite ? '❤️' : '🤍'}
            </button>
            <button class="doc-action-btn" onclick="deleteDocument('${doc.id}')" title="Delete document">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export async function loadDocument(docId) {
  if (!AuthState.user) return;

  try {
    if (window.showToast) window.showToast('Loading document...');

    const [document, topics, questions, diagrams] = await Promise.all([
      DB.getDocument(docId),
      DB.getTopics(docId),
      DB.getQuestions(docId),
      DB.getDiagrams(docId)
    ]);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.processing_status !== 'completed') {
      if (window.showToast) {
        window.showToast(`Document is ${document.processing_status}. Please wait.`);
      }
      return;
    }

    const results = {
      job_id: docId,
      filename: document.filename,
      topics: topics.map(t => ({
        id: t.id,
        name: t.name,
        tag: t.tag,
        page: t.page,
        conf: t.confidence
      })),
      questions: questions.map(q => ({
        id: q.id,
        topic: topics.find(t => t.id === q.topic_id)?.name || 'General',
        tag: q.tag,
        q: q.question_text,
        a: q.answer_text,
        conf: q.confidence,
        page: q.page,
        isBookmarked: q.is_bookmarked
      })),
      diagrams: diagrams.map(d => ({
        id: d.id,
        title: d.title,
        type: d.type,
        desc: d.description,
        page: d.page,
        conf: d.confidence,
        visual: d.visual_type,
        callouts: d.callouts,
        warn: d.confidence < 65
      })),
      stats: {
        pages: document.pages,
        topics: topics.length,
        questions: questions.length,
        diagrams: diagrams.length,
        language: document.language,
        file_size_kb: (document.file_size / 1024).toFixed(1),
        proc_time_s: 0,
        conf_high: topics.filter(t => t.confidence >= 85).length,
        conf_mid: topics.filter(t => t.confidence >= 60 && t.confidence < 85).length,
        conf_low: topics.filter(t => t.confidence < 60).length,
        avg_conf: topics.length ? (topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length).toFixed(1) : 0
      },
      processed_at: document.processed_at
    };

    if (window.State) {
      window.State.results = results;
      window.State.currentDocId = docId;
    }

    if (window.renderAllResults) {
      window.renderAllResults(results);
    }

    if (window.showView) {
      window.showView('results');
    }

    if (window.unlockNav) {
      window.unlockNav();
    }

    document.getElementById('exportBtn').style.display = '';

  } catch (err) {
    console.error('Error loading document:', err);
    if (window.showToast) {
      window.showToast('Error loading document');
    }
  }
}

export async function toggleFavorite(docId, isFavorite) {
  try {
    await DB.toggleFavorite(docId, isFavorite);
    if (window.showToast) {
      window.showToast(isFavorite ? 'Added to favorites' : 'Removed from favorites');
    }
    await loadDashboard();
  } catch (err) {
    console.error('Error toggling favorite:', err);
    if (window.showToast) {
      window.showToast('Error updating favorite status');
    }
  }
}

export async function deleteDocument(docId) {
  if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
    return;
  }

  try {
    await DB.deleteDocument(docId);
    if (window.showToast) {
      window.showToast('Document deleted');
    }
    await loadDashboard();
  } catch (err) {
    console.error('Error deleting document:', err);
    if (window.showToast) {
      window.showToast('Error deleting document');
    }
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.loadDashboard = loadDashboard;
window.loadDocument = loadDocument;
window.toggleFavorite = toggleFavorite;
window.deleteDocument = deleteDocument;
