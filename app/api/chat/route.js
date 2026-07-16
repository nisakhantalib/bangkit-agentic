import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { subjects } from '@/data/subjects'

// Difficulty level prompts 
const DIFFICULTY_PROMPTS = {
  beginner: `You are conversing with a Beginner learner: Use very simple language, short sentences, and everyday analogies. Focus only on the basic definition and one or two key facts. Avoid jargon entirely. Imagine you are explaining to a 16-year-old who is seeing this topic for the first time.`,

  intermediate: `You are conversing with an Intermediate learner: Explain concepts clearly with some detail. You can introduce scientific terms but always define them. Use relatable examples and connect ideas to what the student already knows about Form 5 Science.`,

  advanced: `You are conversing with an Advanced learner: Provide thorough explanations with accurate scientific terminology. Expect the student to think critically — ask them to make connections between concepts, consider causes and effects, and apply knowledge to new situations.`,

  expert: `You are an expert Science teacher using Bloom's Taxonomy: Structure your response to progress through all six levels — remember (recall facts), understand (explain in own words), apply (use in a new context), analyze (break down the concept), evaluate (judge or compare), and create (propose something new). Guide the learner through each level.`
}

const getDifficultyPrompt = (difficulty, subjectTitle) => {
  const basePrompt = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.beginner
  const preciseTerms = subjectTitle.toLowerCase().includes('mat')
    ? 'mathematical terms, notation, and working steps'
    : 'subject-specific terms'

  return basePrompt
    .replaceAll('Science', subjectTitle)
    .replaceAll('science', subjectTitle.toLowerCase())
    .replaceAll('scientific terms', preciseTerms)
    .replaceAll('scientific terminology', preciseTerms)
}

const getSubjectForRequest = (subjectKey, subjectTitle) => {
  if (subjectKey && subjects[subjectKey]) return subjects[subjectKey]

  const normalizedTitle = subjectTitle?.toLowerCase()
  return Object.values(subjects).find((subject) => (
    subject.title.toLowerCase() === normalizedTitle
  )) || subjects.science
}

const getSubjectTopicBullets = (subject) => {
  const topics = subject.chaptersData.flatMap((chapter) => [
    chapter.title,
    ...chapter.subchapters.map((subchapter) => subchapter.title)
  ])

  return topics.map((topic) => `- ${topic}`).join('\n')
}

// Model selection based on availability (SocratiQ strategy from Section 5.1)
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',      // Fallback 1
  'llama-3.1-70b-versatile',      // Fallback 2
  'meta-llama/llama-4-maverick-17b-128e-instruct'                 // Fallback 3
]

