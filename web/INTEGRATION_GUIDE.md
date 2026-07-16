# 🔌 AI INTEGRATION GUIDE

## Overview
This guide shows exactly how to integrate AI features into the prototype.

---

## 1️⃣ Environment Setup

### Create `.env.local` file:
```env
# AI APIs (choose one or multiple for fallback)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_AI_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# Optional: Database for caching
DATABASE_URL=postgresql://user:password@localhost:5432/socratiq
```

---

## 2️⃣ Install Additional Dependencies

```bash
npm install groq-sdk openai @google/generative-ai
npm install pdf-parse  # For PDF processing
```

---

## 3️⃣ Create AI Utility Functions

### `lib/ai/groq.js`
```javascript
import Groq from 'groq-sdk'

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
})

const DIFFICULTY_PROMPTS = {
  beginner: "You are a beginner-level tutor. Focus on foundational concepts, definitions, and straightforward applications.",
  intermediate: "You are an intermediate-level tutor. Emphasize problem-solving, system design, and practical implementations.",
  advanced: "You are an advanced-level tutor. Challenge learners to analyze, innovate, and optimize complex systems.",
  expert: "You are an expert tutor using Bloom's Taxonomy. Progress through: remember, understand, apply, analyze, evaluate, and create."
}

export async function getExplanation(text, difficulty = 'beginner', context = '') {
  const systemPrompt = DIFFICULTY_PROMPTS[difficulty]
  
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Context from textbook:\n${context}\n\nPlease explain this concept: "${text}"`
      }
    ],
    model: 'mixtral-8x7b-32768',
    temperature: 0.7,
    max_tokens: 1000
  })
  
  return response.choices[0].message.content
}

export async function chatResponse(messages, difficulty = 'beginner') {
  const systemPrompt = DIFFICULTY_PROMPTS[difficulty]
  
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt + "\nYou are a helpful Science tutor for Form 5 students."
      },
      ...messages
    ],
    model: 'mixtral-8x7b-32768',
    temperature: 0.8
  })
  
  return response.choices[0].message.content
}

export async function generateQuiz(content, difficulty = 'beginner') {
  const prompt = `Based on this content, generate 3 multiple-choice questions in JSON format:

Content: ${content}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation"
    }
  ]
}

Requirements:
- Q1 & Q2: Directly from content
- Q3: Requires deeper understanding
- Difficulty level: ${difficulty}`

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a quiz generator. Return ONLY valid JSON, no markdown, no extra text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'mixtral-8x7b-32768',
    temperature: 0.5
  })
  
  const content = response.choices[0].message.content
  // Remove markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  return JSON.parse(cleaned)
}
```

---

## 4️⃣ Create API Routes

### `app/api/explain/route.js`
```javascript
import { NextResponse } from 'next/server'
import { getExplanation } from '@/lib/ai/groq'
import { findRelevantContext } from '@/lib/textbook/search'

