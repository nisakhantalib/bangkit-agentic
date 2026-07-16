'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Keyboard,
  Loader2,
  PenLine,
} from 'lucide-react'

const getQuestionMarks = (question) => question?.marks || 1
const fixedMathButtons = [
  '=', '+', '-', '×',
  '÷', '/', '(', ')',
  '∝', '<', '>', '≠',
  '≤', '≥', '%', '°',
  '²', '³', '^', '√',
   'x²', 'x³', 'x⁻²', 'π'
]
const isSubjectiveQuestion = (question) => ['subjective', 'short-answer', 'structured-working'].includes(question?.type)
const createSubjectiveFromObjective = (question, index) => {
  const correctOption = Array.isArray(question.options) ? question.options[question.correctAnswer] : ''

  return {
    id: `${question.id || index + 1}-subjective`,
    type: 'structured-working',
    marks: 3,
    question: `${question.question}\n\nJawab dalam bentuk subjektif. Tulis jawapan anda dan terangkan sebab atau langkah kerja dengan jelas.`,
    acceptedFinalAnswers: correctOption ? [correctOption] : [],
    modelAnswer: correctOption
      ? `Jawapan: ${correctOption}\n\n${question.explanation || ''}`
      : question.explanation || '',
    rubric: [
      {
        marks: 1,
        criteria: 'Memberikan jawapan akhir yang betul.'
      },
      {
        marks: 1,
        criteria: 'Menunjukkan sebab, konsep, formula, atau langkah kerja yang berkaitan.'
      },
      {
        marks: 1,
        criteria: 'Penjelasan tersusun dan sepadan dengan kehendak soalan.'
      }
    ]
  }
}

