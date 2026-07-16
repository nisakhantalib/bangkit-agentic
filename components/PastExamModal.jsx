'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Filter,
  Search,
  SlidersHorizontal,
  X,
  XCircle
} from 'lucide-react'

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

export const getPastExamQuestions = (chapters = []) => {
  const questions = []

  chapters.forEach((chapter) => {
    chapter.subchapters?.forEach((subchapter) => {
      const sections = Array.isArray(subchapter.sections) && subchapter.sections.length
        ? subchapter.sections
        : [subchapter]

      sections.forEach((section, sectionIndex) => {
        const deck = section.pastExamQuestions || subchapter.pastExamQuestions
        deck?.questions?.forEach((rawQuestion, questionIndex) => {
          const options = Array.isArray(rawQuestion.options)
            ? rawQuestion.options.map((option) => String(option))
            : []
          const correctIndex = getCorrectIndex(rawQuestion, options)

          if (!rawQuestion.question || options.length < 2 || correctIndex < 0) return

          questions.push({
            id: `${chapter.id}-${subchapter.id}-${sectionIndex}-${questionIndex}`,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            subchapterTitle: subchapter.title,
            topic: deck.topic || section.quizTitle || subchapter.title,
            year: rawQuestion.year || 'Unknown Year',
            paper: rawQuestion.paper || 'Paper',
            questionNumber: rawQuestion.questionNumber || `Q${questionIndex + 1}`,
            type: rawQuestion.type || 'Objective',
            question: rawQuestion.question,
            options,
            correctIndex,
            answer: rawQuestion.answer || `${LETTERS[correctIndex]}. ${cleanOptionLabel(options[correctIndex])}`,
            explanation: rawQuestion.explanation || 'The correct answer follows directly from the topic concept.',
            wrongExplanations: rawQuestion.wrongExplanations || rawQuestion.optionExplanations || null,
            focus: Array.isArray(rawQuestion.focus) ? rawQuestion.focus : []
          })
        })
      })
    })
  })

  return questions
}

const getUniqueOptions = (questions, key) => (
  Array.from(new Set(questions.map((question) => question[key]).filter(Boolean))).sort()
)

const getWrongExplanation = (question, optionIndex) => {
  if (optionIndex === question.correctIndex) return question.explanation
  const optionLetter = LETTERS[optionIndex]
  const keyedExplanation = question.wrongExplanations?.[optionLetter]
    || question.wrongExplanations?.[optionIndex]

  if (keyedExplanation) return keyedExplanation

  const correctLetter = LETTERS[question.correctIndex]
  const correctOption = cleanOptionLabel(question.options[question.correctIndex])
  const optionText = cleanOptionLabel(question.options[optionIndex])
  const topicText = `${question.topic} ${question.question}`.toLowerCase()
  const explanation = question.explanation.charAt(0).toLowerCase() + question.explanation.slice(1)

  if (topicText.includes('peringkat') || topicText.includes('baris') || topicText.includes('lajur')) {
    return `"${optionText}" uses the wrong row-column reading. For matrix order, count rows first and columns second; the correct order is ${correctOption}.`
  }

  if (topicText.includes('pendaraban matriks') || topicText.includes('hasil darab') || topicText.includes('ab berperingkat')) {
    return `"${optionText}" uses the wrong outside dimensions. In matrix multiplication, AB has the number of rows from A and the number of columns from B, so the answer is ${correctLetter}.`
  }

  if (topicText.includes('songsang') || topicText.includes('penentu') || topicText.includes('inverse')) {
    return `"${optionText}" misses the determinant condition. A 2 x 2 matrix has an inverse only when ad - bc is not 0; here the working leads to ${correctOption}.`
  }

  if (topicText.includes('premium') || topicText.includes('nilai muka') || topicText.includes('ncd')) {
    return `"${optionText}" comes from applying the rate or discount incorrectly. Premium questions must use the stated rate per RM value, and NCD must be subtracted from the basic premium.`
  }

  if (topicText.includes('insurans hayat')) {
    return `"${optionText}" is not the life-insurance risk being tested. Life insurance focuses on financial protection for death, critical illness or permanent disability, so ${correctLetter} fits the policy concept.`
  }

  if (topicText.includes('insurans am') || topicText.includes('kebakaran') || topicText.includes('motor')) {
    return `"${optionText}" is not a general-insurance example. General insurance protects property or non-life losses such as motor, fire, medical, accident or travel cover.`
  }

  if (topicText.includes('flora normal')) {
    return `"${optionText}" is not a role of normal flora. Normal flora mainly compete with pathogens, support digestion and may produce useful vitamins.`
  }

  if (topicText.includes('fungi') || topicText.includes('kulat')) {
    return `"${optionText}" confuses fungi with another microorganism group. Fungi do not photosynthesise; they absorb nutrients as saprophytes or parasites.`
  }

  if (topicText.includes('alga')) {
    return `"${optionText}" does not fit algae. Algae contain chlorophyll and can photosynthesise, which is why ${correctLetter} is the better answer.`
  }

  if (topicText.includes('protozoa')) {
    return `"${optionText}" describes a different microorganism feature. Protozoa are animal-like microorganisms and are usually discussed through movement, feeding and disease examples.`
  }

  return `"${optionText}" points to a different idea from the one tested in this question. The answer is ${correctLetter}, "${correctOption}", because ${explanation}`
}

