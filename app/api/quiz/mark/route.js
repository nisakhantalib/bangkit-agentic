import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct'
]

const normalizeText = (text = '') => {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[×]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[−]/g, '-')
}

const getRubricMarks = (item) => {
  return Number(item.marks || item.mark || item.score || 1)
}

const createFallbackMarking = (question, studentAnswer) => {
  const normalizedAnswer = normalizeText(studentAnswer)
  const acceptedAnswers = question.acceptedFinalAnswers || []
  const maxMarks = question.marks || 1
  const rubric = question.rubric || []

  const matchedFinalAnswer = acceptedAnswers.some((answer) => {
    const normalizedAccepted = normalizeText(answer)
    return normalizedAccepted && normalizedAnswer.includes(normalizedAccepted)
  })

  let marksAwarded = 0

  const rubricResults = rubric.map((item) => {
    const criteria = item.criteria || ''
    const criteriaLower = criteria.toLowerCase()
    const itemMarks = getRubricMarks(item)

    let awarded = false
    let comment = 'Tidak dapat disemak sepenuhnya secara automatik.'

    if (
      criteriaLower.includes('formula') ||
      criteriaLower.includes('rumus') ||
      criteriaLower.includes('hubungan') ||
      criteriaLower.includes('relationship')
    ) {
      awarded =
        normalizedAnswer.includes('y=kx') ||
        normalizedAnswer.includes('y∝x') ||
        normalizedAnswer.includes('y=k*x') ||
        normalizedAnswer.includes('ykx')

      comment = awarded
        ? 'Rumus hubungan langsung dikesan.'
        : 'Rumus hubungan langsung tidak dikesan.'
    } else if (
      criteriaLower.includes('constant') ||
      criteriaLower.includes('pemalar') ||
      criteriaLower.includes('nilai k') ||
      criteriaLower.includes('k')
    ) {
      awarded =
        normalizedAnswer.includes('k=4') ||
        normalizedAnswer.includes('24=6k') ||
        normalizedAnswer.includes('24=6*k') ||
        normalizedAnswer.includes('24/6') ||
        normalizedAnswer.includes('6k=24')

      comment = awarded
        ? 'Nilai k yang sesuai dikesan.'
        : 'Nilai k tidak dapat dikesan dengan jelas.'
    } else if (
      criteriaLower.includes('substitute') ||
      criteriaLower.includes('substitution') ||
      criteriaLower.includes('gantikan') ||
      criteriaLower.includes('penggantian') ||
      criteriaLower.includes('x = 10') ||
      criteriaLower.includes('x=10')
    ) {
      awarded =
        normalizedAnswer.includes('x=10') ||
        normalizedAnswer.includes('4(10)') ||
        normalizedAnswer.includes('4*10') ||
        normalizedAnswer.includes('y=4x') ||
        normalizedAnswer.includes('y=4*10')

      comment = awarded
        ? 'Langkah penggantian nilai dikesan.'
        : 'Langkah penggantian nilai tidak dikesan.'
    } else if (
      criteriaLower.includes('final') ||
      criteriaLower.includes('akhir') ||
      criteriaLower.includes('jawapan') ||
      criteriaLower.includes('answer')
    ) {
      awarded = matchedFinalAnswer

      comment = awarded
        ? 'Jawapan akhir betul dikesan.'
        : 'Jawapan akhir tidak sepadan dengan jawapan diterima.'
    } else {
      awarded = matchedFinalAnswer

      comment = awarded
        ? 'Jawapan akhir betul, kriteria ini mungkin dipenuhi.'
        : 'Tidak dapat mengesahkan kriteria ini secara automatik.'
    }

    if (awarded) {
      marksAwarded += itemMarks
    }

    return {
      criteria,
      awarded,
      comment
    }
  })

  if (rubric.length === 0) {
    marksAwarded = matchedFinalAnswer ? maxMarks : 0
  }

  marksAwarded = Math.max(0, Math.min(maxMarks, marksAwarded))

  return {
    marksAwarded,
    feedback: matchedFinalAnswer
      ? 'Jawapan akhir betul. Markah diberi menggunakan fallback marker kerana AI tidak tersedia.'
      : 'AI tidak tersedia, jadi jawapan disemak secara asas sahaja. Sila bandingkan dengan jawapan model.',
    rubricResults,
    modelAnswer: question.modelAnswer || '',
    model: 'fallback',
    warning: 'AI marking unavailable. Fallback marking was used.'
  }
}

export async function POST(request) {
  try {
    const { question, studentAnswer, chapterTitle, subchapterTitle } =
      await request.json()

    if (!question || !studentAnswer) {
      return NextResponse.json(
        { error: 'Question and studentAnswer are required' },
        { status: 400 }
      )
    }

    const marks = question.marks || 1
    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      console.warn('GROQ_API_KEY not set, using fallback subjective marker')

      return NextResponse.json(
        createFallbackMarking(question, studentAnswer)
      )
    }

    const groq = new Groq({ apiKey: groqApiKey })

    const prompt = `You are marking a Malaysian secondary school subjective exam answer.

Mark generously but accurately. Award method marks when the student's working shows the correct idea, even if notation is slightly different. Accept Bahasa Malaysia or English. Do not punish minor spelling, spacing, or symbol formatting mistakes.

Return ONLY valid JSON with this exact structure:
{
  "marksAwarded": 0,
  "feedback": "Short feedback in Bahasa Malaysia",
  "rubricResults": [
    {
      "criteria": "Rubric criterion",
      "awarded": true,
      "comment": "Brief reason"
    }
  ],
  "modelAnswer": "Clean model answer"
}

Rules:
- marksAwarded must be a number from 0 to ${marks}.
- rubricResults must follow the provided rubric order.
- If the final answer is numerically correct but working is incomplete, award only suitable marks from the rubric.
- If the working is correct but final unit is missing, do not remove all marks; mention the unit issue.
- Keep feedback concise and useful for learning.

Chapter: ${chapterTitle || 'Unknown'}
Subchapter: ${subchapterTitle || 'Unknown'}

Question:
${question.question}

Maximum marks: ${marks}

Rubric:
${JSON.stringify(question.rubric || [], null, 2)}

Accepted final answers:
${JSON.stringify(question.acceptedFinalAnswers || [], null, 2)}

Model answer:
${question.modelAnswer || ''}

Student answer:
${studentAnswer}`

    let lastError = null

    for (const model of GROQ_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content:
                'You are a strict JSON API for exam marking. Return only valid JSON, no markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model,
          temperature: 0.2,
          max_tokens: 1536,
          top_p: 1,
          stream: false
        })

        let responseText = completion.choices[0]?.message?.content || ''

        responseText = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()

        const marking = JSON.parse(responseText)

        const marksAwarded = Math.max(
          0,
          Math.min(marks, Number(marking.marksAwarded) || 0)
        )

        return NextResponse.json({
          marksAwarded,
          feedback: marking.feedback || '',
          rubricResults: Array.isArray(marking.rubricResults)
            ? marking.rubricResults
            : [],
          modelAnswer: marking.modelAnswer || question.modelAnswer || '',
          model
        })
      } catch (error) {
        console.warn(
          `Subjective marking model ${model} failed:`,
          error.message
        )

        lastError = error
      }
    }

    console.error(
      'All subjective marking models failed, using fallback marker:',
      lastError
    )

    return NextResponse.json({
      ...createFallbackMarking(question, studentAnswer),
      details: lastError?.message
    })
  } catch (error) {
    console.error('Error in subjective marking API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}
