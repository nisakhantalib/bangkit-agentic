'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Shuffle
} from 'lucide-react'

function ArtifactActions({ onOpenInTools, onRegenerate }) {
  if (!onOpenInTools && !onRegenerate) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
      {onOpenInTools && (
        <button
          type="button"
          onClick={onOpenInTools}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink size={11} />
          Open in Study Tools
        </button>
      )}
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={11} />
          Regenerate
        </button>
      )}
    </div>
  )
}

function SummaryCard({ artifact, onOpenInTools, onRegenerate }) {
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-left shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-blue-900">
        <BookOpen size={15} />
        <h3 className="text-xs font-bold">{artifact.title}</h3>
      </div>
      <ul className="space-y-2">
        {artifact.points.map((point, index) => (
          <li key={index} className="flex gap-2 text-xs leading-relaxed text-gray-800">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <ArtifactActions onOpenInTools={onOpenInTools} onRegenerate={onRegenerate} />
    </section>
  )
}

function KeyTermsCard({ artifact, onOpenInTools, onRegenerate }) {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left shadow-sm">
      <h3 className="mb-2 text-xs font-bold text-emerald-900">{artifact.title}</h3>
      <div className="space-y-2">
        {artifact.terms.map((item, index) => (
          <div key={`${item.term}-${index}`} className="rounded-lg border border-emerald-100 bg-white p-2.5">
            <p className="text-xs font-bold text-emerald-800">{item.term}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-700">{item.definition}</p>
          </div>
        ))}
      </div>
      <ArtifactActions onOpenInTools={onOpenInTools} onRegenerate={onRegenerate} />
    </section>
  )
}

function FlashcardDeck({ artifact, onOpenInTools, onRegenerate }) {
  const [cards, setCards] = useState(artifact.cards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setCards(artifact.cards)
    setCurrentIndex(0)
    setRevealed(false)
  }, [artifact])

  const currentCard = cards[currentIndex]

  const move = (direction) => {
    setCurrentIndex((index) => (index + direction + cards.length) % cards.length)
    setRevealed(false)
  }

  const shuffleCards = () => {
    setCards((current) => {
      const shuffled = [...current]

      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
      }

      return shuffled
    })
    setCurrentIndex(0)
    setRevealed(false)
  }

  return (
    <section className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-left shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-purple-950">{artifact.title}</h3>
        <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
          {currentIndex + 1}/{cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setRevealed((value) => !value)}
        className={`flex min-h-44 w-full flex-col items-center justify-center rounded-xl border-2 p-5 text-center shadow-sm transition-all ${
          revealed
            ? 'border-[#8E73B7] bg-gradient-to-br from-[#553c7b] to-[#654b84] text-white'
            : 'border-purple-200 bg-white text-gray-900 hover:border-purple-400'
        }`}
        aria-label={revealed ? 'Hide flashcard answer' : 'Reveal flashcard answer'}
      >
        <span className="mb-2 text-[10px] font-bold uppercase tracking-wide opacity-70">
          {revealed ? 'Answer' : 'Question'}
        </span>
        <span className="text-sm font-semibold leading-6">
          {revealed ? currentCard.answer : currentCard.question}
        </span>
        <span className="mt-3 text-[10px] opacity-70">Click card to {revealed ? 'show question' : 'reveal answer'}</span>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          className="rounded-lg border border-purple-200 bg-white p-2 text-purple-700 hover:bg-purple-50"
          aria-label="Previous flashcard"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          className="flex-1 rounded-lg bg-[#73579D] px-3 py-2 text-xs font-bold text-white hover:bg-[#624987]"
        >
          {revealed ? 'Show Question' : 'Reveal Answer'}
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          className="rounded-lg border border-purple-200 bg-white p-2 text-purple-700 hover:bg-purple-50"
          aria-label="Next flashcard"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={shuffleCards}
        className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-950"
      >
        <Shuffle size={11} />
        Shuffle deck
      </button>

      <ArtifactActions onOpenInTools={onOpenInTools} onRegenerate={onRegenerate} />
    </section>
  )
}

export default function StudyArtifactCard(props) {
  const { artifact } = props

  if (artifact.tool === 'summary') return <SummaryCard {...props} />
  if (artifact.tool === 'keyTerms') return <KeyTermsCard {...props} />
  if (artifact.tool === 'flashcards') return <FlashcardDeck {...props} />

  return null
}
