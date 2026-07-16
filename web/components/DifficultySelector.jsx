'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Target, TrendingUp, Award } from 'lucide-react'

const difficulties = [
  { id: 'beginner', label: 'Beginner', icon: GraduationCap },
  { id: 'intermediate', label: 'Intermediate', icon: Target },
  { id: 'advanced', label: 'Advanced', icon: TrendingUp },
  { id: 'expert', label: 'Expert', icon: Award }
]

export default function DifficultySelector({ selectedDifficulty, onDifficultyChange }) {
  const currentIndex = difficulties.findIndex(d => d.id === selectedDifficulty)
  
  return (
    <div>
      {/* Slider Track - COMPACT */}
      <div className="relative mb-4 pt-4">
        {/* Background Track */}
        <div className="absolute top-4 left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
        
        {/* Progress Track */}
        <motion.div 
          className="absolute top-4 left-0 h-1.5 bg-primary-600 rounded-full"
          initial={false}
          animate={{ width: `${((currentIndex + 1) / difficulties.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Difficulty Points - SMALLER */}
        <div className="relative flex justify-between">
          {difficulties.map((diff, index) => {
            const Icon = diff.icon
            const isActive = selectedDifficulty === diff.id
            const isPassed = index <= currentIndex
            
            return (
              <motion.button
                key={diff.id}
                onClick={() => onDifficultyChange(diff.id)}
                className="flex flex-col items-center focus:outline-none group relative z-10"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                  isActive 
                    ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-200' 
                    : isPassed
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon size={14} />
                </div>
                <span className={`text-[10px] font-medium ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {diff.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Current Level Description - COMPACT */}
      <div className="p-2 bg-blue-50 rounded-lg text-[10px] text-blue-800">
        <strong>Current:</strong> {difficulties[currentIndex].label}
      </div>
    </div>
  )
}