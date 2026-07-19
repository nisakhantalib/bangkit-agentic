'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  Lightbulb,
  Target,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import DifficultySelector from './DifficultySelector'
import StudyArtifactCard from './StudyArtifactCard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import VisualBlock from './VisualBlock'

const normalizeMathNotation = (content = '') => {
  return content
    .replace(/\\\((.*?)\\\)/gs, '`$1`')
    .replace(/\\\[(.*?)\\\]/gs, '```text\n$1\n```')
    .replace(/\$\$(.*?)\$\$/gs, '```text\n$1\n```')
    .replace(/\$(.*?)\$/gs, '`$1`')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√$1')
    .replace(/\\propto/g, '∝')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\pi/g, 'π')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
}

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert'
}

const difficultyDescriptions = {
  beginner: 'Simple explanation',
  intermediate: 'Balanced explanation',
  advanced: 'Detailed explanation',
  expert: 'Deep analysis'
}

const studyToolLabels = {
  summary: 'Summary',
  keyTerms: 'Key Terms',
  flashcards: 'Flashcards'
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function AIToolsPanelEnhanced({
  selectedText,
  difficulty,
  onDifficultyChange,
  activeTab,
  onTabChange,
  triggerExplanation,
  activeChapter,
  activeSubchapter,
  subjectKey = 'science',
  subjectTitle = 'Sains'
}) {
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `Salam sejahtera, saya Cikgu ALPHA untuk ${subjectTitle}! Klik Explain pada mana-mana bahagian untuk mendapatkan penerangan, atau ajukan soalan mengenai kandungan pembelajaran.`
    }
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [difficultyExpanded, setDifficultyExpanded] = useState(false)
  const [showDifficultyHint, setShowDifficultyHint] = useState(false)
  const [serverSessionId, setServerSessionId] = useState(null)
  const [sessionResolved, setSessionResolved] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTool, setLoadingTool] = useState(null)
  const [activeStudyTool, setActiveStudyTool] = useState('summary')
  const [studyToolError, setStudyToolError] = useState('')
  const [studyToolResults, setStudyToolResults] = useState({
    summary: null,
    keyTerms: null,
    flashcards: null
  })

  const chatEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const explainTextRef = useRef(null)
  const panelRootRef = useRef(null)

  const [internalTab, setInternalTab] = useState('assistant')
  const currentTab = activeTab || internalTab

  const handleTabChange = (tab) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  const blockScreen = !sessionResolved || showDifficultyHint

  useEffect(() => {
    let cancelled = false

    setPortalReady(true)

    const resolveServerSession = async () => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' })
        if (!response.ok) throw new Error('Unable to read server session')

        const data = await response.json()
        if (cancelled) return

        const lastAcknowledgedSession = localStorage.getItem(
          'bbot-level-hint-server-session'
        )
        const isNewServerSession = lastAcknowledgedSession !== data.sessionId

        setServerSessionId(data.sessionId)
        setShowDifficultyHint(isNewServerSession)
        setDifficultyExpanded(isNewServerSession)
      } catch (error) {
        if (cancelled) return

        // If session detection fails, show the guidance rather than silently
        // allowing a first-time user to miss it.
        console.warn('Could not resolve the B-Bot server session', error)
        setShowDifficultyHint(true)
        setDifficultyExpanded(true)
      } finally {
        if (!cancelled) setSessionResolved(true)
      }
    }

    resolveServerSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const panelRoot = panelRootRef.current
    if (panelRoot) panelRoot.inert = blockScreen

    const previousOverflow = document.body.style.overflow
    if (blockScreen) document.body.style.overflow = 'hidden'

    return () => {
      if (panelRoot) panelRoot.inert = false
      document.body.style.overflow = previousOverflow
    }
  }, [blockScreen])

  const dismissDifficultyHint = () => {
    try {
      if (serverSessionId) {
        localStorage.setItem('bbot-level-hint-server-session', serverSessionId)
      }
    } catch (error) {
      console.warn('Could not save the B-Bot hint acknowledgement', error)
    }

    setShowDifficultyHint(false)
  }

  const handleDifficultyChange = (level) => {
    onDifficultyChange(level)
  }

  const getSubchapterLearningText = () => {
    if (!activeSubchapter) return ''

    const parts = []

    if (activeSubchapter.content) {
      parts.push(activeSubchapter.content)
    }

    if (Array.isArray(activeSubchapter.sections)) {
      activeSubchapter.sections.forEach((section) => {
        if (section?.content) {
          parts.push(section.content)
        }
      })
    }

    return parts.join('\n\n')
  }

  useEffect(() => {
    setStudyToolResults({ summary: null, keyTerms: null, flashcards: null })
    setStudyToolError('')
    setActiveStudyTool('summary')
  }, [activeChapter?.id, activeSubchapter?.id])

  // Auto-scroll to bottom when new messages arrive, only if user is near bottom.
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100

    if (isNearBottom) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      })
    }
  }, [chatMessages])

  // Auto-trigger explanation when triggerExplanation changes.
  useEffect(() => {
    if (triggerExplanation > 0) {
      explainTextRef.current?.()
    }
  }, [triggerExplanation])

  // Function to call AI API with task mode.
  const callAIAPI = async (userMessage, mode = 'chat') => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          mode,
          difficulty,
          subjectKey,
          subjectTitle,
          conversationHistory: chatMessages.slice(1)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      return { text: normalizeMathNotation(data.response), visual: data.visual || null }
    } catch (error) {
      console.error('Error calling AI API:', error)
      return { text: 'Sorry, I encountered an error. Please try again.', visual: null }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const currentInput = inputMessage

    const newMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: currentInput
    }

    setChatMessages(prev => [...prev, newMessage])
    setInputMessage('')

    const aiResponse = await callAIAPI(currentInput, 'chat')

    const aiMessage = {
      id: chatMessages.length + 2,
      type: 'assistant',
      content: aiResponse.text,
      visual: aiResponse.visual
    }

    setChatMessages(prev => [...prev, aiMessage])
  }

  const handleExplainText = async () => {
    if (!selectedText) return

    const words = selectedText.trim().split(/\s+/)
    const preview = words.length > 6
      ? words.slice(0, 6).join(' ') + '…'
      : selectedText.trim()

    const explanationRequest = {
      id: chatMessages.length + 1,
      type: 'user',
      content: `✨ Explain (${difficulty} level): "${preview}"`
    }

    setChatMessages(prev => [...prev, explanationRequest])

    const aiResponse = await callAIAPI(
      `Please explain this concept at a ${difficulty} level: "${selectedText}"`,
      'explain'
    )

    const aiExplanation = {
      id: chatMessages.length + 2,
      type: 'assistant',
      content: aiResponse.text,
      visual: aiResponse.visual
    }

    setChatMessages(prev => [...prev, aiExplanation])
  }

  explainTextRef.current = handleExplainText

  const generateStudyArtifact = async (tool, destination = 'chat') => {
    if (loadingTool || isLoading) return

    const title = activeSubchapter?.title || activeChapter?.title || 'this section'
    const hasSelection = selectedText && selectedText.trim().length > 0
    const content = hasSelection
      ? selectedText.trim()
      : getSubchapterLearningText() || activeChapter?.content || ''
    const sourceLabel = hasSelection ? 'focused section' : title
    const label = `${studyToolLabels[tool]}: ${sourceLabel}`

    if (!content.trim()) {
      setStudyToolError('No learning content is available for this study tool.')
      return
    }

    if (destination === 'chat') {
      setChatMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          type: 'user',
          content: label
        }
      ])
    }

    setLoadingTool(tool)
    setIsLoading(true)
    setStudyToolError('')

    try {
      const response = await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          content,
          title,
          subjectTitle,
          difficulty
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate study material')
      }

      const artifact = data.artifact
      setStudyToolResults((previous) => ({ ...previous, [tool]: artifact }))
      setActiveStudyTool(tool)

      if (destination === 'chat') {
        setChatMessages((previous) => [
          ...previous,
          {
            id: createMessageId(),
            type: 'artifact',
            artifact
          }
        ])
      }
    } catch (error) {
      console.error(`Error generating ${tool}:`, error)
      setStudyToolError(error.message)

      if (destination === 'chat') {
        setChatMessages((previous) => [
          ...previous,
          {
            id: createMessageId(),
            type: 'assistant',
            content: 'Sorry, I could not generate that study material. Please try again.'
          }
        ])
      }
    } finally {
      setLoadingTool(null)
      setIsLoading(false)
    }
  }

  const handleSummarize = () => generateStudyArtifact('summary', 'chat')
  const handleExtractKeyTerms = () => generateStudyArtifact('keyTerms', 'chat')
  const handleGenerateFlashcards = () => generateStudyArtifact('flashcards', 'chat')

  const openArtifactInTools = (tool) => {
    setActiveStudyTool(tool)
    handleTabChange('tools')
  }

  return (
    <>
      {portalReady && blockScreen && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-start justify-center bg-slate-950/35 p-4 pt-24 lg:justify-end lg:pt-28"
          role="presentation"
          onMouseDown={(event) => event.preventDefault()}
        >
          {!sessionResolved ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-gray-700 shadow-2xl">
              <Loader2 size={20} className="animate-spin text-primary-600" />
              <span>Preparing Cikgu ALPHA...</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bbot-level-hint-title"
              aria-describedby="bbot-level-hint-description"
              className="w-full max-w-sm rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-xl lg:mr-3"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full bg-yellow-200 p-1 text-yellow-700">
                  <Lightbulb size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    id="bbot-level-hint-title"
                    className="text-xs font-semibold text-yellow-900"
                  >
                    Tip: Pilih tahap penjelasan yang anda inginkan dari Cikgu ALPHA.
                  </p>
                  <p
                    id="bbot-level-hint-description"
                    className="mt-1 text-[11px] leading-relaxed text-yellow-800"
                  >
                      Pilih tahap penerangan sebelum mengajukan soalan atau menggunakan{' '}
  <strong>Explain with AI</strong>. Level Beginner memberikan jawapan yang
  lebih mudah difahami, manakala level Expert memberikan analisis yang lebih mendalam.
                  </p>

                  <button
                    type="button"
                    autoFocus
                    onClick={dismissDifficultyHint}
                    className="mt-2 rounded-md bg-yellow-300 px-3 py-1.5 text-[11px] font-bold text-yellow-950 transition-colors hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-yellow-50"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>,
        document.body
      )}

      <div ref={panelRootRef} className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-3">
        <div className="flex items-center space-x-2">
          <Sparkles size={20} />
          <div>
            <h2 className="text-base font-bold">AI Learning Assistant</h2>
            <p className="text-xs text-primary-100">Your Learning Companion</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => handleTabChange('assistant')}
          className={`flex-1 px-3 py-2 font-medium text-xs transition-all ${
            currentTab === 'assistant'
              ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <Sparkles size={14} />
            <span>Assistant</span>
          </div>
        </button>

        <button
          onClick={() => handleTabChange('tools')}
          className={`flex-1 px-3 py-2 font-medium text-xs transition-all ${
            currentTab === 'tools'
              ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <Target size={14} />
            <span>Study Tools</span>
          </div>
        </button>
      </div>

      {/* Difficulty Selector */}
      <div className="border-b border-gray-200 bg-gray-50 transition-all">
        <button
          onClick={() => setDifficultyExpanded(!difficultyExpanded)}
          className="flex w-full items-center justify-between px-3 py-2 transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">
              AI Explanation Level:{' '}
              <span className="text-primary-600 capitalize">
                {difficultyLabels[difficulty] || difficulty}
              </span>
            </span>
          </div>

          {difficultyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {difficultyExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <DifficultySelector
                  selectedDifficulty={difficulty}
                  onDifficultyChange={handleDifficultyChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {currentTab === 'assistant' ? (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gray-50 min-h-0"
            >
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={message.type === 'artifact'
                      ? 'w-full max-w-[96%]'
                      : `max-w-[85%] rounded-lg px-3 py-2 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-purple-100 text-black'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {message.type === 'artifact' ? (
                      <StudyArtifactCard
                        artifact={message.artifact}
                        onOpenInTools={() => openArtifactInTools(message.artifact.tool)}
                        onRegenerate={() => generateStudyArtifact(message.artifact.tool, 'chat')}
                      />
                    ) : (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="markdown-content text-xs leading-relaxed"
                        >
                          {message.content}
                        </ReactMarkdown>
                        {message.visual ? <VisualBlock visual={message.visual} /> : null}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center space-x-2">
                    <Loader2 size={14} className="animate-spin text-primary-600" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-shrink-0 flex-wrap gap-2 border-t border-gray-100 bg-white px-3 pb-1 pt-2">
              <motion.button
                onClick={handleSummarize}
                disabled={isLoading}
                title={`Summarize: ${activeSubchapter?.title || activeChapter?.title || 'this section'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>📝</span>
                <span>Summarize</span>
              </motion.button>

              <motion.button
                onClick={handleExtractKeyTerms}
                disabled={isLoading}
                title={`Key Terms: ${activeSubchapter?.title || activeChapter?.title || 'this section'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>🔑</span>
                <span>Key Terms</span>
              </motion.button>

              <motion.button
                onClick={handleGenerateFlashcards}
                disabled={isLoading}
                title={`Flashcards: ${activeSubchapter?.title || activeChapter?.title || 'this section'}`}
                className="flex items-center gap-1.5 rounded-full border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <CreditCard size={13} />
                <span>Flashcards</span>
              </motion.button>
            </div>

            {/* Chat Input */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-xs disabled:bg-gray-100"
                />

                <motion.button
                  onClick={handleSendMessage}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tools"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50"
          >
            <h3 className="font-semibold text-gray-800 text-sm mb-2">
              Study Tools
            </h3>

            <p className="text-[11px] leading-relaxed text-gray-600">
              Create focused learning material for{' '}
              <strong>{activeSubchapter?.title || activeChapter?.title || 'this section'}</strong>.
              Results generated in Assistant are also available here.
            </p>

            <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-200 p-1">
              {Object.entries(studyToolLabels).map(([tool, label]) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => {
                    setActiveStudyTool(tool)
                    setStudyToolError('')
                  }}
                  className={`rounded-lg px-2 py-2 text-[10px] font-bold transition-colors ${
                    activeStudyTool === tool
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    {studyToolLabels[activeStudyTool]}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {selectedText?.trim() ? 'Using focused section' : 'Using current section'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => generateStudyArtifact(activeStudyTool, 'tools')}
                  disabled={isLoading}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingTool === activeStudyTool
                    ? 'Generating...'
                    : studyToolResults[activeStudyTool]
                      ? 'Regenerate'
                      : 'Generate'}
                </button>
              </div>

              {studyToolError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                  {studyToolError}
                </div>
              )}

              {loadingTool === activeStudyTool ? (
                <div className="flex min-h-32 items-center justify-center gap-2 text-xs text-gray-600">
                  <Loader2 size={16} className="animate-spin text-primary-600" />
                  Creating {studyToolLabels[activeStudyTool].toLowerCase()}...
                </div>
              ) : studyToolResults[activeStudyTool] ? (
                <StudyArtifactCard
                  artifact={studyToolResults[activeStudyTool]}
                  onRegenerate={() => generateStudyArtifact(activeStudyTool, 'tools')}
                />
              ) : (
                <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    Generate {studyToolLabels[activeStudyTool].toLowerCase()} here,
                    or use the quick actions in Assistant without leaving your conversation.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}
