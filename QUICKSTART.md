# StudyLens - Quick Start Guide

## Start the Application in 3 Steps

### Step 1: Start the Backend Server

```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will start on http://localhost:8000

### Step 2: Open Your Browser

Navigate to: **http://localhost:8000**

The frontend is automatically served by the backend.

### Step 3: Sign Up or Sign In

1. You'll see a welcome modal
2. Click "Sign Up" tab
3. Enter your details:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: (minimum 6 characters)
4. Click "Create Account"

You're in! The app will take you to your dashboard.

## First Document Upload

1. Click "+ New Upload" in the top bar
2. Either:
   - Drag and drop a PDF, PowerPoint, or Word file
   - Click "click to browse" to select a file
   - Or click "Try Demo Document" for a sample
3. Watch the processing steps
4. View your study results!

## Dashboard Overview

Your dashboard shows:
- **Total Documents**: How many documents you've uploaded
- **Processed**: Successfully analyzed documents
- **Favorites**: Documents you've marked as favorites
- **Study Streak**: Consecutive days of study
- **Study Time**: Total time spent studying
- **Questions**: Total questions generated

## Quick Actions

### Upload a Document
- Click "+ New Upload" button
- Maximum file size: 50 MB
- Supported formats: PDF, PPTX, DOCX, TXT, MD, EPUB

### View Document Results
- Click any document card in your dashboard
- See topics, questions, and diagrams
- Bookmark important questions
- Export to TXT or JSON

### Toggle Favorite
- Click the heart icon on any document card
- Favorites appear at the top of your list

### Delete a Document
- Click the trash icon on any document card
- Confirm deletion (cannot be undone)

### Change Theme
- Click the sun/moon icon in top bar
- Toggle between dark and light modes

### Adjust Font Size
- Click A− to decrease
- Click A+ to increase

### Sign Out
- Click your avatar (initials) in top right
- Select "Sign Out" from dropdown menu

## Tips for Best Results

### Document Quality
- Use clear, well-formatted documents
- Documents with proper headings work best
- Multi-column layouts may have reduced accuracy

### Study Features
- Review questions by confidence level
- Use high confidence (≥85%) questions first
- Bookmark tricky questions for review
- Export study guides for offline use

### Organization
- Favorite important documents
- Delete old documents you no longer need
- Check your dashboard regularly for stats

## Troubleshooting

### Can't Sign In?
- Check your email and password
- Password must be at least 6 characters
- Try signing up if you haven't created an account

### Document Not Processing?
- Check file size (max 50 MB)
- Verify file format is supported
- Try the demo document to test the system

### No Topics Found?
- Document may lack clear structure
- Try a document with headings
- Some file formats work better than others

### Page Not Loading?
- Check backend is running on port 8000
- Check browser console for errors
- Try refreshing the page
- Clear browser cache

## Advanced Usage

### Export Study Guides
1. Open a processed document
2. Click "Export" in top bar
3. Choose TXT or JSON format
4. File downloads automatically

### Copy Questions
1. View results of any document
2. Click "Copy All" button
3. Paste into your notes app

### Filter Topics
1. Use sidebar filters:
   - All Topics
   - High Confidence (≥85%)
   - Mid Confidence (60-84%)
   - Low Confidence (<60%)
2. Focus on high confidence for exam prep

### View Summary
1. Open any processed document
2. Click "Summary" in sidebar
3. See:
   - Processing statistics
   - Topic outline
   - Confidence distribution
   - Processing details

## Guest Mode

Want to try without signing up?

1. Click "Continue as guest" on welcome modal
2. Upload and process documents
3. Results won't be saved to cloud
4. Sign up later to keep your data

## Keyboard Shortcuts

- **Esc**: Close modal
- **Tab**: Navigate through forms
- **Enter**: Submit forms
- **Ctrl/Cmd + Click**: Open in new tab

## Mobile Usage

StudyLens works great on mobile:
- Responsive design adapts to screen size
- Touch-friendly buttons
- Swipe to close modals
- Optimized for tablets and phones

## Need Help?

- Check API documentation: http://localhost:8000/docs
- Review README-ENHANCED.md for detailed info
- Check FEATURES.md for feature list
- Browser console may have helpful error messages

## Next Steps

1. Process your first study document
2. Explore all the topics and questions
3. Try exporting a study guide
4. Set up a study routine with the streak tracker
5. Share StudyLens with study partners!

---

Happy studying with StudyLens!
