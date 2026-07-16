'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

import { progressLevels } from '@/data/knowledgeGraphData'

// Chapter Node Component (inline)
function ChapterNode({ data }) {
  const { label, icon, progress, color, onClick } = data

  return (
    <div onClick={onClick} className="relative cursor-pointer group">
      <div
        className="w-32 h-32 rounded-full border-4 border-white shadow-xl flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl"
        style={{ backgroundColor: color }}
      >
        <div className="text-4xl mb-1">{icon}</div>
        <div className="text-white font-bold text-lg">{progress}%</div>
      </div>

      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-40 text-center">
        <p className="text-sm font-bold text-gray-800 bg-white/90 px-2 py-1 rounded shadow-sm">
          {label}
        </p>
      </div>

      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-primary-600 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-xs font-medium">
          Chapter Overview
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}

// Subchapter Node Component (inline)
function SubchapterNode({ data }) {
  const { label, score, status, color, isCurrent, needsFocus, onClick } = data

  return (
    <div onClick={onClick} className="relative cursor-pointer group">
      {needsFocus && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>
      )}

      {isCurrent && (
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-75" />
      )}

      <div
        className={`w-20 h-20 rounded-full shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          isCurrent ? 'border-blue-500 border-4' : 'border-white border-3'
        }`}
        style={{ backgroundColor: color }}
      >
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

      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 text-center">
        <p className="text-xs font-semibold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm line-clamp-2">
          {label}
        </p>
      </div>

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

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}

// Node types
const nodeTypes = {
  chapter: ChapterNode,
  subchapter: SubchapterNode,
}

export default function KnowledgeGraphReactFlow({
  isOpen,
  onClose,
  onNavigate,
  currentChapter,
  currentSubchapter,
  chaptersData,
  subjectTitle = 'Sains',
}) {

  const [progress, setProgress] = useState({})

  useEffect(() => {
    if (isOpen) {
      const savedProgress = localStorage.getItem('knowledgeGraphProgress')
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress))
      }
    }
  }, [isOpen])

  const getNodeStatus = (nodeId) => {
    const prog = progress[nodeId]
    if (!prog) return 'notStarted'
    if (prog.quizPassed) return 'completed'
    if (prog.quizAttempted) return 'tested'
    if (prog.visited) return 'started'
    return 'notStarted'
  }

  const getNodeColor = (status) => {
    return progressLevels[status]?.color || progressLevels.notStarted.color
  }


  const getChapterProgress = (chapterId) => {
    const chapter = chaptersData?.find(c => c.id === chapterId)


    if (!chapter) return 0

    const subchapterNodes = chapter.subchapters.map(sub => `sub-${chapterId}-${sub.id}`)
    const completedCount = subchapterNodes.filter(id => progress[id]?.quizPassed).length
    const testedCount = subchapterNodes.filter(id => progress[id]?.quizAttempted && !progress[id]?.quizPassed).length
    const visitedCount = subchapterNodes.filter(id => progress[id]?.visited && !progress[id]?.quizAttempted).length

    return Math.round(
      (completedCount * 100 + testedCount * 66 + visitedCount * 33) / subchapterNodes.length
    )
  }


  const getChapterColor = (chapterId) => {
    const chapter = chaptersData?.find(c => c.id === chapterId)

    if (!chapter) return progressLevels.notStarted.color

    const subchapterNodes = chapter.subchapters.map(sub => `sub-${chapterId}-${sub.id}`)
    const completedCount = subchapterNodes.filter(id => progress[id]?.quizPassed).length
    const testedCount = subchapterNodes.filter(id => progress[id]?.quizAttempted && !progress[id]?.quizPassed).length
    const visitedCount = subchapterNodes.filter(id => progress[id]?.visited && !progress[id]?.quizAttempted).length

    if (completedCount === subchapterNodes.length) return progressLevels.completed.color
    if (completedCount + testedCount >= subchapterNodes.length / 2) return progressLevels.tested.color
    if (visitedCount > 0) return progressLevels.started.color
    return progressLevels.notStarted.color
  }

  const initialNodes = useMemo(() => {
    const nodes = []

    const chapterSpacing = 450
    const subchapterRadius = 200

    chaptersData?.forEach((chapter, chapterIndex) => {
      const chapterX = chapterIndex * chapterSpacing + 250
      const chapterY = 350

      nodes.push({
        id: `chapter-${chapter.id}`,
        type: 'chapter',
        position: { x: chapterX - 64, y: chapterY - 64 },
        data: {
          label: chapter.title,
          icon: chapter.icon,
          progress: getChapterProgress(chapter.id),
          color: getChapterColor(chapter.id),
          onClick: () => handleNodeClick(`chapter-${chapter.id}`, chapter.id, null),
        },
      })

      const subCount = chapter.subchapters.length
      chapter.subchapters.forEach((sub, subIndex) => {
        const angle = (2 * Math.PI * subIndex) / subCount - Math.PI / 2
        const subX = chapterX + subchapterRadius * Math.cos(angle)
        const subY = chapterY + subchapterRadius * Math.sin(angle)

        const nodeId = `sub-${chapter.id}-${sub.id}`
        const status = getNodeStatus(nodeId)
        const prog = progress[nodeId]

        nodes.push({
          id: nodeId,
          type: 'subchapter',
          position: { x: subX - 40, y: subY - 40 },
          data: {
            label: sub.title,
            status: status,
            score: prog?.quizScore,
            color: getNodeColor(status),
            isCurrent: currentChapter?.id === chapter.id && currentSubchapter?.id === sub.id,
            needsFocus: prog?.quizAttempted && !prog?.quizPassed && prog?.quizScore < 60,
            onClick: () => handleNodeClick(nodeId, chapter.id, sub.id),
          },
        })
      })
    })

    return nodes
  }, [progress, currentChapter, currentSubchapter])

  const initialEdges = useMemo(() => {
    const edges = []

    chaptersData?.forEach((chapter) => {


      chapter.subchapters.forEach((sub) => {
        const nodeId = `sub-${chapter.id}-${sub.id}`
        const status = getNodeStatus(nodeId)

        edges.push({
          id: `e-${chapter.id}-${sub.id}`,
          source: `chapter-${chapter.id}`,
          target: nodeId,
          animated: status === 'started' || status === 'tested',
          style: {
            stroke: status === 'completed' ? progressLevels.completed.color :
                    status === 'tested' ? progressLevels.tested.color :
                    status === 'started' ? progressLevels.started.color :
                    '#cbd5e1',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: status === 'completed' ? progressLevels.completed.color :
                   status === 'tested' ? progressLevels.tested.color :
                   status === 'started' ? progressLevels.started.color :
                   '#cbd5e1',
          },
        })
      })
    })

    return edges
  }, [progress])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick = useCallback((nodeId, chapterId, subchapterId) => {
    if (subchapterId) {
      const newProgress = {
        ...progress,
        [nodeId]: {
          ...progress[nodeId],
          visited: true,
          visitedAt: new Date().toISOString()
        }
      }
      setProgress(newProgress)
      localStorage.setItem('knowledgeGraphProgress', JSON.stringify(newProgress))
    }

    onNavigate?.(chapterId, subchapterId)
    onClose()
  }, [progress, onNavigate, onClose])

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  const stats = useMemo(() => {
    const allSubchapters = chaptersData.flatMap(c => 
      c.subchapters.map(s => `sub-${c.id}-${s.id}`)
    )
    const completed = allSubchapters.filter(id => progress[id]?.quizPassed).length
    const needsReview = allSubchapters.filter(id => {
      const p = progress[id]
      return p?.quizAttempted && !p?.quizPassed && p?.quizScore < 60
    }).length
    
    return {
      total: allSubchapters.length,
      completed,
      needsReview,
      percentage: Math.round((completed / allSubchapters.length) * 100),
    }
  }, [progress])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      >
        <div className="w-full h-full p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🗺️</div>
                  <div>
                    <h2 className="text-xl font-bold">Knowledge Graph - {subjectTitle} Tingkatan 5</h2>
                    <p className="text-sm text-blue-100">Interactive Learning Progress Tracker</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
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

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* React Flow Graph */}
            <div className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              >
                <Background color="#e5e7eb" gap={16} size={1} />
                <Controls className="bg-white shadow-lg rounded-lg" />
                {/* <MiniMap
                  className="bg-white shadow-lg rounded-lg"
                  nodeColor={(node) => node.data.color || '#94a3b8'}
                  maskColor="rgba(0,0,0,0.1)"
                /> */}
              </ReactFlow>

              {/* Focus Alert */}
              {stats.needsReview > 0 && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 left-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-xl max-w-xs z-10"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-500 rounded-full p-2 flex-shrink-0">
                      <AlertCircle className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 mb-1">Focus Areas Detected!</h3>
                      <p className="text-sm text-red-800">
                        {stats.needsReview} subchapter{stats.needsReview > 1 ? 's' : ''} need review
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

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
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
