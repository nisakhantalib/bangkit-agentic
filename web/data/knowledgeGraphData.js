// This module now supports multiple subjects (e.g., Sains & Matematik)


// Save custom node positions to localStorage (client-side only)
export const saveNodePositions = (positions) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('knowledgeGraphNodePositions', JSON.stringify(positions))
  }
}

// Load custom node positions from localStorage (client-side only)
export const loadNodePositions = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('knowledgeGraphNodePositions')
    return saved ? JSON.parse(saved) : {}
  }
  return {}
}

// Generate dynamic nodes based on expanded chapter
export const generateKnowledgeGraphNodes = (
  chaptersData,
  expandedChapterId = null,
  customPositions = {}
) => {
  const chapters = Array.isArray(chaptersData) ? chaptersData : []
  const nodes = []
  const edges = []

  
  // Chapter positions (horizontal layout)
  const chapterSpacing = 400
  const startX = 200
  const centerY = 350

  chapters.forEach((chapter, chapterIndex) => {

    const chapterX = startX + chapterIndex * chapterSpacing
    const chapterY = centerY
    const isExpanded = expandedChapterId === chapter.id
    const nodeId = `chapter-${chapter.id}`

    // Use custom position if available, otherwise use default
    const position = customPositions[nodeId] || { x: chapterX, y: chapterY }

    // Chapter node (always visible)
    nodes.push({
      id: nodeId,
      label: `Chapter ${chapter.id}`,
      secondaryLabel: chapter.title,
      icon: chapter.icon,
      type: 'chapter',
      chapterId: chapter.id,
      x: position.x,
      y: position.y,
      isExpanded: isExpanded
    })

    // Only show subchapters if this chapter is expanded
    if (isExpanded) {
      const subchapterRadius = 200
      const subchapters = Array.isArray(chapter.subchapters) ? chapter.subchapters : []
      const itemCount = subchapters.length

      subchapters.forEach((subchapter, subIndex) => {
        const angle = (2 * Math.PI * subIndex) / itemCount - Math.PI / 2
        const defaultSubX = position.x + subchapterRadius * Math.cos(angle)
        const defaultSubY = position.y + subchapterRadius * Math.sin(angle)

        const nodeId = `sub-${chapter.id}-${subchapter.id}`
        const subPosition = customPositions[nodeId] || { x: defaultSubX, y: defaultSubY }

        nodes.push({
          id: nodeId,
          label: subchapter.title,
          type: 'subchapter',
          chapterId: chapter.id,
          subchapterId: subchapter.id,
          x: subPosition.x,
          y: subPosition.y
        })

        // Connect to chapter
        edges.push({
          source: `chapter-${chapter.id}`,
          target: nodeId
        })
      })
    }
  })

  // Add inter-chapter connections
  for (let i = 0; i < chapters.length - 1; i++) {
    edges.push({
      source: `chapter-${chapters[i].id}`,
      target: `chapter-${chapters[i + 1].id}`,
      style: 'dashed',
      isChapterConnection: true
    })
  }

  return { nodes, edges }
}


// Progress levels
export const progressLevels = {
  completed: { percent: 100, color: '#10b981', label: '100% Completed' },
  tested: { percent: 66, color: '#fbbf24', label: '66% Tested' },
  started: { percent: 33, color: '#fb923c', label: '33% Started' },
  notStarted: { percent: 0, color: '#94a3b8', label: '0% Not Started' }
}