export async function POST(request) {
  try {
    const { text, difficulty } = await request.json()
    
    // Find relevant context from textbook
    const context = await findRelevantContext(text)
    
    // Get AI explanation
    const explanation = await getExplanation(text, difficulty, context)
    
    return NextResponse.json({ 
      success: true,
      explanation 
    })
  } catch (error) {
    console.error('Explanation error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
```

### `app/api/chat/route.js`
```javascript
import { NextResponse } from 'next/server'
import { chatResponse } from '@/lib/ai/groq'

export async function POST(request) {
  try {
    const { messages, difficulty } = await request.json()
    
    const response = await chatResponse(messages, difficulty)
    
    return NextResponse.json({ 
      success: true,
      response 
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
```

### `app/api/quiz/route.js`
```javascript
import { NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/ai/groq'

export async function POST(request) {
  try {
    const { content, difficulty } = await request.json()
    
    const quiz = await generateQuiz(content, difficulty)
    
    return NextResponse.json({ 
      success: true,
      quiz 
    })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
```

---

## 5️⃣ PDF Processing (Algorithm 1 from Paper)

### `lib/textbook/processor.js`
```javascript
import pdf from 'pdf-parse'
import fs from 'fs/promises'

// Algorithm 1: Fuzzy Paragraph Matching
function calculateFingerprint(text) {
  // Remove punctuation and convert to lowercase
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, '')
  
  // Calculate average ASCII value
  const sum = cleaned.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0
  )
  
  return sum / cleaned.length
}

function levenshteinDistance(a, b) {
  const matrix = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

export async function processPDF(filepath) {
  // Read PDF
  const dataBuffer = await fs.readFile(filepath)
  const data = await pdf(dataBuffer)
  
  // Split into paragraphs
  const paragraphs = data.text
    .split('\n\n')
    .filter(p => p.trim().length > 50) // Filter out small fragments
  
  // Create fingerprint map
  const textMap = paragraphs.map((text, id) => ({
    id,
    text,
    fingerprint: calculateFingerprint(text)
  }))
  
  // Sort by fingerprint for binary search
  textMap.sort((a, b) => a.fingerprint - b.fingerprint)
  
  return textMap
}

export function findSimilarParagraphs(query, textMap, k = 3) {
  const queryFingerprint = calculateFingerprint(query)
  
  // Binary search for closest fingerprints
  let left = 0
  let right = textMap.length - 1
  let closestIndex = 0
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const diff = Math.abs(textMap[mid].fingerprint - queryFingerprint)
    const closestDiff = Math.abs(textMap[closestIndex].fingerprint - queryFingerprint)
    
    if (diff < closestDiff) {
      closestIndex = mid
    }
    
    if (textMap[mid].fingerprint < queryFingerprint) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  
  // Get neighboring candidates
  const candidateRange = 20
  const start = Math.max(0, closestIndex - candidateRange)
  const end = Math.min(textMap.length, closestIndex + candidateRange)
  const candidates = textMap.slice(start, end)
  
  // Calculate Levenshtein similarity
  const scored = candidates.map(candidate => {
    const distance = levenshteinDistance(query, candidate.text)
    const maxLen = Math.max(query.length, candidate.text.length)
    const similarity = 1 - (distance / maxLen)
    
    return {
      ...candidate,
      similarity
    }
  })
  
  // Sort by similarity and return top k
  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, k)
}
```

### `lib/textbook/search.js`
```javascript
import { findSimilarParagraphs } from './processor'

// This will be loaded once when the app starts
let textbookIndex = null

export async function initializeTextbook() {
  if (!textbookIndex) {
    const { processPDF } = await import('./processor')
    textbookIndex = await processPDF('public/textbooks/science-form-5.pdf')
  }
  return textbookIndex
}

export async function findRelevantContext(query, k = 3) {
  const index = await initializeTextbook()
  const similar = findSimilarParagraphs(query, index, k)
  
  // Return combined context
  return similar.map(p => p.text).join('\n\n---\n\n')
}
```

---

## 6️⃣ Update Components to Use API

### Update `components/AIToolsPanel.jsx`

Replace the placeholder functions:

```javascript
// Replace handleExplainText function
const handleExplainText = async () => {
  if (!selectedText) return

  const explanationRequest = {
    id: chatMessages.length + 1,
    type: 'user',
    content: `Explain (${difficulty} level): "${selectedText}"`
  }

  setChatMessages([...chatMessages, explanationRequest])

  try {
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: selectedText, 
        difficulty 
      })
    })

    const data = await response.json()

    if (data.success) {
      const aiExplanation = {
        id: chatMessages.length + 2,
        type: 'assistant',
        content: data.explanation
      }
      setChatMessages(prev => [...prev, aiExplanation])
    }
  } catch (error) {
    console.error('Error getting explanation:', error)
  }
}

// Replace handleSendMessage function
const handleSendMessage = async () => {
  if (!inputMessage.trim()) return

  const newMessage = {
    id: chatMessages.length + 1,
    type: 'user',
    content: inputMessage
  }

  setChatMessages([...chatMessages, newMessage])
  setInputMessage('')

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: chatMessages.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        difficulty 
      })
    })

    const data = await response.json()

    if (data.success) {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: 'assistant',
        content: data.response
      }
      setChatMessages(prev => [...prev, aiResponse])
    }
  } catch (error) {
    console.error('Error getting response:', error)
  }
}
```

---

## 7️⃣ Testing

```bash
# Start development server
npm run dev

# Test in browser:
1. Highlight text → Check Explain Text tab
2. Click "Get Explanation" → Should call /api/explain
3. Type in chat → Should call /api/chat
4. Check browser console for any errors
```

---

## 8️⃣ Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# Settings → Environment Variables → Add:
# - GROQ_API_KEY
# - OPENAI_API_KEY (if using)
# - GOOGLE_AI_API_KEY (if using)
```

---

## 📊 Cost Estimation (Per Month)

Based on SocratiQ paper Table 3:

**For 20 students, 30 calls/day, 5 days/week:**
- **Groq (Mixtral-8x7b)**: ~$5-7/month
- **Google Gemini**: ~$4-5/month
- **OpenAI GPT-4**: ~$150-180/month

**Recommendation**: Start with Groq or Gemini for cost-effectiveness.

---

## 🔒 Security Best Practices

1. **Never commit API keys** to Git
2. **Use environment variables** for all secrets
3. **Implement rate limiting** on API routes
4. **Validate all user input** before sending to AI
5. **Sanitize AI responses** before displaying

---

**You're all set! 🚀**
