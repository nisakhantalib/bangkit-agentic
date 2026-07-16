'use client'

import { Handle, Position } from 'reactflow'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SubchapterNode({ data }) {
  const { label, score, status, color, isCurrent, needsFocus, onClick } = data

  return (
    <div
      onClick={onClick}
      className="relative cursor-text group"
    >
      {/* Warning Badge */}
      {needsFocus && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>
      )}

      {/* Current Location Pulse */}
      {isCurrent && (
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-75" />
      )}

      {/* Main Circle */}
      <div
        className={`w-20 h-20 rounded-full border-3 shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          isCurrent ? 'border-blue-500 border-4' : 'border-white'
        }`}
        style={{ backgroundColor: color }}
      >
        {/* Score or Status Icon */}
        {score ? (
          <div className={`font-bold text-sm ${
            status === 'completed' || status === 'tested' ? 'text-white' : 'text-gray-800'
          }`}>
            {score}%
          </div>
        ) : status === 'completed' ? (
          <CheckCircle2 size={24} className="text-white" />
        ) : null}
      </div>

      {/* Label */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 text-center">
        <p className="text-xs font-semibold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm line-clamp-2">
          {label}
        </p>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-xs">
          <div className="font-bold mb-1">
            {status === 'completed' ? '✅ Mastered' :
             status === 'tested' ? (needsFocus ? '⚠️ Needs Focus' : '📝 Attempted') :
             status === 'started' ? '👀 Viewed' :
             '🆕 Not Started'}
          </div>
          {score && <div className="text-gray-300">Score: {score}%</div>}
          <div className="text-gray-400 mt-1">Click to {status === 'notStarted' ? 'start' : 'continue'}</div>
        </div>
      </div>

      {/* Connection Points */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}