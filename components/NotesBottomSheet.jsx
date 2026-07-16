'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { GripHorizontal, X, Save, Download, Minimize2, Maximize2 } from 'lucide-react'

export default function NotesBottomSheet({ isOpen, onClose, chapter, subchapter }) {
  const [notes, setNotes] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const dragControls = useDragControls()
  const constraintsRef = useRef(null)

  // Generate unique key for notes storage
  const notesKey = `notes_${chapter?.id}_${subchapter?.id}`

  // Load notes from localStorage
  useEffect(() => {
    if (chapter && subchapter) {
      const savedNotes = localStorage.getItem(notesKey)
      if (savedNotes) {
        setNotes(savedNotes)
        setWordCount(savedNotes.trim().split(/\s+/).filter(Boolean).length)
      } else {
        setNotes('')
        setWordCount(0)
      }
    }
  }, [chapter?.id, subchapter?.id, notesKey])

  // Auto-save notes
  useEffect(() => {
    if (notes && chapter && subchapter) {
      const timer = setTimeout(() => {
        localStorage.setItem(notesKey, notes)
        setLastSaved(new Date())
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [notes, notesKey, chapter, subchapter])

  const handleNotesChange = (e) => {
    const newNotes = e.target.value
    setNotes(newNotes)
    setWordCount(newNotes.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSave = () => {
    if (chapter && subchapter) {
      localStorage.setItem(notesKey, notes)
      setLastSaved(new Date())
    }
  }

  const handleExport = () => {
    const blob = new Blob([notes], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes_${chapter?.title}_${subchapter?.title}.txt`.replace(/[^a-z0-9]/gi, '_')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatLastSaved = () => {
    if (!lastSaved) return ''
    const seconds = Math.floor((new Date() - lastSaved) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return lastSaved.toLocaleTimeString()
  }

  const sheetHeight = isExpanded ? '80vh' : '40vh'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: sheetHeight }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 flex flex-col rounded-t-3xl border-t-4 border-dashed border-primary-400"
            style={{ maxHeight: '90vh' }}
          >
            {/* Drag Handle */}
            <div className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <span>📝 Notes for: {subchapter?.title}</span>
                </h2>
                <p className="text-sm text-primary-100 mt-1">
                  {chapter?.title}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title={isExpanded ? "Minimize" : "Maximize"}
                >
                  {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
              <div className="max-w-6xl mx-auto">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="font-medium">{wordCount} words</span>
                    {lastSaved && (
                      <span className="text-green-600 flex items-center space-x-1">
                        <span>💾</span>
                        <span>{formatLastSaved()}</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={handleExport}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download size={16} />
                      <span>Export</span>
                    </motion.button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 focus-within:border-primary-400 transition-colors">
                  <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Start typing your notes here...

Tips:
- Summarize key concepts
- Note down important definitions
- Write questions to review later
- Add personal insights and connections"
                    className="w-full h-full min-h-[200px] p-4 resize-none focus:outline-none text-sm"
                    style={{ height: isExpanded ? '55vh' : '25vh' }}
                  />
                </div>

                {/* Quick Tips */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 Auto-Save</p>
                    <p className="text-xs text-blue-700">Notes save automatically every 2 seconds</p>
                  </div>
                  
                  <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-900 mb-1">📚 Organized</p>
                    <p className="text-xs text-purple-700">Notes saved per chapter and section</p>
                  </div>
                  
                  <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-900 mb-1">📤 Export</p>
                    <p className="text-xs text-green-700">Download notes as text files anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}