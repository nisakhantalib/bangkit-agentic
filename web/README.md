# SocratiQ Prototype - AI-Powered Learning Platform

An interactive learning platform inspired by the SocratiQ research paper, built with Next.js, Tailwind CSS, and Framer Motion.

## 🎯 Features

### Current Implementation (UI/UX Complete)
- ✅ **3-Panel Layout**: Chapter Navigation | Content Viewer | AI Tools
- ✅ **Interactive Chapter Navigation**: Expandable chapters and subchapters
- ✅ **Rich Content Display**: Markdown-rendered educational content
- ✅ **Text Highlighting**: Select any text to get AI explanations
- ✅ **Difficulty Levels**: Beginner → Intermediate → Advanced → Expert
- ✅ **Embedded Videos**: YouTube video integration for each subchapter
- ✅ **Interactive Quizzes**: Multiple-choice questions with explanations
- ✅ **AI Chat Interface**: Conversational learning assistant (UI ready)
- ✅ **Progress Tracking**: Visual progress indicators
- ✅ **Smooth Animations**: Framer Motion for engaging interactions

### To Be Implemented (Requires API Integration)
- 🔄 AI-powered personalized explanations
- 🔄 Dynamic quiz generation from content
- 🔄 Real-time chat responses
- 🔄 PDF textbook parsing and indexing
- 🔄 Knowledge graph generation
- 🔄 Adaptive learning pathways

## 📁 Project Structure

```
socratiq-prototype/
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Main page (3-panel layout)
│   └── globals.css        # Global styles
├── components/
│   ├── ChapterNavigation.jsx    # Left panel - Chapter/subchapter navigation
│   ├── ContentViewer.jsx        # Middle panel - Content display
│   ├── AIToolsPanel.jsx         # Right panel - AI assistant
│   ├── DifficultySelector.jsx   # Learning level selector
│   ├── QuizComponent.jsx        # Interactive quiz interface
│   └── VideoPlayer.jsx          # YouTube video embed
├── data/
│   └── chaptersData.js    # Course content structure
├── public/
│   ├── videos/            # Video files (optional)
│   └── textbooks/         # 📚 PUT YOUR 100MB PDF HERE
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Extract the zip file**
2. **Navigate to the project directory**
   ```bash
   cd socratiq-prototype
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Adding Your Textbook PDF

### Where to Place the PDF
Put your 100MB Science Form 5 textbook PDF in:
```
public/textbooks/science-form-5.pdf
```

### Future Integration (To Be Implemented)
When integrating AI features, the PDF will be:
1. **Parsed** using `pdf-parse` library
2. **Indexed** into paragraphs with fingerprints (Algorithm 1 from paper)
3. **Stored** in a vector database for quick retrieval
4. **Used** to provide context-aware AI responses

### Example PDF Processing Code (For Future Reference)
```javascript
// lib/pdfProcessor.js (to be created)
import pdf from 'pdf-parse';
import fs from 'fs';

export async function processPDF(filepath) {
  const dataBuffer = fs.readFileSync(filepath);
  const data = await pdf(dataBuffer);
  
  // Extract and index paragraphs
  const paragraphs = data.text.split('\n\n');
  
  // Create fingerprints (Algorithm 1 from SocratiQ paper)
  const indexed = paragraphs.map((para, idx) => ({
    id: idx,
    text: para,
    fingerprint: calculateFingerprint(para)
  }));
  
  return indexed;
}

function calculateFingerprint(text) {
  // Average ASCII value (from SocratiQ Algorithm 1)
  const sum = text.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0
  );
  return sum / text.length;
}
```

## 🎨 Customization

### Theme Colors
The primary color scheme is dark blue. To customize:

**tailwind.config.js**
```javascript
colors: {
  primary: {
    600: '#1e40af',  // Main dark blue
    700: '#1e3a8a',  // Darker blue
    // ... modify as needed
  }
}
```

