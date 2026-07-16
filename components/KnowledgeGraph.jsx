'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Home, TrendingUp, AlertCircle, Info, Search, RotateCcw, Download, Grid3x3, Circle } from 'lucide-react'
import { generateKnowledgeGraphNodes, progressLevels, saveNodePositions, loadNodePositions } from '@/data/knowledgeGraphData'


export default function KnowledgeGraph({
  isOpen,
  onClose,
  onNavigate,
  currentChapter,
  currentSubchapter,
  chaptersData,
  subjectTitle = 'Sains',
}) {

  const [progress, setProgress] = useState({})
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedPath, setHighlightedPath] = useState([])
  const [draggedNode, setDraggedNode] = useState(null)
  const [nodePositions, setNodePositions] = useState({})
  const svgRef = useRef(null)

  // Load progress
  useEffect(() => {
    if (isOpen) {
      const savedProgress = localStorage.getItem('knowledgeGraphProgress')
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress))
      }
      // Load custom node positions
      setNodePositions(loadNodePositions())
      // Expand current chapter by default
      if (currentChapter) {
        setExpandedChapter(currentChapter.id)
      }
    }
  }, [isOpen, currentChapter])

  // Get node status
  const getNodeStatus = (nodeId) => {
    const prog = progress[nodeId]
    if (!prog) return 'notStarted'
    if (prog.quizPassed) return 'completed'
    if (prog.quizAttempted) return 'tested'
    if (prog.visited) return 'started'
    return 'notStarted'
  }

  // Get node color
  const getNodeColor = (status) => {
    return progressLevels[status]?.color || progressLevels.notStarted.color
  }

  // Calculate chapter progress
  const getChapterProgress = (chapterId) => {
    const chapter = chaptersData?.find(c => c.id === chapterId)

    if (!chapter) return 0

    const subchapters = Array.isArray(chapter.subchapters) ? chapter.subchapters : []
    if (!subchapters.length) return 0

    const subchapterNodes = subchapters.map(sub => `sub-${chapterId}-${sub.id}`)
    const completedCount = subchapterNodes.filter(id => progress[id]?.quizPassed).length
    const testedCount = subchapterNodes.filter(id => progress[id]?.quizAttempted && !progress[id]?.quizPassed).length
    const visitedCount = subchapterNodes.filter(id => progress[id]?.visited && !progress[id]?.quizAttempted).length

    return Math.round((completedCount * 100 + testedCount * 66 + visitedCount * 33) / subchapterNodes.length)
  }

  // Get chapter color
  const getChapterColor = (chapterId) => {
    const chapter = chaptersData?.find(c => c.id === chapterId)

    if (!chapter) return progressLevels.notStarted.color

    const subchapters = Array.isArray(chapter.subchapters) ? chapter.subchapters : []
    if (!subchapters.length) return progressLevels.notStarted.color

    const subchapterNodes = subchapters.map(sub => `sub-${chapterId}-${sub.id}`)
    const completedCount = subchapterNodes.filter(id => progress[id]?.quizPassed).length
    const testedCount = subchapterNodes.filter(id => progress[id]?.quizAttempted && !progress[id]?.quizPassed).length
    const visitedCount = subchapterNodes.filter(id => progress[id]?.visited && !progress[id]?.quizAttempted).length

    if (completedCount === subchapterNodes.length) return progressLevels.completed.color
    if (completedCount + testedCount >= subchapterNodes.length / 2) return progressLevels.tested.color
    if (visitedCount > 0) return progressLevels.started.color
    return progressLevels.notStarted.color
  }

  // Generate nodes based on expanded chapter
  const { nodes: rawNodes, edges } = useMemo(() => 
generateKnowledgeGraphNodes(chaptersData, expandedChapter, nodePositions),
  [chaptersData, expandedChapter, nodePositions]
)


  // Filter nodes based on search
  const nodes = useMemo(() => {
    if (!searchQuery) return rawNodes
    
    const query = searchQuery.toLowerCase()
    return rawNodes.filter(node => 
      node.label.toLowerCase().includes(query) ||
      node.secondaryLabel?.toLowerCase().includes(query) ||
      node.id.toLowerCase().includes(query)
    )
  }, [rawNodes, searchQuery])

  // Get connected nodes for path highlighting
  const getConnectedNodes = useCallback((nodeId) => {
    const connected = new Set([nodeId])
    edges.forEach(edge => {
      if (edge.source === nodeId) connected.add(edge.target)
      if (edge.target === nodeId) connected.add(edge.source)
    })
    return Array.from(connected)
  }, [edges])

  // Handle node hover for path highlighting
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node?.id || null)
    if (node) {
      setHighlightedPath(getConnectedNodes(node.id))
    } else {
      setHighlightedPath([])
    }
  }, [getConnectedNodes])

  // Handle node drag
  const handleNodeDragStart = (e, node) => {
    e.stopPropagation()
    setDraggedNode(node.id)
  }

  const handleNodeDrag = (e) => {
    if (!draggedNode) return

    const svg = svgRef.current
    const point = svg.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse())
    
    // Account for zoom and pan
    const nodeX = (svgPoint.x - pan.x) / zoom
    const nodeY = (svgPoint.y - pan.y) / zoom

    // Update node position
    setNodePositions(prev => ({
      ...prev,
      [draggedNode]: { x: nodeX, y: nodeY }
    }))
  }

  const handleNodeDragEnd = () => {
    if (draggedNode) {
      // Save positions to localStorage
      saveNodePositions(nodePositions)
      setDraggedNode(null)
    }
  }

  useEffect(() => {
    if (draggedNode) {
      document.addEventListener('mousemove', handleNodeDrag)
      document.addEventListener('mouseup', handleNodeDragEnd)
    }
    return () => {
      document.removeEventListener('mousemove', handleNodeDrag)
      document.removeEventListener('mouseup', handleNodeDragEnd)
    }
  }, [draggedNode, nodePositions, pan, zoom])

  // Handle node click
  const handleNodeClick = useCallback((node) => {
    if (draggedNode) return // Don't navigate if we were dragging

    if (node.type === 'chapter') {
      setExpandedChapter(prev => prev === node.chapterId ? null : node.chapterId)
    } else if (node.type === 'quiz') {
      onNavigate?.(node.chapterId, null)
      onClose()
    } else {
      const newProgress = {
        ...progress,
        [node.id]: {
          ...progress[node.id],
          visited: true,
          visitedAt: new Date().toISOString()
        }
      }
      setProgress(newProgress)
      localStorage.setItem('knowledgeGraphProgress', JSON.stringify(newProgress))

      onNavigate?.(node.chapterId, node.subchapterId)
      onClose()
    }
  }, [progress, expandedChapter, onNavigate, onClose, draggedNode])

  // Reset layout
  const handleResetLayout = () => {
    setNodePositions({})
    localStorage.removeItem('knowledgeGraphNodePositions')
    setExpandedChapter(null)
  }

  // Export as image
  const handleExport = () => {
    const svg = svgRef.current
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'knowledge-graph.svg'
    link.click()
    URL.revokeObjectURL(url)
  }

  // Reset view
  const resetView = () => {
    setZoom(1)
    setPan({ x: 50, y: 50 })
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))

  // Pan with mouse drag
  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  // Calculate stats
  const stats = useMemo(() => {
    const allSubchapters = chaptersData?.flatMap(c => 
      (Array.isArray(c.subchapters) ? c.subchapters : []).map(s => `sub-${c.id}-${s.id}`)
    ) || []

    const completed = allSubchapters.filter(id => progress[id]?.quizPassed).length
    const needsReview = allSubchapters.filter(id => {
      const p = progress[id]
      return p?.quizAttempted && !p?.quizPassed && p?.quizScore < 60
    }).length
    
    return {
      total: allSubchapters.length,
      completed,
      needsReview,
      percentage: allSubchapters.length ? Math.round((completed / allSubchapters.length) * 100) : 0,
    }
  }, [chaptersData, progress])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <div className="w-full h-full p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🗺️</div>
                  <div>
                    <h2 className="text-xl font-bold">Knowledge Graph - {subjectTitle} Tingkatan 5</h2>
                    <p className="text-sm text-blue-100">Drag nodes to reposition • Click to expand • Search topics</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={16} />
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 w-48"
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-center">
                      <div className="flex items-center space-x-1">
                        <TrendingUp size={16} />
                        <span className="text-xl font-bold">{stats.percentage}%</span>
                      </div>
                      <p className="text-xs text-blue-100">Complete</p>
                    </div>
                    {stats.needsReview > 0 && (
                      <div className="bg-red-500/90 backdrop-blur px-4 py-2 rounded-lg text-center animate-pulse">
                        <div className="flex items-center space-x-1">
                          <AlertCircle size={16} />
                          <span className="text-xl font-bold">{stats.needsReview}</span>
                        </div>
                        <p className="text-xs">Need Focus</p>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-2 border-l border-white/20 pl-4">
                    <button 
                      onClick={handleResetLayout} 
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Reset Layout"
                    >
                      <RotateCcw size={20} />
                    </button>
                    <button 
                      onClick={handleExport} 
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Export as SVG"
                    >
                      <Download size={20} />
                    </button>
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <ZoomOut size={20} />
                    </button>
                    <span className="text-sm px-3 py-1 bg-white/20 rounded-lg">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <ZoomIn size={20} />
                    </button>
                    <button onClick={resetView} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <Home size={20} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-2">
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Graph Area */}
            <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
              <svg
                ref={svgRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : draggedNode ? 'grabbing' : 'grab' }}
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {edges.map((edge, index) => {
                    const sourceNode = nodes.find(n => n.id === edge.source)
                    const targetNode = nodes.find(n => n.id === edge.target)
                    
                    if (!sourceNode || !targetNode) return null

                    const isChapterConnection = edge.isChapterConnection
                    const status = edge.isChapterConnection ? null : getNodeStatus(edge.target)
                    const isHighlighted = highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target)

                    return (
                      <line
                        key={index}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isChapterConnection ? '#cbd5e1' : 
                                status === 'completed' ? progressLevels.completed.color :
                                status === 'tested' ? progressLevels.tested.color :
                                status === 'started' ? progressLevels.started.color :
                                '#cbd5e1'}
                        strokeWidth={isHighlighted ? "4" : "2"}
                        strokeDasharray={isChapterConnection ? '8,4' : '0'}
                        opacity={isHighlighted ? "1" : "0.6"}
                        className="transition-all"
                      />
                    )
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const isHovered = hoveredNode === node.id
                    const isCurrent = currentChapter?.id === node.chapterId && 
                                     (node.type === 'chapter' || currentSubchapter?.id === node.subchapterId)
                    const isHighlighted = highlightedPath.includes(node.id)
                    
                    let radius, color, displayText
                    const nodeProgress = progress[node.id] || {}

                    if (node.type === 'chapter') {
                      radius = 70
                      color = getChapterColor(node.chapterId)
                      displayText = `${getChapterProgress(node.chapterId)}%`
                    } else if (node.type === 'quiz') {
                      radius = 45
                      const quizNodeId = `quiz-${node.chapterId}`
                      const status = getNodeStatus(quizNodeId)
                      color = getNodeColor(status)
                      displayText = nodeProgress.quizScore !== undefined ? `${nodeProgress.quizScore}%` : null
                    } else {
                      radius = 45
                      const status = getNodeStatus(node.id)
                      color = getNodeColor(status)
                      displayText = nodeProgress.quizScore !== undefined ? `${nodeProgress.quizScore}%` : null
                    }

                    const needsFocus = nodeProgress.quizAttempted && !nodeProgress.quizPassed && nodeProgress.quizScore < 60

                    return (
                      <motion.g
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="cursor-move"
                        onMouseEnter={() => handleNodeHover(node)}
                        onMouseLeave={() => handleNodeHover(null)}
                        onMouseDown={(e) => handleNodeDragStart(e, node)}
                        onClick={() => handleNodeClick(node)}
                        style={{ opacity: searchQuery && !nodes.find(n => n.id === node.id) ? 0.3 : 1 }}
                      >
                        {/* Highlight ring */}
                        {isHighlighted && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={radius + 10}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            opacity="0.5"
                          />
                        )}

                        {/* Warning badge */}
                        {needsFocus && (
                          <>
                            <circle
                              cx={node.x + radius - 12}
                              cy={node.y - radius + 12}
                              r="12"
                              fill="#ef4444"
                              stroke="#fff"
                              strokeWidth="2"
                            >
                              <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                            <text
                              x={node.x + radius - 12}
                              y={node.y - radius + 16}
                              fill="white"
                              fontSize="14"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="pointer-events-none"
                            >
                              !
                            </text>
                          </>
                        )}

                        {/* Current location pulse */}
                        {isCurrent && node.type !== 'chapter' && (
                          <circle cx={node.x} cy={node.y} r={radius + 8} fill="none" stroke="#3b82f6" strokeWidth="3">
                            <animate attributeName="r" values={`${radius + 5};${radius + 15};${radius + 5}`} dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}

                        {/* Node circle */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius}
                          fill={color}
                          stroke={isHovered ? '#1e40af' : '#fff'}
                          strokeWidth={isHovered ? 4 : 3}
                          className="transition-all"
                        />

                        {/* Chapter icon */}
                        {node.type === 'chapter' && (
                          <text x={node.x} y={node.y - 15} fontSize="32" textAnchor="middle" className="pointer-events-none">
                            {node.icon}
                          </text>
                        )}

                        {/* Display text */}
                        {displayText && (
                          <text
                            x={node.x}
                            y={node.y + (node.type === 'chapter' ? 20 : 6)}
                            fill={color === progressLevels.notStarted.color || color === progressLevels.started.color ? '#1f2937' : '#fff'}
                            fontSize={node.type === 'chapter' ? '18' : '15'}
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {displayText}
                          </text>
                        )}

                        {/* Label */}
                        <text
                          x={node.x}
                          y={node.y + radius + 20}
                          fill="#1f2937"
                          fontSize={node.type === 'chapter' ? '14' : '11'}
                          fontWeight={node.type === 'chapter' ? 'bold' : '600'}
                          textAnchor="middle"
                          className="pointer-events-none"
                          style={{ textShadow: '0 0 4px white, 0 0 4px white' }}
                        >
                          {node.label && node.label.length > 30 ? node.label.substring(0, 27) + '...' : node.label}
                        </text>
                        {node.secondaryLabel && (
                          <text
                            x={node.x}
                            y={node.y + radius + 35}
                            fill="#6b7280"
                            fontSize="10"
                            textAnchor="middle"
                            className="pointer-events-none"
                            style={{ textShadow: '0 0 4px white' }}
                          >
                            {node.secondaryLabel.substring(0, 20)}...
                          </text>
                        )}

                        {/* Hover tooltip */}
                        {isHovered && (
                          <g>
                            <rect
                              x={node.x - 85}
                              y={node.y - radius - 60}
                              width="170"
                              height={nodeProgress.quizScore !== undefined ? '55' : '42'}
                              fill="#1e40af"
                              rx="6"
                              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                            />
                            <text x={node.x} y={node.y - radius - 42} fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">
                              {node.type === 'chapter' ? `Click: ${node.isExpanded ? 'collapse' : 'expand'} • Drag: move` :
                               node.type === 'quiz' ? '📝 Take Quiz • Drag to move' :
                               'Click: study • Drag: move'}
                            </text>
                            {nodeProgress.quizScore !== undefined && node.type !== 'chapter' && (
                              <text x={node.x} y={node.y - radius - 28} fill="white" fontSize="10" textAnchor="middle">
                                Score: {nodeProgress.quizScore}%
                              </text>
                            )}
                            <text x={node.x} y={node.y - radius - (nodeProgress.quizScore ? 14 : 24)} fill="white" fontSize="10" textAnchor="middle">
                              {needsFocus ? '⚠️ Needs review' : ''}
                            </text>
                          </g>
                        )}
                      </motion.g>
                    )
                  })}
                </g>
              </svg>

              {/* Instructions */}
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl p-3 shadow-xl max-w-xs z-10"
              >
                <h3 className="font-bold text-gray-800 mb-2 text-sm">💡 How to Use</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>Drag nodes</strong> to reposition</li>
                  <li>• <strong>Click chapter</strong> to expand/collapse</li>
                  <li>• <strong>Click subchapter</strong> to study</li>
                  <li>• <strong>Hover node</strong> to see connections</li>
                  <li>• <strong>Search</strong> to filter topics</li>
                  <li>• <strong>Reset layout</strong> to restore defaults</li>
                </ul>
              </motion.div>

              {/* Legend */}
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-xl z-10"
              >
                <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <Info size={16} />
                  <span>Legend</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: progressLevels.completed.color }} />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: progressLevels.tested.color }} />
                    <span>Attempted</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: progressLevels.started.color }} />
                    <span>Viewed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: progressLevels.notStarted.color }} />
                    <span>Not Started</span>
                  </div>
                </div>
              </motion.div>

              {/* Focus Alert */}
              {/* {stats.needsReview > 0 && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-20 left-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-xl max-w-xs z-10"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-500 rounded-full p-2 flex-shrink-0">
                      <AlertCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 mb-1">Focus Areas!</h3>
                      <p className="text-sm text-red-800">
                        {stats.needsReview} topic{stats.needsReview > 1 ? 's' : ''} need{stats.needsReview === 1 ? 's' : ''} review
                      </p>
                    </div>
                  </div>
                </motion.div>
              )} */}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