export default function QuizComponent({ quiz, onClose, chapter, subchapter }) {
  const [activeMode, setActiveMode] = useState('objective')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [workingAnswer, setWorkingAnswer] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [markingResult, setMarkingResult] = useState(null)
  const [isMarking, setIsMarking] = useState(false)
  const [markingError, setMarkingError] = useState('')

  const allQuestions = useMemo(() => Array.isArray(quiz?.questions) ? quiz.questions : [], [quiz])
  const objectiveQuestions = useMemo(() => {
    if (Array.isArray(quiz?.objectiveQuestions)) return quiz.objectiveQuestions
    return allQuestions.filter((item) => !isSubjectiveQuestion(item))
  }, [allQuestions, quiz])
  const subjectiveQuestions = useMemo(() => {
    const explicitSubjectiveQuestions = Array.isArray(quiz?.subjectiveQuestions)
      ? quiz.subjectiveQuestions
      : allQuestions.filter((item) => isSubjectiveQuestion(item))

    return explicitSubjectiveQuestions.length
      ? explicitSubjectiveQuestions
      : objectiveQuestions.map(createSubjectiveFromObjective)
  }, [allQuestions, objectiveQuestions, quiz])
  const questions = activeMode === 'subjective' ? subjectiveQuestions : objectiveQuestions
  const totalQuestions = questions.length
  const totalMarks = questions.reduce((sum, item) => sum + getQuestionMarks(item), 0)
  const totalAvailableQuestions = objectiveQuestions.length + subjectiveQuestions.length
  const question = questions[currentQuestion]
  const questionMarks = getQuestionMarks(question)
  const isSubjective = isSubjectiveQuestion(question)
  const objectiveCount = objectiveQuestions.length
  const subjectiveCount = subjectiveQuestions.length

  useEffect(() => {
    setActiveMode(subjectiveQuestions.length && !objectiveQuestions.length ? 'subjective' : 'objective')
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setWorkingAnswer('')
    setShowExplanation(false)
    setScore(0)
    setIsCompleted(false)
    setMarkingResult(null)
    setMarkingError('')
  }, [objectiveQuestions.length, quiz, subjectiveQuestions.length])

  const handleModeChange = (mode) => {
    if (mode === activeMode) return
    setActiveMode(mode)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setWorkingAnswer('')
    setShowExplanation(false)
    setScore(0)
    setIsCompleted(false)
    setMarkingResult(null)
    setMarkingError('')
  }

  const handleAnswerSelect = (index) => {
    if (!showExplanation) {
      setSelectedAnswer(index)
    }
  }

  const handleInsertMath = (value) => {
    setWorkingAnswer((prev) => `${prev}${value}`)
  }

  const handleSubmit = async () => {
    if (isSubjective) {
      if (!workingAnswer.trim() || isMarking) return

      setIsMarking(true)
      setMarkingError('')

      try {
        const response = await fetch('/api/quiz/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            studentAnswer: workingAnswer,
            chapterTitle: chapter?.title,
            subchapterTitle: subchapter?.title,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to mark answer')
        }

        const awardedMarks = Math.max(0, Math.min(questionMarks, Number(data.marksAwarded) || 0))
        setMarkingResult({ ...data, marksAwarded: awardedMarks })
        setScore((prev) => prev + awardedMarks)
        setShowExplanation(true)
      } catch (error) {
        console.error('Error marking subjective answer:', error)
        setMarkingError('Could not mark this answer right now. Please try again.')
      } finally {
        setIsMarking(false)
      }
      return
    }

    if (selectedAnswer === null) return

    const isCorrect = selectedAnswer === question.correctAnswer
    if (isCorrect) {
      setScore((prev) => prev + questionMarks)
    }
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setWorkingAnswer('')
      setShowExplanation(false)
      setMarkingResult(null)
      setMarkingError('')
    } else {
      setIsCompleted(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setWorkingAnswer('')
    setShowExplanation(false)
    setScore(0)
    setIsCompleted(false)
    setMarkingResult(null)
    setMarkingError('')
  }

  useEffect(() => {
    if (isCompleted && chapter && subchapter) {
      const finalScore = totalMarks ? Math.round((score / totalMarks) * 100) : 0
      const quizPassed = finalScore >= 80
      const savedProgress = JSON.parse(localStorage.getItem('knowledgeGraphProgress') || '{}')
      const nodeId = `sub-${chapter.id}-${subchapter.id}`

      savedProgress[nodeId] = {
        ...savedProgress[nodeId],
        visited: true,
        quizAttempted: true,
        quizPassed: quizPassed,
        quizScore: finalScore,
        lastAttempt: new Date().toISOString()
      }

      localStorage.setItem('knowledgeGraphProgress', JSON.stringify(savedProgress))
      console.log(`Quiz completed for ${nodeId}: ${finalScore}% (${quizPassed ? 'PASSED' : 'NEEDS REVIEW'})`)
    } else if (isCompleted && (!chapter || !subchapter)) {
      console.warn('Quiz completed but chapter/subchapter props missing - progress not saved')
    }
  }, [isCompleted, score, totalMarks, chapter, subchapter])

  if (!totalAvailableQuestions) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Quiz unavailable</h3>
        <p className="text-sm text-gray-600 mb-4">
          This quiz does not have any valid questions yet.
        </p>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          Close Quiz
        </button>
      </div>
    )
  }

  if (isCompleted) {
    const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0
    const passed = percentage >= 80

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 text-center"
      >
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
          passed ? 'bg-green-100' : 'bg-orange-100'
        }`}>
          {passed ? (
            <CheckCircle2 size={48} className="text-green-600" />
          ) : (
            <XCircle size={48} className="text-orange-600" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {passed ? 'Quiz Completed!' : 'Quiz Completed'}
        </h3>

        <p className="text-4xl font-bold mb-2" style={{ color: passed ? '#10b981' : '#fb923c' }}>
          {percentage}%
        </p>

        <p className="text-gray-600 mb-6">
          You scored {score} out of {totalMarks} marks
        </p>

        {!passed && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-800">
              <strong>Tip:</strong> Review the content and try again to improve your score.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <RotateCcw size={18} />
            <span>Try Again</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Close Quiz
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => handleModeChange('objective')}
          disabled={!objectiveCount}
          className={`rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
            activeMode === 'objective'
              ? 'bg-white text-primary-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Objective ({objectiveCount})
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('subjective')}
          disabled={!subjectiveCount}
          className={`rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
            activeMode === 'subjective'
              ? 'bg-white text-primary-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Subjective ({subjectiveCount})
        </button>
      </div>

      {!question ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No {activeMode} questions yet
          </h3>
          <p className="text-sm text-gray-600">
            Add {activeMode === 'subjective' ? 'subjectiveQuestions' : 'objectiveQuestions'} to this preset quiz to show them here.
          </p>
        </div>
      ) : (
        <>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-gray-600">
            Score: {score}/{totalMarks} marks
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
          {objectiveCount > 0 && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              {objectiveCount} Objective
            </span>
          )}
          {subjectiveCount > 0 && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
              {subjectiveCount} Subjective
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {question.question}
          </h3>
          <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
            {isSubjective ? 'Subjective' : 'Objective'} · {questionMarks} mark{questionMarks > 1 ? 's' : ''}
          </span>
        </div>

        {isSubjective ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-blue-900">
                <PenLine size={16} />
                <span>Write your working steps</span>
              </div>
              <textarea
                value={workingAnswer}
                onChange={(event) => setWorkingAnswer(event.target.value)}
                disabled={showExplanation}
                rows={8}
                placeholder={`Example:\np ∝ 1/V\np = k/V\n380.5 = k/40\nk = 15220\np = 15220/80\np = 190.25 kPa`}
                className="w-full resize-y rounded-lg border border-blue-200 bg-white p-4 text-base leading-7 text-gray-900 shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50"
              />
            </div>

            {!showExplanation && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 lg:sticky lg:top-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
                  <Keyboard size={16} />
                  <span>Math pad</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {fixedMathButtons.map((button) => (
                    <button
                      key={button}
                      type="button"
                      onClick={() => handleInsertMath(button)}
                      className="min-h-10 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:border-primary-300 hover:bg-primary-50"
                    >
                      {button}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkingAnswer((prev) => prev.slice(0, -1))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:border-primary-300 hover:bg-primary-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkingAnswer('')}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(question.options) ? question.options : []).map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === question.correctAnswer
              const showCorrect = showExplanation && isCorrect
              const showWrong = showExplanation && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-50'
                      : showWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showCorrect && <CheckCircle2 size={20} className="text-green-600" />}
                    {showWrong && <XCircle size={20} className="text-red-600" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </motion.div>

      {markingError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-800">
          {markingError}
        </div>
      )}

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-4 ${
            isSubjective
              ? 'bg-blue-50 border border-blue-200'
              : selectedAnswer === question.correctAnswer
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {isSubjective ? (
            <div>
              <p className="font-bold text-blue-900 mb-2">
                Marks awarded: {markingResult?.marksAwarded ?? 0}/{questionMarks}
              </p>
              <p className="text-sm text-gray-800 mb-3">{markingResult?.feedback}</p>

              {markingResult?.rubricResults?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {markingResult.rubricResults.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-lg bg-white p-3 text-sm">
                      {item.awarded ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                      ) : (
                        <XCircle size={18} className="mt-0.5 shrink-0 text-orange-500" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{item.criteria}</p>
                        {item.comment && <p className="text-gray-600">{item.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {markingResult?.modelAnswer && (
                <div className="rounded-lg bg-white p-3 text-sm">
                  <p className="font-bold text-gray-900 mb-1">Model answer</p>
                  <pre className="whitespace-pre-wrap font-sans leading-6 text-gray-700">{markingResult.modelAnswer}</pre>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className={`font-medium mb-2 ${
                selectedAnswer === question.correctAnswer ? 'text-green-800' : 'text-red-800'
              }`}>
                {selectedAnswer === question.correctAnswer ? 'Correct!' : 'Incorrect'}
              </p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="flex justify-end">
        {!showExplanation ? (
          <button
            onClick={handleSubmit}
            disabled={isSubjective ? !workingAnswer.trim() || isMarking : selectedAnswer === null}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isMarking && <Loader2 size={18} className="animate-spin" />}
            <span>{isSubjective ? 'Submit Working' : 'Submit Answer'}</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>{currentQuestion < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
        </>
      )}
    </div>
  )
}
