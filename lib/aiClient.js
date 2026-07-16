const DEFAULT_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct'
]

const DEFAULT_LOCAL_MODEL = 'local-model'
const providerCooldowns = new Map()

function splitCsv(value, fallback = []) {
  if (!value) return fallback
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function cleanJsonText(text = '') {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

function parseJsonFromText(text) {
  const cleaned = cleanJsonText(text)

  try {
    return JSON.parse(cleaned)
  } catch (_) {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
    }

    throw new Error('AI returned non-JSON text')
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.7,
  maxTokens = 1536,
  topP = 1,
  responseFormat = null,
  timeoutMs = 30000
}) {
  const response = await fetchWithTimeout(
    `${baseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey || 'local-ai'}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: false,
        ...(responseFormat ? { response_format: responseFormat } : {})
      })
    },
    timeoutMs
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 300)}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]
  const content = choice?.message?.content

  if (!content) {
    throw new Error('AI response did not contain choices[0].message.content')
  }

  return {
    content,
    finishReason: choice?.finish_reason || null,
    usage: data.usage || null
  }
}

function getProviderCandidates() {
  const configuredMode = (process.env.AI_MODE || 'auto').toLowerCase()
  const mode = ['auto', 'cloud', 'local'].includes(configuredMode)
    ? configuredMode
    : 'auto'

  const cloudModels = splitCsv(process.env.GROQ_MODELS, DEFAULT_GROQ_MODELS)
  const localModels = splitCsv(process.env.LOCAL_AI_MODELS, [
    process.env.LOCAL_AI_MODEL || DEFAULT_LOCAL_MODEL
  ])

  const cloudProvider = {
    provider: 'cloud',
    label: 'Groq Cloud',
    enabled: Boolean(process.env.GROQ_API_KEY),
    baseUrl: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    models: cloudModels,
    timeoutMs: Number(process.env.AI_CLOUD_TIMEOUT_MS || 25000)
  }

  const localProvider = {
    provider: 'local',
    label: 'Local llama.cpp',
    enabled: true,
    baseUrl: process.env.LOCAL_AI_BASE_URL || 'http://127.0.0.1:8080/v1',
    apiKey: process.env.LOCAL_AI_API_KEY || 'local-ai',
    models: localModels,
    timeoutMs: Number(process.env.AI_LOCAL_TIMEOUT_MS || 60000)
  }

  if (mode === 'cloud') return [cloudProvider]
  if (mode === 'local') return [localProvider]

  // Final product behavior: try cloud first. If internet/cloud is unavailable,
  // fall back to local offline AI automatically.
  return [cloudProvider, localProvider]
}

function shouldPauseProvider(provider, error) {
  if (provider.provider !== 'cloud') return false

  return /timed out|fetch failed|enotfound|econn|HTTP (401|403|408|429|5\d\d)/i.test(
    error.message
  )
}

export async function generateAIResponse({
  messages,
  temperature = 0.7,
  maxTokens = 1536,
  topP = 1,
  json = false,
  validateJson = null
}) {
  const providers = getProviderCandidates()
  const errors = []

  for (const provider of providers) {
    if (!provider.enabled) {
      errors.push(`${provider.label}: disabled or missing API key`)
      continue
    }

    const cooldownUntil = providerCooldowns.get(provider.provider) || 0
    if (Date.now() < cooldownUntil) {
      errors.push(`${provider.label}: temporarily skipped after a recent provider failure`)
      continue
    }

    for (const model of provider.models) {
      try {
        console.log(`🤖 Trying ${provider.label}: ${model}`)

        const response = await callOpenAICompatible({
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          model,
          messages,
          temperature,
          maxTokens,
          topP,
          responseFormat: json ? { type: 'json_object' } : null,
          timeoutMs: provider.timeoutMs
        })

        providerCooldowns.delete(provider.provider)

        const result = {
          content: response.content,
          model,
          provider: provider.provider,
          offline: provider.provider === 'local',
          finishReason: response.finishReason,
          usage: response.usage
        }

        if (json) {
          result.json = parseJsonFromText(response.content)

          if (validateJson) {
            const validationResult = validateJson(result.json)

            if (validationResult !== true) {
              throw new Error(
                typeof validationResult === 'string'
                  ? `AI returned invalid structured data: ${validationResult}`
                  : 'AI returned invalid structured data'
              )
            }
          }
        }

        return result
      } catch (error) {
        const message = `${provider.label}/${model}: ${error.message}`
        console.warn(`⚠️ ${message}`)
        errors.push(message)

        if (shouldPauseProvider(provider, error)) {
          providerCooldowns.set(
            provider.provider,
            Date.now() + Number(process.env.AI_PROVIDER_COOLDOWN_MS || 5000)
          )
          break
        }
      }
    }
  }

  throw new Error(`All AI providers failed. ${errors.join(' | ')}`)
}
