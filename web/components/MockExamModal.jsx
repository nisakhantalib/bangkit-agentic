'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Flag,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trophy,
  X
} from 'lucide-react'

const MOCK_EXAM_QUESTION_COUNT = 40
const MOCK_EXAM_DURATION_SECONDS = 75 * 60
const MOCK_EXAM_DURATION_LABEL = '1 hour 15 min'
const QUESTION_LIMIT = MOCK_EXAM_QUESTION_COUNT
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const cleanOptionLabel = (option = '') => String(option).replace(/^[A-F][.)]\s*/i, '').trim()

const getCorrectIndex = (question, options) => {
  if (Number.isInteger(question?.correctAnswer)) return question.correctAnswer

  if (typeof question?.correct === 'string') {
    const letterMatch = question.correct.trim().match(/^([A-F])(?:[.)]|\b)/i)
    if (letterMatch) return LETTERS.indexOf(letterMatch[1].toUpperCase())
  }

  if (typeof question?.answer === 'string') {
    const answerLetter = question.answer.trim().match(/^([A-F])(?:[.)]|\b)/i)
    if (answerLetter) return LETTERS.indexOf(answerLetter[1].toUpperCase())

    const normalizedAnswer = cleanOptionLabel(question.answer).toLowerCase()
    return options.findIndex((option) => cleanOptionLabel(option).toLowerCase() === normalizedAnswer)
  }

  return -1
}

const normalizeQuestion = ({
  rawQuestion,
  chapter,
  subchapter,
  section,
  source,
  sourceIndex,
  topic
}) => {
  const options = Array.isArray(rawQuestion?.options)
    ? rawQuestion.options.map((option) => String(option))
    : []
  const correctIndex = getCorrectIndex(rawQuestion, options)

  if (!rawQuestion?.question || options.length < 2 || correctIndex < 0 || correctIndex >= options.length) {
    return null
  }

  return {
    id: `${chapter.id}-${subchapter.id}-${source}-${sourceIndex}`,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    subchapterTitle: subchapter.title,
    topic: topic || section?.quizTitle || rawQuestion.topic || subchapter.title,
    source,
    year: rawQuestion.year,
    paper: rawQuestion.paper,
    questionNumber: rawQuestion.questionNumber,
    question: rawQuestion.question,
    options,
    correctIndex,
    explanation: rawQuestion.explanation || rawQuestion.answer || '',
    focus: Array.isArray(rawQuestion.focus) ? rawQuestion.focus : []
  }
}