export async function POST(request) {
  try {
    const {
      message,
      difficulty = 'beginner',
      context = '',
      subjectKey = 'science',
      subjectTitle,
      conversationHistory = []
    } = await request.json()
    const subject = getSubjectForRequest(subjectKey, subjectTitle)
    const currentSubjectTitle = subject.title
    const subjectTopics = getSubjectTopicBullets(subject)

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    console.log('📚 Context received by API:', context);


    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      // Fallback to mock response for development
      console.warn('⚠️ GROQ_API_KEY not set, using mock response')
      return NextResponse.json({
        response: `[DEVELOPMENT MODE - GROQ] This is a mock response for ${currentSubjectTitle} at ${difficulty} level. In production, this will use Groq AI to provide a personalized explanation based on the ${currentSubjectTitle} textbook content.\n\nYour question: "${message}"\n\n${context ? 'Relevant textbook content has been retrieved and would be used to answer your question.' : 'No specific textbook content was retrieved for this query.'}`
      })
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: groqApiKey
    })

    // Build the system prompt with difficulty level and bounded learning context
    const systemPrompt = `${DIFFICULTY_PROMPTS[difficulty]}

You are B-Bot, an AI learning companion exclusively for "Sains Tingkatan 5" — a Form 5 Science educational platform following the Malaysian KSSM curriculum. Your SOLE purpose is to help students understand science topics covered in this platform.

${context ? context : 'Use your knowledge of Form 5 Science topics including respiration, biodiversity, conservation, and chemistry concepts.'}

## SCOPE GUARD (CRITICAL — follow this strictly):
The platform covers ONLY these topics:
- Bab 1: Mikroorganisma (bacteria, viruses, fungi, protozoa, flora normal, disease prevention)
- Bab 2: Nutrisi dan Teknologi Makanan (nutrition, food technology, food processing)
- Bab 3: Kelestarian Alam Sekitar (biodiversity, conservation, ecosystem, pollution)
- General Form 5 KSSM Science concepts related to the above

If a student asks about ANYTHING outside these science topics — such as cars, sports, celebrities, entertainment, coding, other school subjects, general knowledge trivia, or any unrelated topic — you MUST politely decline and redirect them. Use this exact format:

"Maaf, saya hanya boleh membantu dengan topik Sains Tingkatan 5 dalam platform ini. Cuba tanya saya tentang mikroorganisma, nutrisi, atau kelestarian alam sekitar! 😊"

## Response Guidelines:
- Adapt explanations to the student's difficulty level (currently: ${difficulty})
- Use examples relevant to Malaysian students and contexts
- Be encouraging and supportive
- Break down complex concepts into understandable parts
- If citing textbook content, mention which subchapter it is from
- Always aim to deepen understanding, not just provide answers
- Keep responses concise but complete (aim for 2–4 paragraphs)
- Answer in Bahasa Malaysia where possible, but may use English for scientific terms
- CRITICAL: Always write complete sentences — never stop mid-sentence or mid-thought. If you are running low on space, wrap up your current point gracefully before ending.
- You must always format responses using GitHub-flavored Markdown:
  - Use \`##\` for section headings
  - Use **bold** for key terms
  - Use bullet points (\`-\`) or numbered lists (\`1.\`) for steps
  - Use tables when comparing structured information
  - Never output plain unformatted text
`

    const subjectSystemPrompt = `${getDifficultyPrompt(difficulty, currentSubjectTitle)}

You are B-Bot, an AI learning companion exclusively for "${currentSubjectTitle} Tingkatan 5" on a Malaysian KSSM learning platform. Your SOLE purpose is to help students understand ${currentSubjectTitle} topics covered in this platform.

${context ? context : `Use your knowledge of these Form 5 ${currentSubjectTitle} platform topics:\n${subjectTopics}`}

## SCOPE GUARD (CRITICAL; follow this strictly):
The current subject is ${currentSubjectTitle}. The platform covers ONLY these ${currentSubjectTitle} topics:
${subjectTopics}

If a student asks about ANYTHING outside these ${currentSubjectTitle} topics, including a different school subject, cars, sports, celebrities, entertainment, coding, or unrelated trivia, politely decline and redirect them. Use this exact format:

"Maaf, saya hanya boleh membantu dengan topik ${currentSubjectTitle} Tingkatan 5 dalam platform ini. Cuba tanya saya tentang topik yang disenaraikan dalam subjek ${currentSubjectTitle}."

## Response Guidelines:
- Adapt explanations to the student's difficulty level (currently: ${difficulty})
- Use examples relevant to Malaysian students and contexts
- Be encouraging and supportive
- Break down complex concepts into understandable parts
- If citing textbook content, mention which subchapter it is from
- Always aim to deepen understanding, not just provide answers
- Keep responses concise but complete (aim for 2-4 paragraphs)
- Answer in Bahasa Malaysia where possible, but may use English for subject-specific terms
- For math notation, do not use raw LaTeX commands such as \propto, \frac{1}{x}, \( ... \), or \[ ... \]. Use readable plain notation instead, such as y ∝ 1/x, y = kx, x², ×, and ÷.
- Put formulas in inline code or fenced text code blocks so they render cleanly in the chat UI.
- CRITICAL: Always write complete sentences; never stop mid-sentence or mid-thought. If you are running low on space, wrap up your current point gracefully before ending.
- You must always format responses using GitHub-flavored Markdown:
  - Use \`##\` for section headings
  - Use **bold** for key terms
  - Use bullet points (\`-\`) or numbered lists (\`1.\`) for steps
  - Use tables when comparing structured information
  - Never output plain unformatted text
`

    // Build messages array with conversation history
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Try models in order (SocratiQ's multi-model strategy)
    let lastError = null
    
    for (const model of GROQ_MODELS) {
      try {
        console.log(`🤖 Attempting Groq model: ${model}`)
        
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: subjectSystemPrompt
            },
            ...messages
          ],
          model: model,
          temperature: 0.7,
          max_tokens: 1536,
          top_p: 1,
          stream: false
        })

        const aiMessage = chatCompletion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.'

        console.log(`✅ Success with model: ${model}`)
        
        return NextResponse.json({
          response: aiMessage,
          model: model // Return which model was used
        })

      } catch (error) {
        console.warn(`⚠️ Model ${model} failed:`, error.message)
        lastError = error
        
        // Check if it's a rate limit error
        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
          console.log('Rate limit hit, trying next model...')
          continue
        }
        
        // If it's another error, still try next model
        continue
      }
    }

    // If all models failed
    console.error('❌ All Groq models failed:', lastError)
    return NextResponse.json(
      { 
        error: 'All AI models are currently unavailable. Please try again in a moment.',
        details: lastError?.message 
      },
      { status: 503 }
    )

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
