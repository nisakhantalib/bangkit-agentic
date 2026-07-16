'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, ClipboardList, FileQuestion } from 'lucide-react'
import { useState } from 'react'

export default function ChapterNavigation({ 
  chapters, 
  subjectTitle = 'Sains',
  activeChapter, 
  activeSubchapter, 
  onChapterChange, 
  onSubchapterChange,
  onPastExamOpen,
  pastExamQuestionCount = 0,
  onMockExamStart,
  mockExamQuestionCount = 0
}) {
  const [expandedChapters, setExpandedChapters] = useState([chapters[0].id])

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  const handleChapterClick = (chapter) => {
    onChapterChange(chapter)
    if (!expandedChapters.includes(chapter.id)) {
      toggleChapter(chapter.id)
    }
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-primary-900 mb-2">Isi Kandungan</h2>
        <p className="text-sm text-gray-600">{subjectTitle} Tingkatan 5</p>
      </div>

      <div className="space-y-2">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-lg overflow-hidden">
            {/* Chapter Header */}
            <motion.div
              className={`chapter-item flex items-center justify-between ${
                activeChapter.id === chapter.id ? 'active' : ''
              }`}
              onClick={() => handleChapterClick(chapter)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-xl">{chapter.icon}</span>
                <span className="font-medium text-sm">{chapter.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleChapter(chapter.id)
                }}
                className="p-1 hover:bg-white/20 rounded"
              >
                {expandedChapters.includes(chapter.id) ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            </motion.div>

            {/* Subchapters */}
            <AnimatePresence>
              {expandedChapters.includes(chapter.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 space-y-1">
                    {chapter.subchapters.map((subchapter) => (
                      <motion.div
                        key={subchapter.id}
                        className={`subchapter-item ${
                          activeSubchapter.id === subchapter.id ? 'active' : ''
                        }`}
                        onClick={() => onSubchapterChange(subchapter)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activeSubchapter.id === subchapter.id 
                              ? 'bg-primary-600' 
                              : 'bg-gray-300'
                          }`} />
                          <span>{subchapter.title}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
        <button
          onClick={onPastExamOpen}
          disabled={!pastExamQuestionCount}
          title={`Browse Past Exam: ${pastExamQuestionCount} questions with answers`}
          aria-label="Browse Past Exam"
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-1.5 text-[10px] font-bold leading-none text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <FileQuestion size={13} className="shrink-0" />
          <span className="whitespace-nowrap">Past Qs</span>
        </button>
        <button
          onClick={onMockExamStart}
          disabled={!mockExamQuestionCount}
          title={`AI Mock Exam: ${mockExamQuestionCount} objective questions`}
          aria-label="AI Mock Exam"
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg bg-primary-600 px-1.5 text-[10px] font-bold leading-none text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <ClipboardList size={13} className="shrink-0" />
          <span className="whitespace-nowrap">Mock Exam</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 p-4 bg-primary-50 rounded-lg">
        <h3 className="text-sm font-semibold text-primary-900 mb-2">Your Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Chapters Completed</span>
            <span className="font-medium">1 / {chapters.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(1/chapters.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
