'use client'

import { Handle, Position } from 'reactflow'
import { TrendingUp } from 'lucide-react'

export default function ChapterNode({ data }) {
  const { label, icon, progress, color, onClick } = data

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {/* Main Circle */}
      <div
        className="w-32 h-32 rounded-full border-4 border-white shadow-xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl"
        style={{ backgroundColor: color }}
      >
        {/* Icon */}
        <div className="text-4xl mb-1">{icon}</div>
        
        {/* Progress */}
        <div className="text-white font-bold text-lg">
          {progress}%
        </div>
      </div>

      {/* Label */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-40 text-center">
        <p className="text-sm font-bold text-gray-800 bg-white/90 px-2 py-1 rounded shadow-sm">
          {label}
        </p>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-xs font-medium">
          <div className="flex items-center space-x-1">
            <TrendingUp size={14} />
            <span>Chapter Overview</span>
          </div>
        </div>
      </div>

      {/* Connection Point */}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}