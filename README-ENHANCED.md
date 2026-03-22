# StudyLens - AI Study Assistant (Enhanced Full-Stack Edition)

A beautiful, full-stack AI-powered study assistant that transforms any document into comprehensive study materials with authentication, cloud storage, and progress tracking.

## Features

### Core Features
- Document upload and processing (PDF, PPTX, DOCX, TXT, Markdown)
- AI-powered topic extraction with confidence scoring
- Auto-generated study questions with example answers
- Diagram detection and labeled explanations
- Multi-language support

### New Full-Stack Features
- User authentication with Supabase Auth
- Cloud document storage and history
- Personal dashboard with study statistics
- Document favorites and bookmarking
- Study progress tracking
- Real-time document sync across devices
- Secure API with Row Level Security

## Tech Stack

### Frontend
- Vanilla JavaScript with ES6 modules
- Vite for building and dev server
- Supabase JS client for auth and database
- Beautiful dark/light theme with animations
- Responsive design (mobile-first)

### Backend
- FastAPI (Python)
- Supabase PostgreSQL database
- Supabase Edge Functions
- Document processing with PyPDF2, python-pptx, python-docx

### Database
- Supabase PostgreSQL with Row Level Security
- Tables: profiles, documents, topics, questions, diagrams, study_sessions, user_stats
- Automatic user profile creation on signup
- Comprehensive RLS policies for data security

## Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
pip install -r backend/requirements.txt --break-system-packages

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Setup

The `.env` file is already configured with Supabase credentials:
```
VITE_SUPABASE_URL=https://tmpxiofcuoqdhnwbsymh.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start the Application

#### Option A: Quick Start (Recommended)
```bash
chmod +x start.sh
./start.sh
```

#### Option B: Manual Start

Terminal 1 - Backend:
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 - Frontend (Development):
```bash
cd frontend
npm run dev
```

Or use production build:
```bash
cd frontend
npm run build
```

### 4. Access the Application

- Frontend: http://localhost:5173 (dev) or http://localhost:8000 (production)
- Backend API: http://localhost:8000/api
- API Docs: http://localhost:8000/docs

## Database Schema

### Tables

1. **profiles** - User profiles linked to Supabase Auth
2. **documents** - Uploaded documents with processing status
3. **topics** - Extracted topics from documents
4. **questions** - Generated study questions
5. **diagrams** - Detected diagrams with callouts
6. **study_sessions** - Study session tracking
7. **user_stats** - User statistics and streaks

### Security

All tables have Row Level Security enabled:
- Users can only access their own data
- Authenticated users required for most operations
- Automatic profile creation on signup

## API Endpoints

### Authentication (Supabase)
- Sign up: `supabase.auth.signUp()`
- Sign in: `supabase.auth.signInWithPassword()`
- Sign out: `supabase.auth.signOut()`

### Document Processing
- `POST /api/upload` - Upload document
- `POST /api/demo` - Process demo document
- `GET /api/job/{job_id}` - Poll processing status
- `GET /api/results/{id}` - Get processing results
- `GET /api/export/{id}?fmt=txt|json` - Export study guide
- `GET /api/health` - API health check

### Database (via Supabase client)
- Documents CRUD
- Topics, Questions, Diagrams management
- Study session tracking
- User statistics

## Edge Functions

### process-document
Deployed Supabase Edge Function for enhanced document processing:
- URL: `https://tmpxiofcuoqdhnwbsymh.supabase.co/functions/v1/process-document`
- Requires JWT authentication
- Processes documents and saves to database

## Project Structure

```
studylens/
├── backend/
│   ├── main.py                 # FastAPI application
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html             # Main application (enhanced)
│   ├── dashboard.html         # Standalone dashboard
│   ├── package.json           # NPM dependencies
│   ├── vite.config.js         # Vite configuration
│   └── static/
│       ├── css/
│       │   └── app.css        # Enhanced styles with animations
│       └── js/
│           ├── app.js         # Original app logic
│           ├── app-init.js    # Module initialization
│           ├── auth.js        # Authentication module
│           ├── dashboard.js   # Dashboard module
│           └── supabase.js    # Supabase client & helpers
├── supabase/
│   └── functions/
│       └── process-document/  # Edge function
├── uploads/                   # Local file uploads
├── exports/                   # Export outputs
├── .env                       # Environment variables
└── start.sh                   # Quick start script
```

## Usage

### First Time User

1. Visit the application
2. Sign up with email and password
3. Upload your first document
4. View extracted topics, questions, and diagrams
5. Access your dashboard to see all documents

### Returning User

1. Sign in with your credentials
2. Access your dashboard
3. View document history
4. Continue studying or upload new documents

### Guest Mode

Click "Continue as guest" to use the app without authentication. Note: data won't be saved.

## Features in Detail

### Dashboard
- Total documents uploaded
- Processing status overview
- Favorite documents
- Study streak counter
- Total study time
- Quick document access

### Document Management
- Upload multiple formats
- Processing status tracking
- Favorite/unfavorite documents
- Delete documents
- View processing history

### Study Features
- Confidence-scored topics
- Auto-generated Q&A pairs
- Source page references
- Diagram explanations with callouts
- Export to TXT or JSON
- Bookmarking questions

### UI/UX
- Beautiful dark and light themes
- Smooth animations and transitions
- Responsive mobile design
- Font size controls
- Loading states and progress bars
- Toast notifications

## Security

- Row Level Security on all database tables
- JWT-based authentication
- Secure password hashing
- CORS configuration
- API rate limiting (via Supabase)
- No sensitive data in frontend code

## Performance

- Optimized database queries with indexes
- Frontend code splitting
- Lazy loading of modules
- Gzip compression
- Efficient caching strategies

## Development

### Frontend Development
```bash
cd frontend
npm run dev  # Start dev server with hot reload
npm run build  # Build for production
```

### Backend Development
```bash
uvicorn backend.main:app --reload  # Auto-reload on changes
```

### Database Migrations
Migrations are handled through Supabase. The schema is defined in the migration file and applied automatically.

## Deployment

### Frontend
Build and serve the static files:
```bash
cd frontend
npm run build
# Serve dist/ folder with your preferred static server
```

### Backend
Deploy with any ASGI server:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Database
Supabase database is already set up and running in the cloud.

## Troubleshooting

### Auth not working
- Check Supabase URL and anon key in `.env`
- Verify network connectivity
- Check browser console for errors

### Documents not saving
- Ensure user is authenticated
- Check RLS policies in Supabase dashboard
- Verify API connection

### Build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (14+ required)

## License

MIT License - See LICENSE file for details

## Credits

Built with FastAPI, Supabase, Vite, and modern web technologies.

---

For support or questions, check the API documentation at `/docs` when the server is running.
