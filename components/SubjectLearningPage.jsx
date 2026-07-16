'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, GripVertical, Menu, Sparkles, X, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

import ChapterNavigation from '@/components/ChapterNavigation'
import AIToolsPanelEnhanced from '@/components/AIToolsPanelEnhanced'
import ContentViewerEnhanced from '@/components/ContentViewerEnhanced'
import NotesDrawer from '@/components/NotesDrawer'
import MockExamModal, { getMockExamQuestions } from '@/components/MockExamModal'
import PastExamModal, { getPastExamQuestions } from '@/components/PastExamModal'

const KnowledgeGraph = dynamic(() => import('@/components/KnowledgeGraph'), {
  ssr: false,
})

export default function SubjectLearningPage({ chaptersData, subjectKey = 'science', subjectTitle = 'Sains' }) {
  const router = useRouter()
  const [activeChapter, setActiveChapter] = useState(chaptersData[0])
  const [activeSubchapter, setActiveSubchapter] = useState(chaptersData[0].subchapters[0])
  const [selectedText, setSelectedText] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner')
  const [activeAITab, setActiveAITab] = useState('assistant')
  const [notesSheetOpen, setNotesSheetOpen] = useState(false)
  const [triggerExplanation, setTriggerExplanation] = useState(0)
  const [rightPanelWidth, setRightPanelWidth] = useState(380)
  const [isResizing, setIsResizing] = useState(false)
  const [knowledgeGraphOpen, setKnowledgeGraphOpen] = useState(false)
  const [pastExamOpen, setPastExamOpen] = useState(false)
  const [mockExamOpen, setMockExamOpen] = useState(false)

  // Mobile/Tablet states
  const [mobileChaptersOpen, setMobileChaptersOpen] = useState(false)
  const [mobileAIOpen, setMobileAIOpen] = useState(false)

  const aiPanelRef = useRef(null)
  const pastExamQuestions = useMemo(() => getPastExamQuestions(chaptersData), [chaptersData])
  const mockExamQuestions = useMemo(() => getMockExamQuestions(chaptersData, 999), [chaptersData])

  const handleTextSelection = (text) => {
    setSelectedText(text)
  }

  const handleExplainClick = () => {
    setActiveAITab('assistant')
    setTriggerExplanation((prev) => prev + 1)

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileAIOpen(true)
    } else if (aiPanelRef.current) {
      aiPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const handleNotesClick = () => {
    setNotesSheetOpen(true)
  }

  const markSubchapterVisited = (chapter, subchapter) => {
    if (!chapter || !subchapter) return
    try {
      const nodeId = `sub-${chapter.id}-${subchapter.id}`
      const saved = JSON.parse(localStorage.getItem('knowledgeGraphProgress') || '{}')
      if (!saved[nodeId]?.visited) {
        saved[nodeId] = { ...saved[nodeId], visited: true }
        localStorage.setItem('knowledgeGraphProgress', JSON.stringify(saved))
      }
    } catch (e) {
      console.warn('Could not mark subchapter visited', e)
    }
  }

  const handleChapterChange = (chapter) => {
    setActiveChapter(chapter)
    setActiveSubchapter(chapter.subchapters[0])
    setMobileChaptersOpen(false)
    markSubchapterVisited(chapter, chapter.subchapters[0])
  }

  const handleSubchapterChange = (subchapter) => {
    setActiveSubchapter(subchapter)
    setMobileChaptersOpen(false)
    markSubchapterVisited(activeChapter, subchapter)
  }

  const handleGraphNavigate = (chapterNumber, subchapterId) => {
    const chapter = chaptersData[chapterNumber - 1]
    if (chapter) {
      setActiveChapter(chapter)

      if (subchapterId) {
        const subchapter = chapter.subchapters.find((sub) => sub.id === subchapterId)
        setActiveSubchapter(subchapter || chapter.subchapters[0])
      } else {
        setActiveSubchapter(chapter.subchapters[0])
      }
    }
  }

  const handleMouseDown = (e) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isResizing) return

    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 280 && newWidth <= 600) {
      setRightPanelWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    markSubchapterVisited(chaptersData[0], chaptersData[0].subchapters[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }
  }, [isResizing])

  return (
    <main className="h-screen overflow-hidden bg-white">
      {/* Header */}
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={() => setMobileChaptersOpen(true)}
              className="lg:hidden p-2 hover:bg-primary-600 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>

            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-700 font-bold text-lg md:text-xl">A+</span>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold">{subjectTitle}</h1>
              <p className="text-primary-200 text-xs md:text-sm hidden sm:block">
                {activeChapter?.title} / {activeSubchapter?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="sm:hidden p-2 hover:bg-primary-600 rounded-lg transition-colors"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={22} />
            </button>

            <button
              onClick={() => setMobileAIOpen(true)}
              className="lg:hidden p-2 hover:bg-primary-600 rounded-lg transition-colors"
            >
              <Sparkles size={24} />
            </button>

            <button
              onClick={() => setKnowledgeGraphOpen(true)}
              className="hidden md:flex items-center space-x-2 px-3 md:px-4 py-2 bg-primary-500 hover:bg-primary-400 rounded-lg transition-colors"
            >
              <MapPin size={18} />
              <span className="text-xs md:text-sm font-medium">Knowledge Graph</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-72px)]">
        {/* Left Panel - Desktop Only */}
        <aside className="hidden lg:block w-56 bg-gray-50 border-r border-gray-200 overflow-y-auto custom-scrollbar flex-shrink-0">
          <ChapterNavigation
            chapters={chaptersData}
            subjectTitle={subjectTitle}
            activeChapter={activeChapter}
            activeSubchapter={activeSubchapter}
            onChapterChange={handleChapterChange}
            onSubchapterChange={handleSubchapterChange}
            onPastExamOpen={() => setPastExamOpen(true)}
            pastExamQuestionCount={pastExamQuestions.length}
            onMockExamStart={() => setMockExamOpen(true)}
            mockExamQuestionCount={mockExamQuestions.length}
          />
        </aside>

        {/* Middle Panel */}
       <section className="min-w-0 flex-1 overflow-y-auto custom-scrollbar bg-white">
          <ContentViewerEnhanced
            chapter={activeChapter}
            subchapter={activeSubchapter}
            subjectKey={subjectKey}
            onTextSelect={handleTextSelection}
            onExplainClick={handleExplainClick}
            onNotesClick={handleNotesClick}
            difficulty={selectedDifficulty}
            rightPanelWidth={rightPanelWidth}
          />
        </section>

        {/* Resize Handle - Desktop Only */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden lg:block w-1.5 bg-gray-300 hover:bg-primary-500 cursor-col-resize relative group transition-colors flex-shrink-0 ${
            isResizing ? 'bg-primary-500' : ''
          }`}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-primary-600 rounded-full p-1.5 shadow-lg">
              <GripVertical size={16} className="text-white" />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <aside
          ref={aiPanelRef}
          style={{ width: `${rightPanelWidth}px` }}
          className="hidden lg:block bg-gray-50 border-l border-gray-200 overflow-y-auto custom-scrollbar flex-shrink-0"
        >
          <AIToolsPanelEnhanced
            selectedText={selectedText}
            difficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            activeTab={activeAITab}
            onTabChange={setActiveAITab}
            triggerExplanation={triggerExplanation}
            activeChapter={activeChapter}
            activeSubchapter={activeSubchapter}
            chaptersData={chaptersData}
            subjectKey={subjectKey}
            subjectTitle={subjectTitle}
          />
        </aside>
      </div>

      {/* Mobile/Tablet - Chapters Drawer */}
      <AnimatePresence>
        {mobileChaptersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileChaptersOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="bg-primary-700 text-white p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Isi Kandungan</h2>
                <button
                  onClick={() => setMobileChaptersOpen(false)}
                  className="p-2 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <ChapterNavigation
                  chapters={chaptersData}
                  subjectTitle={subjectTitle}
                  activeChapter={activeChapter}
                  activeSubchapter={activeSubchapter}
                  onChapterChange={handleChapterChange}
                  onSubchapterChange={handleSubchapterChange}
                  onPastExamOpen={() => {
                    setMobileChaptersOpen(false)
                    setPastExamOpen(true)
                  }}
                  pastExamQuestionCount={pastExamQuestions.length}
                  onMockExamStart={() => {
                    setMobileChaptersOpen(false)
                    setMockExamOpen(true)
                  }}
                  mockExamQuestionCount={mockExamQuestions.length}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile/Tablet - AI Assistant Drawer */}
      <AnimatePresence>
        {mobileAIOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileAIOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setMobileAIOpen(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <AIToolsPanelEnhanced
                selectedText={selectedText}
                difficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
                activeTab={activeAITab}
                onTabChange={setActiveAITab}
                triggerExplanation={triggerExplanation}
                activeChapter={activeChapter}
                activeSubchapter={activeSubchapter}
                chaptersData={chaptersData}
                subjectKey={subjectKey}
                subjectTitle={subjectTitle}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notes Drawer */}
      <NotesDrawer
        isOpen={notesSheetOpen}
        onClose={() => setNotesSheetOpen(false)}
        chapter={activeChapter}
        subchapter={activeSubchapter}
      />

      {/* Knowledge Graph Modal */}
      {knowledgeGraphOpen && (
        <KnowledgeGraph
          isOpen={knowledgeGraphOpen}
          onClose={() => setKnowledgeGraphOpen(false)}
          onNavigate={handleGraphNavigate}
          currentChapter={activeChapter}
          currentSubchapter={activeSubchapter}
          chaptersData={chaptersData}
          subjectTitle={subjectTitle}
        />
      )}

      <PastExamModal
        isOpen={pastExamOpen}
        onClose={() => setPastExamOpen(false)}
        subjectTitle={subjectTitle}
        questions={pastExamQuestions}
      />

      <MockExamModal
        isOpen={mockExamOpen}
        onClose={() => setMockExamOpen(false)}
        subjectTitle={subjectTitle}
        questions={mockExamQuestions}
        chapters={chaptersData}
      />
    </main>
  )
}
