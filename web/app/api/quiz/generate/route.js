import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

// Model selection (SocratiQ strategy)
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct'
]

export async function POST(request) {
  try {
    const { content, chapterTitle, subchapterTitle, difficulty = 'beginner' } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      // Fallback mock response for development
      console.warn('⚠️ GROQ_API_KEY not set, using mock quiz')
      return NextResponse.json({
        quiz: {
          title: `${subchapterTitle || chapterTitle} Quiz`,
          questions: [
            {
              question: `What is the main concept discussed in ${subchapterTitle || chapterTitle}?`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0,
              explanation: '[Mock] This is a placeholder quiz. Set GROQ_API_KEY to generate real quizzes using Groq AI.'
            },
            {
              type: 'structured-working',
              question: 'How would you apply this concept in real life?',
              marks: 4,
              acceptedFinalAnswers: ['Application 1'],
              modelAnswer: '[Mock] Show clear working or explanation steps here.',
              rubric: [
                { marks: 1, criteria: 'Identifies the correct concept.' },
                { marks: 1, criteria: 'Uses relevant information from the question.' },
                { marks: 1, criteria: 'Shows clear reasoning or working.' },
                { marks: 1, criteria: 'Gives a suitable final answer.' }
              ]
            },
            {
              question: 'Why is this concept important in science?',
              options: ['Reason 1', 'Reason 2', 'Reason 3', 'Reason 4'],
              correctAnswer: 2,
              explanation: '[Mock] AI-generated quizzes will provide detailed explanations adapted to your difficulty level.'
            }
          ]
        }
      })
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: groqApiKey
    })

    // Adjust question complexity based on difficulty
    const difficultyInstructions = {
      beginner: 'Create questions that test basic recall and understanding of key concepts and definitions. Use simple language appropriate for Form 5 students.',
      intermediate: 'Create questions that require problem-solving and application of concepts to new situations. Include some analytical thinking.',
      advanced: 'Create questions that require analysis, evaluation, and synthesis of complex ideas. Challenge students to think critically.',
      expert: 'Create questions following Bloom\'s Taxonomy, progressing from remembering to creating. Include higher-order thinking questions that require deep understanding.'
    }

    const quizPrompt = `Create a quiz from the following Form 5 Science textbook section about "${subchapterTitle || chapterTitle}".

${difficultyInstructions[difficulty]}

The quiz should have 3 questions in JSON format:
- Q1 & Q2: multiple-choice objective questions directly related to the content provided
- Q3: structured subjective working question that requires students to show steps like an exam answer

CRITICAL: Return ONLY valid JSON with this EXACT structure (no markdown, no extra text):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation in Bahasa Malaysia"
    },
    {
      "question": "Question 2?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 1,
      "explanation": "Explanation here"
    },
    {
      "type": "structured-working",
      "marks": 4,
      "question": "Subjective exam-style question asking the student to show working steps.",
      "acceptedFinalAnswers": ["Accepted final answer 1", "Accepted final answer 2"],
      "modelAnswer": "Step-by-step model answer in Bahasa Malaysia",
      "rubric": [
        {
          "marks": 1,
          "criteria": "First marking criterion"
        },
        {
          "marks": 1,
          "criteria": "Second marking criterion"
        },
        {
          "marks": 1,
          "criteria": "Third marking criterion"
        },
        {
          "marks": 1,
          "criteria": "Final answer or conclusion criterion"
        }
      ]
    }
  ]
}

CONTENT TO CREATE QUIZ FROM:
${content.substring(0, 4000)}

Remember: Return ONLY the JSON object, no markdown formatting, no code blocks, no additional text.`

    // Try models in order
    let lastError = null
    
    for (const model of GROQ_MODELS) {
      try {
        console.log(`🧠 Generating quiz with: ${model}`)
        
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a quiz generation expert for Malaysian Form 5 Science curriculum. Generate questions that are clear, educational, and appropriate for the difficulty level. Always return pure JSON without any markdown formatting.'
            },
            {
              role: 'user',
              content: quizPrompt
            }
          ],
          model: model,
          temperature: 0.8, // Higher temperature for variety
          max_tokens: 2048,
          top_p: 1,
          stream: false
        })

        let quizText = chatCompletion.choices[0]?.message?.content || ''

        // Clean up response - remove markdown formatting if present
        quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        // Parse JSON
        try {
          const quizData = JSON.parse(quizText)
          
          console.log(`✅ Quiz generated successfully with: ${model}`)
          
          return NextResponse.json({
            quiz: {
              title: `${subchapterTitle || chapterTitle} Quiz`,
              ...quizData
            },
            model: model
          })
        } catch (parseError) {
          console.warn(`⚠️ JSON parse failed for ${model}:`, parseError.message)
          console.log('Response was:', quizText.substring(0, 200))
          lastError = parseError
          continue // Try next model
        }

      } catch (error) {
        console.warn(`⚠️ Model ${model} failed:`, error.message)
        lastError = error
        
        // Check if it's a rate limit error
        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
          console.log('Rate limit hit, trying next model...')
          continue
        }
        
        continue
      }
    }

    // If all models failed
    console.error('❌ All Groq models failed for quiz generation:', lastError)
    return NextResponse.json(
      { 
        error: 'Unable to generate quiz at this time. Please try again.',
        details: lastError?.message 
      },
      { status: 503 }
    )

  } catch (error) {
    console.error('Error in quiz generation API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
