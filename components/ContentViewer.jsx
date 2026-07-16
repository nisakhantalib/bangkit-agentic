'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import QuizComponent from './QuizComponent'
import VideoPlayer from './VideoPlayer'
import { BookOpen, Video, FileQuestion, ArrowRight, StickyNote } from 'lucide-react'

export default function ContentViewer({ chapter, subchapter, onTextSelection, onExplainClick, onNotesClick, rightPanelWidth = 384 }) {
  const contentRef = useRef(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [highlightedText, setHighlightedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Reset quiz visibility when subchapter changes
    setShowQuiz(false)
  }, [subchapter.id])

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const selectedText = selection.toString().trim()
      
      if (selectedText.length > 0 && contentRef.current?.contains(selection.anchorNode)) {
        // Get selection position
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        setHighlightedText(selectedText)
        setSelectionPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top + window.scrollY
        })
        
        onTextSelection(selectedText)
      } else {
        setHighlightedText('')
      }
    }

    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [onTextSelection])

  const handleExplainClick = () => {
    if (onExplainClick) {
      onExplainClick()
    }
  }

  // Truncate text to first few words
  const getTruncatedText = (text, wordLimit = 5) => {
    const words = text.split(' ')
    if (words.length <= wordLimit) return text
    return words.slice(0, wordLimit).join(' ') + '...'
  }

  return (
    <div className="max-w-4xl mx-auto p-8 relative">
      {/* Breadcrumb */}
      <motion.div 
        className="mb-6 flex items-center space-x-2 text-sm text-gray-600"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span>{chapter.title}</span>
        <span>/</span>
        <span className="text-primary-600 font-medium">{subchapter.title}</span>
      </motion.div>

      {/* Content Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-2 mb-3">
          <BookOpen className="text-primary-600" size={28} />
          <h1 className="text-3xl font-bold text-primary-900">{subchapter.title}</h1>
        </div>
        <div className="h-1 w-20 bg-primary-600 rounded-full" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        ref={contentRef}
        className="markdown-content lesson-markdown max-w-none mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{subchapter.content}</ReactMarkdown>
      </motion.div>

      {/* Video Section */}
      {subchapter.videoUrl && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Video className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-primary-900">Penjelasan Video</h2>
            </div>
            <VideoPlayer url={subchapter.videoUrl} />
          </div>
        </motion.div>
      )}

     
      {/* Quiz Section */}
{subchapter.quiz && (
  <motion.div
    className="mb-12"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileQuestion className="text-purple-600" size={24} />
          <h2 className="text-xl font-bold text-purple-900">Test Your Knowledge</h2>
        </div>
        {!showQuiz && (
          <motion.button
            onClick={() => setShowQuiz(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Quiz
          </motion.button>
        )}
      </div>
      
      {showQuiz ? (
        <QuizComponent 
          quiz={subchapter.quiz} 
          onClose={() => setShowQuiz(false)}
          chapter={chapter}
          subchapter={subchapter}
        />
      ) : (
        <p className="text-gray-600">
          Test your understanding of {subchapter.title} with {subchapter.quiz.questions.length} questions.
        </p>
      )}
    </div>
  </motion.div>
)}
      {/* Navigation Hint */}
      <motion.div
        className="mt-12 p-4 bg-blue-50 border-l-4 border-primary-600 rounded"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-gray-700">
          💡 <strong>Petua:</strong> Pilih mana-mana teks untuk mendapatkan penjelasan peribadi daripada pembantu AI di panel sebelah kanan.
        </p>
      </motion.div>

      {/* Floating Notes Button - ICON ONLY with dynamic positioning */}
      <motion.button
        onClick={onNotesClick}
        className="fixed bottom-8 bg-yellow-400 hover:bg-yellow-500 text-gray-900 p-4 rounded-full shadow-lg transition-all z-30"
        style={{
          right: `${rightPanelWidth + 32}px`,
          transition: 'right 0.15s ease-out'
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        title="Buka Nota"
      >
        <StickyNote size={24} />
      </motion.button>

      {/* Floating Selection Indicator */}
      <AnimatePresence>
        {highlightedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: `${selectionPosition.x}px`,
              top: `${selectionPosition.y - 80}px`,
              transform: 'translateX(-50%)',
              zIndex: 50
            }}
            className="pointer-events-auto"
          >
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
              <div className="px-4 py-2 bg-neutral-300 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-700 truncate max-w-xs">
                  &quot;{getTruncatedText(highlightedText)}&quot;
                </p>
              </div>
              <motion.button
                onClick={handleExplainClick}
                className="w-full px-4 py-2.5 flex items-center justify-center space-x-2 bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm font-semibold">Semak Penjelasan AI</span>
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
