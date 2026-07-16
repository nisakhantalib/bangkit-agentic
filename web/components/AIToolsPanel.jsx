'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Send,
  Lightbulb,
  Target,
  CreditCard,
  FileText,
  Key,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import DifficultySelector from './DifficultySelector'

export default function AIToolsPanel({ selectedText, difficulty, onDifficultyChange, activeTab, onTabChange, triggerExplanation }) {
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI learning companion. Highlight any text from the content to get explanations, or ask me questions about the material.'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [difficultyExpanded, setDifficultyExpanded] = useState(false) // Start collapsed
  
  // Use props if provided, otherwise use internal state
  const [internalTab, setInternalTab] = useState('assistant')
  const currentTab = activeTab || internalTab
  
  const handleTabChange = (tab) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  // Auto-trigger explanation when triggerExplanation changes
  useEffect(() => {
    if (triggerExplanation > 0 && selectedText) {
      handleExplainText()
    }
  }, [triggerExplanation])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: inputMessage
    }

    setChatMessages([...chatMessages, newMessage])
    setInputMessage('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: 'assistant',
        content: 'This is a placeholder response. In the production version, this will be powered by an AI model that provides personalized explanations based on your selected difficulty level.'
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleExplainText = () => {
    if (!selectedText) return

    const explanationRequest = {
      id: chatMessages.length + 1,
      type: 'user',
      content: `Explain (${difficulty} level): "${selectedText}"`
    }

    setChatMessages(prev => [...prev, explanationRequest])

    // Simulate AI explanation
    setTimeout(() => {
      const aiExplanation = {
        id: chatMessages.length + 2,
        type: 'assistant',
        content: `Here's a ${difficulty}-level explanation: This is a placeholder. The actual implementation will use AI to provide personalized explanations of the selected text based on the difficulty level you've chosen.`
      }
      setChatMessages(prev => [...prev, aiExplanation])
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - COMPACT */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-3">
        <div className="flex items-center space-x-2">
          <Sparkles size={20} />
          <div>
            <h2 className="text-base font-bold">AI Learning Assistant</h2>
            <p className="text-xs text-primary-100">Your personalized companion</p>
          </div>
        </div>
      </div>

      {/* Tabs - COMPACT */}
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

      {/* Collapsible Difficulty Selector - COMPACT */}
      <div className="border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setDifficultyExpanded(!difficultyExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <span className="text-xs font-semibold text-gray-700">
            Level: <span className="text-primary-600 capitalize">{difficulty}</span>
          </span>
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
                  onDifficultyChange={onDifficultyChange}
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
            {/* Selected Text Preview - COMPACT */}
            {selectedText && (
              <div className="flex-shrink-0 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
                <div className="border-2 border-dashed border-amber-400 rounded-lg p-2 bg-white shadow-sm">
                  <div className="flex items-start space-x-1 mb-1">
                    <Lightbulb size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-semibold text-amber-900">Selected Text</p>
                  </div>
                  <p className="text-xs text-gray-700 italic line-clamp-2 mb-2">&quot;{selectedText}&quot;</p>
                  {/* <motion.button
                    onClick={handleExplainText}
                    className="w-full px-3 py-1.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg text-xs font-semibold hover:from-primary-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-1 shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles size={14} />
                    <span>Explain This</span>
                  </motion.button> */}
                </div>
              </div>
            )}

            {/* Chat Messages - MORE SPACE */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gray-50 min-h-0">
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chat Input - COMPACT */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-xs"
                />
                <motion.button
                  onClick={handleSendMessage}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputMessage.trim()}
                >
                  <Send size={16} />
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
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Study Tools</h3>

            {/* Flashcards - COMPACT */}
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-3 bg-white hover:border-purple-400 transition-colors shadow-sm">
              <div className="flex items-start space-x-2">
                <div className="p-1.5 bg-purple-600 rounded-lg">
                  <CreditCard size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">Generate Flashcards</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Create Q&A flashcards from this section
                  </p>
                  <motion.button
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Generate Cards
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Summary - COMPACT */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 bg-white hover:border-blue-400 transition-colors shadow-sm">
              <div className="flex items-start space-x-2">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                  <FileText size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">Summarize Section</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Get an AI-generated summary
                  </p>
                  <motion.button
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Summary
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Key Terms - COMPACT */}
            <div className="border-2 border-dashed border-green-300 rounded-lg p-3 bg-white hover:border-green-400 transition-colors shadow-sm">
              <div className="flex items-start space-x-2">
                <div className="p-1.5 bg-green-600 rounded-lg">
                  <Key size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">Extract Key Terms</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Identify important vocabulary
                  </p>
                  <motion.button
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Extract Terms
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Info Box - COMPACT */}
            {/* <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
              <p className="text-xs text-gray-600">
                <strong>💡 Tip:</strong> Results appear in the chat!
              </p>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Tips - COMPACT */}
      {/* <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>💡 Tip:</strong> Use Notes (yellow button) to save thoughts!
        </p>
      </div> */}
    </div>
  )
}