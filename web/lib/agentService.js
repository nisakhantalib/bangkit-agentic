/**
 * Thin client for the Python multi-agent AI service.
 *
 * Migration strategy (strangler-fig): the existing routes keep working against
 * Groq directly. When AI_SERVICE_URL is set, routes can delegate to the agent
 * service instead — one call site at a time — without a big-bang rewrite.
 *
 * Server-only: never import this from client components (it uses the secret key).
 */

const BASE_URL = process.env.AI_SERVICE_URL || ''
const API_KEY = process.env.AI_SERVICE_API_KEY || ''

export function isAgentServiceEnabled() {
  return Boolean(BASE_URL)
}

/**
 * Call the agent service.
 * @param {object} params
 * @param {string} params.request  - the student's message / instruction
 * @param {string} [params.subject]
 * @param {string} [params.chapter]
 * @param {Array}  [params.studentAnswers]
 * @param {number} [params.timeoutMs]
 * @returns {Promise<object>} { intent, answer, quiz, marking, sources, error }
 */
export async function callAgentService({
  request,
  subject,
  chapter,
  studentAnswers = [],
  image = null,
  timeoutMs = 30000,
}) {
  if (!BASE_URL) {
    throw new Error('AI_SERVICE_URL is not configured')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/v1/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      },
      body: JSON.stringify({
        request,
        subject: subject ?? null,
        chapter: chapter ?? null,
        student_answers: studentAnswers,
        image: image ?? null,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`agent service ${response.status}: ${detail.slice(0, 200)}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}