export const getMockExamQuestions = (chapters = [], limit = QUESTION_LIMIT) => {
  const buckets = chapters.map((chapter) => {
    const chapterQuestions = []

    chapter.subchapters?.forEach((subchapter) => {
      const sections = Array.isArray(subchapter.sections) && subchapter.sections.length
        ? subchapter.sections
        : [subchapter]

      sections.forEach((section, sectionIndex) => {
        section.quiz?.questions?.forEach((question, questionIndex) => {
          const normalized = normalizeQuestion({
            rawQuestion: question,
            chapter,
            subchapter,
            section,
            source: `quiz-${sectionIndex}`,
            sourceIndex: question.id || questionIndex + 1
          })
          if (normalized) chapterQuestions.push(normalized)
        })

        const deck = section.pastExamQuestions || subchapter.pastExamQuestions
        deck?.questions?.forEach((question, questionIndex) => {
          const normalized = normalizeQuestion({
            rawQuestion: question,
            chapter,
            subchapter,
            section,
            source: `past-exam-${sectionIndex}`,
            sourceIndex: question.questionNumber || questionIndex + 1,
            topic: deck.topic
          })
          if (normalized) chapterQuestions.push(normalized)
        })

      })
    })

    return chapterQuestions
  }).filter(Boolean)

  const selected = []
  let cursor = 0

  while (selected.length < limit && buckets.some((bucket) => bucket.length > cursor)) {
    buckets.forEach((bucket) => {
      if (selected.length < limit && bucket[cursor]) selected.push(bucket[cursor])
    })
    cursor += 1
  }

  return selected
}

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function MockExamModal({
  isOpen,
  onClose,
  subjectTitle,
  questions = [],
  chapters = []
}) {
  const [mode, setMode] = useState('intro')
  const [selectedChapterIds, setSelectedChapterIds] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [reviewMarks, setReviewMarks] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(MOCK_EXAM_DURATION_SECONDS)
  const [examEndsAt, setExamEndsAt] = useState(null)
  const [isMaximized, setIsMaximized] = useState(false)

  const chapterIds = useMemo(() => chapters.map((chapter) => chapter.id), [chapters])
  const activeChapterIds = selectedChapterIds.length ? selectedChapterIds : chapterIds
  const selectedQuestionPool = questions.filter((question) => activeChapterIds.includes(question.chapterId))
  const activeQuestions = selectedQuestionPool.slice(0, QUESTION_LIMIT)
  const hasEnoughQuestions = selectedQuestionPool.length >= MOCK_EXAM_QUESTION_COUNT

  const answeredCount = Object.keys(answers).length
  const reviewCount = Object.values(reviewMarks).filter(Boolean).length
  const unansweredCount = activeQuestions.length - answeredCount
  const canSubmit = unansweredCount === 0
  const currentQuestion = activeQuestions[activeIndex]
  const score = activeQuestions.reduce((total, question, index) => (
    answers[index] === question.correctIndex ? total + 1 : total
  ), 0)
  const percentage = activeQuestions.length ? Math.round((score / activeQuestions.length) * 100) : 0
  const timeUsed = Math.max(0, MOCK_EXAM_DURATION_SECONDS - timeRemaining)

  useEffect(() => {
    if (!isOpen) return
    setMode('intro')
    setSelectedChapterIds(chapterIds)
    setActiveIndex(0)
    setAnswers({})
    setReviewMarks({})
    setExamEndsAt(null)
    setTimeRemaining(MOCK_EXAM_DURATION_SECONDS)
    setIsMaximized(false)
  }, [chapterIds, isOpen, questions])

  useEffect(() => {
    if (!isOpen || mode !== 'exam' || !examEndsAt) return undefined

    const tick = () => {
      const nextTimeRemaining = Math.max(0, Math.ceil((examEndsAt - Date.now()) / 1000))
      setTimeRemaining(nextTimeRemaining)

      if (nextTimeRemaining <= 0) {
        setExamEndsAt(null)
        setMode('review')
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)

    return () => window.clearInterval(timer)
  }, [examEndsAt, isOpen, mode])

  const startExam = () => {
    if (!hasEnoughQuestions) return
    setMode('exam')
    setActiveIndex(0)
    setAnswers({})
    setReviewMarks({})
    setTimeRemaining(MOCK_EXAM_DURATION_SECONDS)
    setExamEndsAt(Date.now() + MOCK_EXAM_DURATION_SECONDS * 1000)
  }

  const selectAnswer = (optionIndex) => {
    setAnswers((current) => ({ ...current, [activeIndex]: optionIndex }))
  }

  const toggleReviewMark = () => {
    setReviewMarks((current) => ({ ...current, [activeIndex]: !current[activeIndex] }))
  }

  const submitExam = () => {
    if (!canSubmit) return
    setExamEndsAt(null)
    setMode('review')
  }

  const resetAttempt = (nextChapterIds) => {
    setSelectedChapterIds(nextChapterIds)
    setActiveIndex(0)
    setAnswers({})
    setReviewMarks({})
    setExamEndsAt(null)
    setTimeRemaining(MOCK_EXAM_DURATION_SECONDS)
  }

  const toggleChapter = (chapterId) => {
    const nextIds = selectedChapterIds.includes(chapterId)
      ? selectedChapterIds.filter((id) => id !== chapterId)
      : [...selectedChapterIds, chapterId]

    resetAttempt(nextIds.length ? nextIds : [chapterId])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[70] flex bg-slate-950/60 ${
          isMaximized
            ? 'items-stretch justify-center p-0'
            : 'items-center justify-center p-3 md:p-6'
        }`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18 }}
            className={`flex w-full flex-col overflow-hidden bg-white shadow-2xl ${
              isMaximized
                ? 'h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0'
                : 'h-[92vh] max-w-6xl rounded-lg border-4 border-slate-950'
            }`}
          >
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50 px-4 py-3 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{subjectTitle} Tingkatan 5</p>
                <h2 className="text-lg font-bold text-slate-950 md:text-2xl">Mock Exam</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMaximized((current) => !current)}
                  className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                  title={isMaximized ? 'Restore size' : 'Maximize'}
                  aria-label={isMaximized ? 'Restore mock exam size' : 'Maximize mock exam'}
                >
                  {isMaximized ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                  title="Close"
                  aria-label="Close mock exam"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {mode === 'intro' && (
              <div className="grid flex-1 place-items-center overflow-y-auto p-6">
                <div className="w-full max-w-3xl">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-primary-950 bg-primary-600 text-white shadow-lg">
                    <Trophy size={28} />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-950 md:text-3xl">AI Mock Exam Practice</h3>
                  <p className="mb-6 max-w-2xl text-slate-600">
                    Tick the chapters to include. The mock exam is fixed at 40 objective questions and 1 hour 15 minutes.
                  </p>

                  <div className="mb-5 rounded-lg border-2 border-slate-300 bg-slate-50 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="self-center text-sm font-semibold text-slate-500">
                        {activeChapterIds.length} / {chapterIds.length} chapters selected
                      </span>
                      <span className="self-center text-sm font-semibold text-slate-500">
                        {Math.min(selectedQuestionPool.length, MOCK_EXAM_QUESTION_COUNT)} / {MOCK_EXAM_QUESTION_COUNT} questions ready
                      </span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {chapters.map((chapter) => {
                        const selected = activeChapterIds.includes(chapter.id)
                        const count = questions.filter((question) => question.chapterId === chapter.id).length
                        return (
                          <button
                            key={chapter.id}
                            onClick={() => toggleChapter(chapter.id)}
                            className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                              selected
                                ? 'border-primary-700 bg-white text-primary-900 shadow-sm'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-400'
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span>
                                <span className="block text-sm font-bold">{chapter.title}</span>
                                <span className="text-xs">{count} available objective questions</span>
                              </span>
                              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 ${
                                selected ? 'border-primary-700 bg-primary-700 text-white' : 'border-slate-300 bg-white text-transparent'
                              }`}>
                                {selected && <CheckCircle2 size={13} strokeWidth={3} />}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border-2 border-slate-300 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-500">Questions</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">{MOCK_EXAM_QUESTION_COUNT}</p>
                    </div>
                    <div className="rounded-lg border-2 border-slate-300 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-500">Time Limit</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">{MOCK_EXAM_DURATION_LABEL}</p>
                    </div>
                    <div className="rounded-lg border-2 border-slate-300 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-500">Mode</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">Objective</p>
                    </div>
                  </div>

                  {!activeQuestions.length && (
                    <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                      <p className="text-sm">No objective questions are available yet for this subject.</p>
                    </div>
                  )}

                  {activeQuestions.length > 0 && !hasEnoughQuestions && (
                    <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                      <p className="text-sm">Select more chapters to prepare all {MOCK_EXAM_QUESTION_COUNT} questions.</p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={startExam}
                      disabled={!hasEnoughQuestions}
                      className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Start Mock Exam
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Back to Lesson
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'exam' && currentQuestion && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="grid gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-[1fr_auto] md:px-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-950">{answeredCount} / {activeQuestions.length} answered</span>
                    <span>{reviewCount} marked for review</span>
                    <span>{currentQuestion.chapterTitle}</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                    timeRemaining <= 60 ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'
                  }`}>
                    <Clock3 size={18} />
                    {formatTime(timeRemaining)}
                  </div>
                </div>

                <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]">
                  <aside className="order-2 min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50 p-4 md:order-1 md:border-r md:border-t-0">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Question Check</p>
                    <div className="grid grid-cols-10 gap-2 md:grid-cols-5">
                      {activeQuestions.map((question, index) => {
                        const answered = answers[index] !== undefined
                        const marked = reviewMarks[index]
                        const active = index === activeIndex
                        return (
                          <button
                            key={question.id}
                            onClick={() => setActiveIndex(index)}
                            className={`relative grid h-9 place-items-center rounded-lg border text-xs font-bold transition-colors ${
                              active
                                ? 'border-primary-600 bg-primary-600 text-white'
                                : answered
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300'
                            }`}
                            title={`Question ${index + 1}`}
                          >
                            {index + 1}
                            {marked && <Flag size={10} className="absolute -right-1 -top-1 fill-amber-400 text-amber-500" />}
                          </button>
                        )
                      })}
                    </div>
                  </aside>

                  <section className="order-1 min-h-0 overflow-y-auto p-4 md:order-2 md:p-6">
                    <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{currentQuestion.subchapterTitle}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{currentQuestion.topic}</span>
                      {currentQuestion.year && <span className="rounded-full bg-slate-100 px-3 py-1">{currentQuestion.year}</span>}
                      {currentQuestion.questionNumber && <span className="rounded-full bg-slate-100 px-3 py-1">{currentQuestion.questionNumber}</span>}
                    </div>

                    <p className="mb-6 text-base font-semibold leading-relaxed text-slate-950 md:text-lg">
                      {activeIndex + 1}. {currentQuestion.question}
                    </p>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, optionIndex) => {
                        const selected = answers[activeIndex] === optionIndex
                        return (
                          <button
                            key={`${currentQuestion.id}-${optionIndex}`}
                            onClick={() => selectAnswer(optionIndex)}
                            className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                              selected
                                ? 'border-primary-600 bg-primary-50 text-primary-950'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50/50'
                            }`}
                          >
                            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-bold ${
                              selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 text-slate-500'
                            }`}>
                              {LETTERS[optionIndex]}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{cleanOptionLabel(option)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                      disabled={activeIndex === 0}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                      Previous
                    </button>
                    <button
                      onClick={() => setActiveIndex((index) => Math.min(activeQuestions.length - 1, index + 1))}
                      disabled={activeIndex === activeQuestions.length - 1}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={toggleReviewMark}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        reviewMarks[activeIndex]
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Flag size={17} />
                      Review
                    </button>
                    <button
                      onClick={submitExam}
                      disabled={!canSubmit}
                      title={canSubmit ? 'Submit exam' : `Answer ${unansweredCount} more question${unansweredCount === 1 ? '' : 's'} before submitting`}
                      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {canSubmit ? 'Submit Exam' : `${unansweredCount} unanswered`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'review' && (
              <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Exam Review</p>
                    <h3 className="text-2xl font-bold text-slate-950">Score: {score} / {activeQuestions.length}</h3>
                    <p className="mt-1 text-slate-600">Time used: {formatTime(timeUsed)}. Review your answers below.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                    <p className="text-4xl font-black text-slate-950">{percentage}%</p>
                    <p className="text-sm font-semibold text-slate-500">{percentage >= 70 ? 'Strong pass' : 'Needs review'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeQuestions.map((question, index) => {
                    const selectedIndex = answers[index]
                    const correct = selectedIndex === question.correctIndex
                    return (
                      <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">Q{index + 1}</span>
                            <span>{question.chapterTitle}</span>
                            <span>{question.subchapterTitle}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                            correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {correct ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            {correct ? 'Correct' : 'Review'}
                          </span>
                        </div>

                        <p className="mb-3 font-semibold leading-relaxed text-slate-950">{question.question}</p>
                        <div className="grid gap-2">
                          {question.options.map((option, optionIndex) => {
                            const isCorrectOption = optionIndex === question.correctIndex
                            const isSelectedOption = optionIndex === selectedIndex
                            return (
                              <div
                                key={`${question.id}-review-${optionIndex}`}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  isCorrectOption
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                    : isSelectedOption
                                      ? 'border-red-300 bg-red-50 text-red-900'
                                      : 'border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className="font-bold">{LETTERS[optionIndex]}.</span> {cleanOptionLabel(option)}
                                {isSelectedOption && <span className="ml-2 text-xs font-bold">(Your answer)</span>}
                                {isCorrectOption && <span className="ml-2 text-xs font-bold">(Correct)</span>}
                              </div>
                            )
                          })}
                        </div>

                        {question.explanation && (
                          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="sticky bottom-0 mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white py-4">
                  <button
                    onClick={startExam}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <RotateCcw size={17} />
                    Retake
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                  >
                    Back to Lesson
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