### Adding More Chapters
Edit `data/chaptersData.js`:

```javascript
{
  id: 4,
  title: "Chapter 4: Your New Chapter",
  icon: "🔬",
  subchapters: [
    {
      id: 4.1,
      title: "4.1 Your Subchapter",
      content: `# Your markdown content here`,
      videoUrl: "https://youtube.com/...",
      quiz: {
        questions: [...]
      }
    }
  ]
}
```

### Adding Videos
- **YouTube**: Use embed URL format
- **Local**: Place in `public/videos/` and reference as `/videos/filename.mp4`

## 🔌 API Integration Guide (Future Implementation)

### Required Environment Variables
Create a `.env.local` file:
```env
# AI Model APIs
GROQ_API_KEY=your_groq_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here

# Database (for caching)
DATABASE_URL=your_database_url_here
```

### AI Integration Points

1. **Text Explanation** (`components/AIToolsPanel.jsx`)
   - Replace placeholder in `handleExplainText()`
   - Call AI API with selected text + difficulty level

2. **Chat Responses** (`components/AIToolsPanel.jsx`)
   - Replace placeholder in `handleSendMessage()`
   - Implement conversation history management

3. **Quiz Generation** (`components/ContentViewer.jsx`)
   - Currently uses static quizzes from `chaptersData.js`
   - Implement dynamic generation based on content

### Example API Integration
```javascript
// lib/ai.js
export async function getAIExplanation(text, difficulty) {
  const response = await fetch('/api/explain', {
    method: 'POST',
    body: JSON.stringify({ text, difficulty }),
  });
  return response.json();
}

// app/api/explain/route.js
import { Groq } from 'groq-sdk';

export async function POST(request) {
  const { text, difficulty } = await request.json();
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a ${difficulty}-level tutor...`
      },
      {
        role: 'user',
        content: `Explain: ${text}`
      }
    ],
    model: 'mixtral-8x7b-32768',
  });
  
  return Response.json({ 
    explanation: response.choices[0].message.content 
  });
}
```

## 📊 Based on Research

This prototype implements concepts from:
**"SocratiQ: A Generative AI-Powered Learning Companion for Personalized Education and Broader Accessibility"**
- Authors: Jason Jabbour, Kai Kleinbard, et al.
- Institution: Harvard University
- Published: February 2025

### Key Concepts Implemented:
- ✅ Personalized explanations (4 difficulty levels)
- ✅ Adaptive assessments (interactive quizzes)
- ✅ Bounded learning (content-focused)
- ✅ Gamification (progress tracking, visual feedback)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Markdown**: react-markdown
- **Icons**: lucide-react
- **Future**: PDF parsing (pdf-parse), AI APIs (Groq, OpenAI, Google)

## 📝 Development Notes

### Current Limitations (Intentional for Prototype)
- Static content (no database)
- Placeholder AI responses
- Limited to Science Form 5 content
- No user authentication
- No backend API routes (yet)

### Next Steps for Full Implementation
1. Set up database (PostgreSQL/MongoDB)
2. Create API routes for AI integration
3. Implement PDF processing pipeline
4. Add user authentication
5. Build knowledge graph system
6. Implement caching strategy
7. Add analytics and progress tracking
8. Deploy to Vercel/AWS

## 🎓 Educational Use

Perfect for:
- Teachers creating interactive online textbooks
- Students studying Science Form 5
- EdTech developers learning AI integration
- Researchers in adaptive learning systems

## 📄 License

This is a prototype for educational purposes. The original SocratiQ concept is from Harvard University research.

## 🙏 Acknowledgments

- SocratiQ Research Team at Harvard University
- Machine Learning Systems Textbook (MLSysBook.ai)
- Open-source community for amazing tools

---

**Note**: This is a UI/UX prototype. AI features require API keys and backend implementation. 
See "API Integration Guide" section for implementation details.
