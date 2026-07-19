'use client'

/**
 * Renders a schema-validated "visual" payload from the presenter agent.
 * Three kinds: diagram (Mermaid), table, slides. Every kind fails safe —
 * a render error hides the block rather than breaking the chat.
 */

import { useEffect, useRef, useState } from 'react'

let mermaidPromise = null
function loadMermaid() {
  // Lazy-load Mermaid only when a diagram actually needs rendering.
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      const mermaid = m.default
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
      return mermaid
    })
  }
  return mermaidPromise
}

function MermaidDiagram({ code }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadMermaid()
      .then((mermaid) => mermaid.render(`dg-${Math.random().toString(36).slice(2)}`, code))
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [code])

  if (failed) return null
  return <div ref={ref} className="my-2 overflow-x-auto rounded-md bg-gray-50 p-2" />
}

function VisualTable({ table }) {
  return (
    <div className="my-2 overflow-x-auto">
      {table.caption ? <p className="mb-1 text-xs font-medium text-gray-600">{table.caption}</p> : null}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-gray-200 px-2 py-1 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VisualSlides({ slides }) {
  const [i, setI] = useState(0)
  const deck = slides.slides
  const cur = deck[i]
  return (
    <div className="my-2 rounded-md border border-gray-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-purple-700">{slides.title}</p>
      <div className="min-h-[80px]">
        <p className="text-sm font-medium text-gray-800">{cur.title}</p>
        <ul className="mt-1 list-disc pl-4 text-xs text-gray-700">
          {cur.bullets.map((b, k) => <li key={k}>{b}</li>)}
        </ul>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}
          className="rounded px-2 py-0.5 text-purple-700 disabled:opacity-40">‹ Prev</button>
        <span className="text-gray-500">{i + 1} / {deck.length}</span>
        <button onClick={() => setI((x) => Math.min(deck.length - 1, x + 1))} disabled={i === deck.length - 1}
          className="rounded px-2 py-0.5 text-purple-700 disabled:opacity-40">Next ›</button>
      </div>
    </div>
  )
}

export default function VisualBlock({ visual }) {
  if (!visual || !visual.kind || visual.kind === 'none') return null
  try {
    if (visual.kind === 'diagram' && visual.mermaid) return <MermaidDiagram code={visual.mermaid} />
    if (visual.kind === 'table' && visual.table) return <VisualTable table={visual.table} />
    if (visual.kind === 'slides' && visual.slides) return <VisualSlides slides={visual.slides} />
  } catch {
    return null
  }
  return null
}
