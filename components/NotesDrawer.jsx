'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Download, Search, BookOpen } from 'lucide-react'

export default function NotesDrawer({ isOpen, onClose, chapter, subchapter }) {
  const [notes, setNotes] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [wordCount, setWordCount] = useState(0)

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
      }, 2000) // Auto-save after 2 seconds of inactivity

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

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l-4 border-solid border-primary-400"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <BookOpen size={24} />
                  <h2 className="text-lg font-bold">Nota Saya</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-primary-100">
                {chapter?.title} - {subchapter?.title}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nota Saya
                  </label>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{wordCount} words</span>
                    {lastSaved && (
                      <span className="text-green-600">
                        💾 {formatLastSaved()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-1 focus-within:border-primary-400 transition-colors">
                  <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Tulis nota anda di sini ..."
                    className="w-full h-96 p-3 resize-none focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-medium mb-2">
                    💡Tips
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Nota auto-save setiap 2 saat</li>
                    <li>• Review nota sebelum quiz</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-4 space-y-2">
              <motion.button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save size={18} />
                <span>Save sekarang</span>
              </motion.button>

              <motion.button
                onClick={handleExport}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={18} />
                <span>Export sebagai .txt</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}