export default function PastExamModal({
  isOpen,
  onClose,
  subjectTitle,
  questions = []
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [chapterFilter, setChapterFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeQuestionId, setActiveQuestionId] = useState(null)

  const chapters = useMemo(() => getUniqueOptions(questions, 'chapterTitle'), [questions])
  const topics = useMemo(() => getUniqueOptions(questions, 'topic'), [questions])
  const years = useMemo(() => getUniqueOptions(questions, 'year'), [questions])
  const types = useMemo(() => getUniqueOptions(questions, 'type'), [questions])

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return questions.filter((question) => {
      const matchesSearch = !normalizedSearch || [
        question.question,
        question.topic,
        question.chapterTitle,
        question.subchapterTitle,
        question.year,
        question.paper,
        question.questionNumber,
        question.explanation,
        ...question.options
      ].join(' ').toLowerCase().includes(normalizedSearch)

      return matchesSearch
        && (chapterFilter === 'all' || question.chapterTitle === chapterFilter)
        && (topicFilter === 'all' || question.topic === topicFilter)
        && (yearFilter === 'all' || question.year === yearFilter)
        && (typeFilter === 'all' || question.type === typeFilter)
    })
  }, [chapterFilter, questions, searchTerm, topicFilter, typeFilter, yearFilter])

  const activeQuestion = filteredQuestions.find((question) => question.id === activeQuestionId) || filteredQuestions[0]

  useEffect(() => {
    if (!isOpen) return
    setActiveQuestionId(filteredQuestions[0]?.id || null)
  }, [filteredQuestions, isOpen])

  const resetFilters = () => {
    setSearchTerm('')
    setChapterFilter('all')
    setTopicFilter('all')
    setYearFilter('all')
    setTypeFilter('all')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18 }}
            className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border-4 border-slate-950 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50 px-4 py-3 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{subjectTitle} Tingkatan 5</p>
                <h2 className="text-lg font-bold text-slate-950 md:text-2xl">Past Exam Question Bank</h2>
              </div>
              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_1fr]">
              <aside className="min-h-0 border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-3 py-2">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search keyword, topic, year..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="all">All chapters</option>
                    {chapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}
                  </select>
                  <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="all">All years</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="all">All topics</option>
                    {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                  </select>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm">
                    <option value="all">All types</option>
                    {types.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Filter size={16} />
                    {filteredQuestions.length} / {questions.length}
                  </div>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-white"
                  >
                    <SlidersHorizontal size={14} />
                    Reset
                  </button>
                </div>

                <div className="max-h-[34vh] space-y-2 overflow-y-auto pr-1 custom-scrollbar lg:max-h-[calc(92vh-255px)]">
                  {filteredQuestions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setActiveQuestionId(question.id)}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                        activeQuestion?.id === question.id
                          ? 'border-primary-700 bg-primary-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-primary-400'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary-700">Q{index + 1}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {question.year}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{question.question}</p>
                      <p className="mt-2 text-xs text-slate-500">{question.topic}</p>
                    </button>
                  ))}

                  {!filteredQuestions.length && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      No questions match these filters.
                    </div>
                  )}
                </div>
              </aside>

              <section className="min-h-0 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                {activeQuestion ? (
                  <div className="mx-auto max-w-4xl">
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">{activeQuestion.year}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{activeQuestion.paper}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{activeQuestion.questionNumber}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{activeQuestion.type}</span>
                    </div>

                    <div className="mb-5 rounded-lg border-2 border-slate-300 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-primary-950 bg-primary-600 text-white">
                          <FileQuestion size={20} />
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-semibold text-slate-500">{activeQuestion.chapterTitle} / {activeQuestion.subchapterTitle}</p>
                          <h3 className="text-lg font-bold leading-relaxed text-slate-950">{activeQuestion.question}</h3>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {activeQuestion.options.map((option, optionIndex) => {
                          const isCorrect = optionIndex === activeQuestion.correctIndex
                          return (
                            <div
                              key={`${activeQuestion.id}-${optionIndex}`}
                              className={`rounded-lg border-2 p-4 ${
                                isCorrect
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-red-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-300'
                                }`}>
                                  {LETTERS[optionIndex]}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-slate-950">{cleanOptionLabel(option)}</p>
                                    {isCorrect ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                        <CheckCircle2 size={13} />
                                        Correct
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                        <XCircle size={13} />
                                        Why wrong
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                    {getWrongExplanation(activeQuestion, optionIndex)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                      <div className="rounded-lg border-2 border-primary-300 bg-primary-50 p-4">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-900">
                          <BookOpen size={17} />
                          Answer Explanation
                        </h4>
                        <p className="text-sm leading-relaxed text-primary-950">{activeQuestion.explanation}</p>
                      </div>

                      <div className="rounded-lg border-2 border-slate-300 bg-white p-4">
                        <h4 className="mb-2 text-sm font-bold text-slate-950">Focus Area</h4>
                        <div className="flex flex-wrap gap-2">
                          {(activeQuestion.focus.length ? activeQuestion.focus : [activeQuestion.topic]).map((focus) => (
                            <span key={focus} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {focus}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid h-full place-items-center text-center text-slate-500">
                    <div>
                      <FileQuestion size={42} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold">No hardcoded past exam questions yet.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
