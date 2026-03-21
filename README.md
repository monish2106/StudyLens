# 🔍 StudyLens — AI Reading & Study Assistant

A full-stack web application that accepts document uploads (PDF, PPTX, DOCX, TXT, Markdown)
and automatically extracts topics, generates study questions, and clarifies diagrams.

---

## 🗂 Project Structure

```
studylens/
├── backend/
│   ├── main.py              ← FastAPI backend (all API routes + processing logic)
│   └── requirements.txt     ← Python dependencies
├── frontend/
│   ├── index.html           ← Single-page frontend shell
│   └── static/
│       ├── css/app.css      ← All styles (dark/light, responsive)
│       └── js/app.js        ← All frontend logic (API calls, rendering, routing)
├── uploads/                 ← Uploaded files (auto-created)
├── exports/                 ← Exported study guides (auto-created)
├── start.sh                 ← One-command startup script
└── README.md
```

---

## 🚀 Quick Start

### 1. Install & run (one command)
```bash
chmod +x start.sh
./start.sh
```

### 2. Or manually
```bash
pip install -r backend/requirements.txt --break-system-packages
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open browser
```
http://localhost:8000
```

---

## 📡 API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/`                   | Serve frontend                       |
| POST   | `/api/upload`         | Upload a document (multipart/form)   |
| POST   | `/api/demo`           | Process built-in demo document       |
| GET    | `/api/job/{job_id}`   | Poll processing status + progress    |
| GET    | `/api/results/{id}`   | Fetch full results (topics, Q&A, diagrams) |
| GET    | `/api/export/{id}`    | Download study guide (`?fmt=txt|json`)|
| GET    | `/api/health`         | API health + parser availability     |

---

## ✨ Features

- **File Upload** — PDF, PPTX, DOCX, TXT, Markdown, EPUB (up to 50 MB)
- **Topic Extraction** — Heuristic heading + paragraph detection with confidence scores
- **Study Q&A** — Auto-generated questions with example answers per topic
- **Diagram Hallmarks** — Detected diagram types with labeled callout explanations
- **Source Mapping** — Every question traced back to page/slide number
- **Export** — Download as JSON or formatted TXT
- **Dark / Light mode** — Full theme toggle
- **Responsive** — Mobile-friendly sidebar + layout
- **Font size controls** — Accessibility-friendly A−/A+
- **Health indicator** — Live API status in sidebar

---

## 🔧 Dependencies

| Package          | Purpose                      |
|------------------|------------------------------|
| fastapi          | Web framework + routing      |
| uvicorn          | ASGI server                  |
| python-multipart | File upload parsing          |
| PyPDF2           | PDF text extraction          |
| python-pptx      | PowerPoint text extraction   |
| python-docx      | Word document extraction     |

> All parsers are optional — the app gracefully falls back to demo content if a parser is missing.

---

## 📈 Confidence Scores

| Level  | Range  | Meaning                              |
|--------|--------|--------------------------------------|
| 🟢 High | ≥ 85% | Strong heading / well-structured text |
| 🟡 Mid  | 60–84%| Detected but context is ambiguous    |
| 🔴 Low  | < 60% | Weak signal — verify manually        |

---

## 🏗 Architecture

```
Browser (HTML/CSS/JS)
       ↓  HTTP (REST)
FastAPI server (Python)
       ↓
  File Parser (PyPDF2 / python-pptx / python-docx)
       ↓
  Extraction Pipeline (topics → questions → diagrams → scoring)
       ↓
  In-memory Job Store (dict)
       ↓
  JSON API response → Frontend renders results
```

---

## 🎯 SIH Alignment

- **Theme:** Smart Education
- **Ministry:** Ministry of Education
- **Problem:** Students waste hours re-reading dense documents; no tool auto-generates structured study material from any file format.
- **Solution:** StudyLens — upload once, get study guide instantly.
