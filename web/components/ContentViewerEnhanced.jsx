'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen,
  Play,
  Brain,
  FileQuestion,
  StickyNote,
  MessageCircle,
  GraduationCap,
  X,
  CheckCircle2,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
import VideoPlayer from './VideoPlayer'
import QuizComponent from './QuizComponent'

export default function ContentViewerEnhanced({
  chapter,
  subchapter,
  subjectKey = 'science',
  onTextSelect,
  onExplainClick,
  onNotesClick,
  difficulty,
  rightPanelWidth = 284
}) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [activePastYearSection, setActivePastYearSection] = useState(null)
  const [activePracticeIndex, setActivePracticeIndex] = useState(0)
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false)
  // Per-section AI quiz state: { [sectionIdx]: { quiz, isGenerating } }
  const [sectionAIQuizzes, setSectionAIQuizzes] = useState({})
  const contentRef = useRef(null)

  // Reset quiz when subchapter changes
  useEffect(() => {
    setShowQuiz(false)
    setActivePastYearSection(null)
    setActivePracticeIndex(0)
    setShowPracticeAnswer(false)
  }, [subchapter?.id])

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true)

    try {
      const content = subchapter?.content || chapter?.content || ''
      
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          chapterTitle: chapter?.title,
          subchapterTitle: subchapter?.title,
          difficulty: difficulty,
          fallbackQuiz: subchapter?.quiz || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      setQuiz(data.quiz)
      setShowQuiz(true)

    } catch (error) {
      console.error('Error generating quiz:', error)
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleGenerateSectionQuiz = async (sectionIdx, section) => {
    setSectionAIQuizzes(prev => ({
      ...prev,
      [sectionIdx]: { ...prev[sectionIdx], isGenerating: true }
    }))

    try {
      const content = section.content || ''
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          chapterTitle: chapter?.title,
          subchapterTitle: section.quizTitle || subchapter?.title,
          difficulty: difficulty,
          fallbackQuiz: section.quiz || null
        })
      })

      if (!response.ok) throw new Error('Failed to generate quiz')

      const data = await response.json()
      setSectionAIQuizzes(prev => ({
        ...prev,
        [sectionIdx]: { quiz: data.quiz, isGenerating: false }
      }))
    } catch (error) {
      console.error('Error generating section quiz:', error)
      alert('Failed to generate quiz. Please try again.')
      setSectionAIQuizzes(prev => ({
        ...prev,
        [sectionIdx]: { ...prev[sectionIdx], isGenerating: false }
      }))
    }
  }

  const stripMarkdown = (text = '') => (
    text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#*_`>|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )

  const getSectionTitle = (section, fallbackIndex) => {
    const heading = section?.content?.match(/^#{1,3}\s+(.+)$/m)?.[1]
    return heading || section?.quizTitle || section?.videoTitle || `Section ${fallbackIndex + 1}`
  }

  const getSpm2024PracticeDeck = () => null

  const getPastYearPractice = (section, index) => {
    const rawContent = `${section?.content || ''} ${section?.quizTitle || ''}`.toLowerCase()
    const title = getSectionTitle(section, index)

    if (rawContent.includes('ubahan langsung') || rawContent.includes('direct variation')) {
      return {
        label: 'SPM-style structured question',
        year: 'Generated Practice',
        marks: 4,
        question: 'Diberi y berubah secara langsung dengan x. Jika y = 18 apabila x = 6, cari nilai y apabila x = 11.',
        answer: 'y = kx. Gantikan 18 = 6k, maka k = 3. Jadi y = 3x. Apabila x = 11, y = 33.',
        focus: ['Tulis hubungan ubahan', 'Cari pemalar k', 'Guna persamaan lengkap']
      }
    }

    if (rawContent.includes('x²') || rawContent.includes('xâ²') || rawContent.includes('xÂ²') || rawContent.includes('kuasa')) {
      return {
        label: 'SPM-style graph question',
        year: 'Generated Practice',
        marks: 4,
        question: 'y berubah secara langsung dengan x^2. Diberi y = 45 apabila x = 3. Hitung nilai y apabila x = 5.',
        answer: 'y = kx^2. Gantikan 45 = k(3^2), maka k = 5. Jadi y = 5x^2. Apabila x = 5, y = 125.',
        focus: ['Kenal pasti kuasa pemboleh ubah', 'Substitusi nilai diberi', 'Jawapan akhir dengan langkah']
      }
    }

    if (rawContent.includes('songsang') || rawContent.includes('inverse')) {
      return {
        label: 'SPM-style application question',
        year: 'Generated Practice',
        marks: 4,
        question: 'Tekanan p berubah secara songsang dengan isi padu V. Jika p = 240 kPa apabila V = 50 cm3, cari p apabila V = 80 cm3.',
        answer: 'p = k/V. Gantikan 240 = k/50, maka k = 12000. Jadi p = 12000/80 = 150 kPa.',
        focus: ['Bezakan songsang dan langsung', 'Kekalkan unit', 'Semak nilai akhir munasabah']
      }
    }

    if (rawContent.includes('bergabung') || rawContent.includes('tercantum') || rawContent.includes('combined')) {
      return {
        label: 'SPM-style combined variation',
        year: 'Generated Practice',
        marks: 5,
        question: 'P berubah secara langsung dengan Q^2 dan secara songsang dengan R. Jika P = 12 apabila Q = 3 dan R = 6, cari P apabila Q = 5 dan R = 10.',
        answer: 'P = kQ^2/R. Gantikan 12 = k(3^2)/6, maka k = 8. Jadi P = 8(5^2)/10 = 20.',
        focus: ['Gabungkan dua hubungan', 'Cari k dahulu', 'Tulis persamaan akhir']
      }
    }

    if (rawContent.includes('fungi') || rawContent.includes('kulat') || rawContent.includes('alga')) {
      return {
        label: 'SPM-style comparison question',
        year: 'Generated Practice',
        marks: 4,
        question: 'Bandingkan fungi dan alga dari aspek nutrisi dan struktur sel yang membantu alga menghasilkan makanan sendiri.',
        answer: 'Fungi ialah saprofit atau parasit dan tidak menghasilkan makanan sendiri. Alga mempunyai kloroplas berklorofil, maka alga dapat menjalankan fotosintesis.',
        focus: ['Bandingkan dua kumpulan', 'Sebut kloroplas', 'Hubungkan struktur dengan fungsi']
      }
    }

    if (rawContent.includes('mikroorganisma') || rawContent.includes('flora normal')) {
      return {
        label: 'SPM-style concept question',
        year: 'Generated Practice',
        marks: 3,
        question: 'Terangkan dua kepentingan flora normal kepada manusia.',
        answer: 'Flora normal menghalang pertumbuhan patogen pada badan dan membantu proses pencernaan. Sesetengah flora normal juga menghasilkan vitamin tertentu.',
        focus: ['Nyatakan fungsi', 'Gunakan istilah patogen', 'Jawab dalam ayat lengkap']
      }
    }

    return {
      label: 'SPM-style review question',
      year: 'Generated Practice',
      marks: 3,
      question: `Berdasarkan ${title}, terangkan idea utama bahagian ini dan berikan satu contoh aplikasi dalam situasi harian.`,
      answer: `Idea utama ${title} perlu dihuraikan menggunakan konsep utama dalam nota. Contoh yang sesuai hendaklah menunjukkan bagaimana konsep itu berlaku dalam situasi sebenar.`,
      focus: ['Kenal pasti konsep utama', 'Berikan contoh relevan', 'Jawab dengan istilah topik']
    }
  }

  const getStructuredPracticeDeck = (section, index) => {
    const rawContent = `${section?.content || ''} ${section?.quizTitle || ''}`.toLowerCase()
    const title = getSectionTitle(section, index)
    const officialDeck = getSpm2024PracticeDeck({
      chapterId: chapter?.id,
      subchapterId: subchapter?.id,
      content: `${chapter?.title || ''} ${subchapter?.title || ''} ${rawContent}`
    })

    if (officialDeck) {
      return officialDeck
    }

    if (rawContent.includes('ubahan langsung') || rawContent.includes('direct variation')) {
      return {
        topic: 'Ubahan Langsung',
        questions: [
          {
            year: 'Generated Practice',
            type: 'Structured',
            marks: 4,
            time: '5 min',
            question: 'Diberi y berubah secara langsung dengan x. Jika y = 18 apabila x = 6, cari nilai y apabila x = 11.',
            answer: 'y = kx. Gantikan 18 = 6k, maka k = 3. Jadi y = 3x. Apabila x = 11, y = 33.',
            focus: ['Tulis hubungan ubahan', 'Cari pemalar k', 'Guna persamaan lengkap']
          },
          {
            year: 'Generated Practice',
            type: 'Application',
            marks: 3,
            time: '4 min',
            question: 'Tambang kereta sewa berubah secara langsung dengan jarak perjalanan. Tambang bagi 12 km ialah RM18. Cari tambang bagi 25 km.',
            answer: 'T = kd. 18 = 12k, maka k = 1.5. Jadi T = 1.5(25) = RM37.50.',
            focus: ['Bina model daripada situasi', 'Nyatakan unit RM', 'Jawapan akhir tepat']
          },
          {
            year: 'Generated Practice',
            type: 'Graph',
            marks: 4,
            time: '5 min',
            question: 'Graf y melawan x ialah garis lurus melalui asalan. Jika titik (4, 28) terletak pada graf, cari persamaan graf itu.',
            answer: 'Garis lurus melalui asalan menunjukkan y = kx. Gantikan 28 = 4k, maka k = 7. Persamaan graf ialah y = 7x.',
            focus: ['Tafsir graf melalui asalan', 'Cari k daripada titik', 'Tulis persamaan lengkap']
          }
        ]
      }
    }

    if (rawContent.includes('kuasa') || rawContent.includes('x^2') || rawContent.includes('xÂ²') || rawContent.includes('xÃ')) {
      return {
        topic: 'Ubahan Kuasa',
        questions: [
          {
            year: 'Generated Practice',
            type: 'Graph',
            marks: 4,
            time: '5 min',
            question: 'y berubah secara langsung dengan x^2. Diberi y = 45 apabila x = 3. Hitung nilai y apabila x = 5.',
            answer: 'y = kx^2. Gantikan 45 = k(3^2), maka k = 5. Jadi y = 5x^2. Apabila x = 5, y = 125.',
            focus: ['Kenal pasti kuasa pemboleh ubah', 'Substitusi nilai diberi', 'Jawapan akhir dengan langkah']
          },
          {
            year: 'Generated Practice',
            type: 'Structured',
            marks: 4,
            time: '5 min',
            question: 'Diberi m berubah secara langsung dengan p^3. Jika m = 16 apabila p = 2, cari m apabila p = 4.',
            answer: 'm = kp^3. 16 = k(2^3), maka k = 2. Apabila p = 4, m = 2(4^3) = 128.',
            focus: ['Gunakan kuasa tiga', 'Elak menggandakan secara linear', 'Tunjuk penggantian nilai']
          },
          {
            year: 'Generated Practice',
            type: 'Reasoning',
            marks: 3,
            time: '4 min',
            question: 'Jika y berubah secara langsung dengan sqrt(x), apakah berlaku kepada y apabila x menjadi 4 kali ganda?',
            answer: 'y berkadar dengan sqrt(x). Jika x menjadi 4x, sqrt(4x) = 2sqrt(x), maka y menjadi 2 kali ganda.',
            focus: ['Fahami punca kuasa dua', 'Bandingkan faktor perubahan', 'Nyatakan kesimpulan']
          }
        ]
      }
    }

    if (rawContent.includes('songsang') || rawContent.includes('inverse')) {
      return {
        topic: 'Ubahan Songsang',
        questions: [
          {
            year: 'Generated Practice',
            type: 'Application',
            marks: 4,
            time: '5 min',
            question: 'Tekanan p berubah secara songsang dengan isi padu V. Jika p = 240 kPa apabila V = 50 cm3, cari p apabila V = 80 cm3.',
            answer: 'p = k/V. Gantikan 240 = k/50, maka k = 12000. Jadi p = 12000/80 = 150 kPa.',
            focus: ['Bezakan songsang dan langsung', 'Kekalkan unit', 'Semak nilai akhir munasabah']
          },
          {
            year: 'Generated Practice',
            type: 'Structured',
            marks: 4,
            time: '5 min',
            question: 'y berubah secara songsang dengan x. Jika y = 15 apabila x = 8, cari x apabila y = 24.',
            answer: 'y = k/x. 15 = k/8, maka k = 120. Apabila y = 24, 24 = 120/x, maka x = 5.',
            focus: ['Cari pemalar k', 'Susun semula persamaan', 'Semak nilai x']
          },
          {
            year: 'Generated Practice',
            type: 'Concept',
            marks: 2,
            time: '3 min',
            question: 'Jika y berubah secara songsang dengan x, terangkan apa berlaku kepada y apabila x digandakan.',
            answer: 'Apabila x digandakan, y menjadi separuh kerana y = k/x.',
            focus: ['Hubungan songsang', 'Perubahan faktor', 'Jawapan ringkas jelas']
          }
        ]
      }
    }

    if (rawContent.includes('bergabung') || rawContent.includes('tercantum') || rawContent.includes('combined')) {
      return {
        topic: 'Ubahan Bergabung',
        questions: [
          {
            year: 'Generated Practice',
            type: 'Combined',
            marks: 5,
            time: '6 min',
            question: 'P berubah secara langsung dengan Q^2 dan secara songsang dengan R. Jika P = 12 apabila Q = 3 dan R = 6, cari P apabila Q = 5 dan R = 10.',
            answer: 'P = kQ^2/R. Gantikan 12 = k(3^2)/6, maka k = 8. Jadi P = 8(5^2)/10 = 20.',
            focus: ['Gabungkan dua hubungan', 'Cari k dahulu', 'Tulis persamaan akhir']
          },
          {
            year: 'Generated Practice',
            type: 'Structured',
            marks: 5,
            time: '6 min',
            question: 'A berubah secara langsung dengan B dan secara songsang dengan sqrt(C). Jika A = 9 apabila B = 6 dan C = 16, cari A apabila B = 10 dan C = 25.',
            answer: 'A = kB/sqrt(C). 9 = k(6)/4, maka k = 6. Apabila B = 10 dan C = 25, A = 6(10)/5 = 12.',
            focus: ['Gunakan sqrt(C)', 'Cari k dengan teliti', 'Substitusi nilai baharu']
          },
          {
            year: 'Generated Practice',
            type: 'Reasoning',
            marks: 3,
            time: '4 min',
            question: 'Diberi z berkadar langsung dengan x dan berkadar songsang dengan y. Apakah berlaku kepada z jika x digandakan dan y juga digandakan?',
            answer: 'z = kx/y. Jika x dan y kedua-duanya digandakan, nisbah x/y tidak berubah. Maka z kekal sama.',
            focus: ['Tulis hubungan lengkap', 'Banding faktor perubahan', 'Kesimpulan tepat']
          }
        ]
      }
    }

    if (rawContent.includes('fungi') || rawContent.includes('kulat') || rawContent.includes('alga')) {
      return {
        topic: 'Fungi dan Alga',
        questions: [
          {
            year: 'Generated Practice',
            type: 'Comparison',
            marks: 4,
            time: '5 min',
            question: 'Bandingkan fungi dan alga dari aspek nutrisi dan struktur sel yang membantu alga menghasilkan makanan sendiri.',
            answer: 'Fungi ialah saprofit atau parasit dan tidak menghasilkan makanan sendiri. Alga mempunyai kloroplas berklorofil, maka alga dapat menjalankan fotosintesis.',
            focus: ['Bandingkan dua kumpulan', 'Sebut kloroplas', 'Hubungkan struktur dengan fungsi']
          },
          {
            year: 'Generated Practice',
            type: 'Structure',
            marks: 3,
            time: '4 min',
            question: 'Nyatakan tiga struktur asas yang terdapat dalam sel yis.',
            answer: 'Antara struktur asas sel yis ialah dinding sel, membran sel, nukleus, sitoplasma dan vakuol.',
            focus: ['Nyatakan struktur sel', 'Elak ciri habitat', 'Tiga isi mencukupi']
          },
          {
            year: 'Generated Practice',
            type: 'Application',
            marks: 3,
            time: '4 min',
            question: 'Mengapakah alga biasanya hidup di kawasan berair yang menerima cahaya?',
            answer: 'Alga mempunyai klorofil dan menjalankan fotosintesis. Air dan cahaya diperlukan untuk menghasilkan makanan sendiri.',
            focus: ['Kaitkan habitat dengan fotosintesis', 'Sebut klorofil', 'Jawab sebab']
          }
        ]
      }
    }

    if (rawContent.includes('mikroorganisma') || rawContent.includes('flora normal')) {
      return {
        topic: 'Mikroorganisma',
        questions: [
          {
            year: 'Generated Practice',
            type: 'Concept',
            marks: 3,
            time: '4 min',
            question: 'Terangkan dua kepentingan flora normal kepada manusia.',
            answer: 'Flora normal menghalang pertumbuhan patogen pada badan dan membantu proses pencernaan. Sesetengah flora normal juga menghasilkan vitamin tertentu.',
            focus: ['Nyatakan fungsi', 'Gunakan istilah patogen', 'Jawab dalam ayat lengkap']
          },
          {
            year: 'Generated Practice',
            type: 'Recall',
            marks: 2,
            time: '3 min',
            question: 'Apakah maksud mikroorganisma?',
            answer: 'Mikroorganisma ialah organisma seni yang tidak dapat dilihat dengan mata kasar dan hanya dapat dilihat dengan bantuan mikroskop.',
            focus: ['Definisi tepat', 'Sebut mikroskop', 'Ringkas']
          },
          {
            year: 'Generated Practice',
            type: 'Classification',
            marks: 5,
            time: '5 min',
            question: 'Senaraikan lima kumpulan utama mikroorganisma.',
            answer: 'Lima kumpulan utama mikroorganisma ialah fungi, alga, protozoa, bakteria dan virus.',
            focus: ['Lima kumpulan', 'Ejaan istilah', 'Tiada huraian panjang diperlukan']
          }
        ]
      }
    }

    return {
      topic: title,
      questions: [
        {
          year: 'Generated Practice',
          type: 'Review',
          marks: 3,
          time: '4 min',
          question: `Berdasarkan ${title}, terangkan idea utama bahagian ini dan berikan satu contoh aplikasi dalam situasi harian.`,
          answer: `Idea utama ${title} perlu dihuraikan menggunakan konsep utama dalam nota. Contoh yang sesuai hendaklah menunjukkan bagaimana konsep itu berlaku dalam situasi sebenar.`,
          focus: ['Kenal pasti konsep utama', 'Berikan contoh relevan', 'Jawab dengan istilah topik']
        },
        {
          year: 'Generated Practice',
          type: 'Short response',
          marks: 2,
          time: '3 min',
          question: `Nyatakan dua istilah penting daripada ${title}.`,
          answer: `Dua istilah penting perlu diambil daripada kandungan ${title} dan ditulis dengan maksud ringkas yang tepat.`,
          focus: ['Pilih istilah utama', 'Maksud ringkas', 'Tidak perlu contoh panjang']
        },
        {
          year: 'Generated Practice',
          type: 'Application',
          marks: 4,
          time: '5 min',
          question: `Bina satu soalan aplikasi mudah berdasarkan ${title} dan selesaikan dengan langkah yang sesuai.`,
          answer: `Jawapan perlu menunjukkan situasi, maklumat diberi, kaedah penyelesaian dan kesimpulan akhir yang selari dengan konsep ${title}.`,
          focus: ['Situasi jelas', 'Langkah tersusun', 'Kesimpulan menjawab soalan']
        }
      ]
    }
  }

  const getPracticeDeck = (section, index) => {
    const rawContent = `${section?.content || ''} ${section?.quizTitle || ''}`.toLowerCase()
    const title = getSectionTitle(section, index)
    const isMathSubject = subjectKey === 'math'
    const has = (...terms) => terms.some((term) => rawContent.includes(term))
    const option = (letter, text) => `${letter}. ${text}`
    const q = ({ question, options, correct, explanation, focus, year, paper, questionNumber }) => ({
      type: 'Objective',
      question,
      options,
      correct,
      answer: options.find((item) => item.startsWith(`${correct}.`)) || correct,
      explanation,
      focus,
      year,
      paper,
      questionNumber
    })
    const withSources = (deck) => ({
      ...deck,
      questions: deck.questions.map((question, questionIndex) => {
        const year = question.year || '2024 Trial'
        const paper = question.paper || 'Paper 1'
        const questionNumber = question.questionNumber || `Q${index + 1}.${questionIndex + 1}`

        return {
          ...question,
          year,
          paper,
          questionNumber,
          sourceLabel: `${year} ${paper} ${questionNumber}`
        }
      })
    })
    const hardcodedDeck = section?.pastExamQuestions || section?.practiceDeck || subchapter?.pastExamQuestions

    if (hardcodedDeck?.questions?.length) {
      return withSources(hardcodedDeck)
    }

    const decks = [
      {
        match: () => isMathSubject && has('hubungan y dengan x', 'x^2', 'xÂ²', 'xÃ‚Â²', 'kuasa'),
        topic: 'Hubungan y dengan x^n',
        questions: [
          q({
            question: 'Jika y berubah secara langsung dengan x^2, persamaan yang betul ialah',
            options: [option('A', 'y = kx'), option('B', 'y = kx^2'), option('C', 'y = k/x'), option('D', 'y = k/x^2')],
            correct: 'B',
            explanation: 'Frasa berubah secara langsung dengan x^2 bermaksud y berkadar terus dengan x^2.',
            focus: ['Kenal pasti kuasa pemboleh ubah', 'Bezakan langsung dan songsang']
          }),
          q({
            question: 'Diberi y = 3x^2. Apakah nilai y apabila x = 4?',
            options: [option('A', '12'), option('B', '24'), option('C', '48'), option('D', '64')],
            correct: 'C',
            explanation: 'Gantikan x = 4 ke dalam y = 3x^2, maka y = 3(16) = 48.',
            focus: ['Substitusi nilai x', 'Kira kuasa dua dahulu']
          }),
          q({
            question: 'Jika x digandakan dalam hubungan y berkadar terus dengan x^2, y akan menjadi',
            options: [option('A', 'separuh'), option('B', 'dua kali ganda'), option('C', 'empat kali ganda'), option('D', 'tidak berubah')],
            correct: 'C',
            explanation: 'Apabila x menjadi 2x, x^2 menjadi 4x^2, jadi y menjadi empat kali ganda.',
            focus: ['Banding faktor perubahan', 'Fahami kesan kuasa dua']
          })
        ]
      },
      {
        match: () => isMathSubject && has('ubahan tercantum', 'tercantum'),
        topic: 'Ubahan Tercantum',
        questions: [
          q({
            question: 'Pernyataan "y berubah secara tercantum dengan x dan z" boleh ditulis sebagai',
            options: [option('A', 'y = kx/z'), option('B', 'y = kz/x'), option('C', 'y = kxz'), option('D', 'y = k/(xz)')],
            correct: 'C',
            explanation: 'Ubahan tercantum melibatkan hasil darab pemboleh ubah yang berkadar langsung.',
            focus: ['Gunakan hasil darab pemboleh ubah', 'Tulis persamaan dengan k']
          }),
          q({
            question: 'Jika y = kxz, apakah berlaku kepada y apabila x digandakan tetapi z kekal?',
            options: [option('A', 'y menjadi separuh'), option('B', 'y digandakan'), option('C', 'y menjadi empat kali ganda'), option('D', 'y kekal')],
            correct: 'B',
            explanation: 'Dalam y = kxz, y berkadar terus dengan x. Menggandakan x menggandakan y.',
            focus: ['Lihat pemboleh ubah yang berubah', 'Kaitkan langsung dengan gandaan']
          }),
          q({
            question: 'Diberi y = 2xz. Cari y apabila x = 3 dan z = 5.',
            options: [option('A', '10'), option('B', '15'), option('C', '30'), option('D', '60')],
            correct: 'C',
            explanation: 'y = 2(3)(5) = 30.',
            focus: ['Substitusi dua pemboleh ubah', 'Darab dengan pemalar']
          })
        ]
      },
      {
        match: () => isMathSubject && (has('ubahan bergabung', 'combined variation') || (has('secara songsang dengan') && has('secara langsung', 'tercantum', 'gabungan'))),
        topic: 'Ubahan Bergabung',
        questions: [
          q({
            question: 'Hubungan "P berubah secara langsung dengan Q dan songsang dengan R" ditulis sebagai',
            options: [option('A', 'P = kQR'), option('B', 'P = kR/Q'), option('C', 'P = kQ/R'), option('D', 'P = k/(QR)')],
            correct: 'C',
            explanation: 'Q berada di pengangka kerana langsung, manakala R berada di penyebut kerana songsang.',
            focus: ['Bezakan pemboleh ubah langsung', 'Letakkan songsang di penyebut']
          }),
          q({
            question: 'Dalam P = kQ/R, apakah berlaku kepada P jika Q dan R kedua-duanya digandakan?',
            options: [option('A', 'P kekal sama'), option('B', 'P digandakan'), option('C', 'P menjadi separuh'), option('D', 'P menjadi empat kali ganda')],
            correct: 'A',
            explanation: 'Faktor gandaan pada Q dan R saling membatalkan dalam nisbah Q/R.',
            focus: ['Banding faktor perubahan', 'Gunakan bentuk persamaan']
          }),
          q({
            question: 'Diberi A = 6B/C. Cari A apabila B = 8 dan C = 4.',
            options: [option('A', '8'), option('B', '12'), option('C', '16'), option('D', '48')],
            correct: 'B',
            explanation: 'A = 6(8)/4 = 12.',
            focus: ['Substitusi nilai', 'Bahagi selepas darab']
          })
        ]
      },
      {
        match: () => isMathSubject && has('ubahan songsang', 'inverse variation', '1/x', 'songsang'),
        topic: 'Ubahan Songsang',
        questions: [
          q({
            question: 'Jika y berubah secara songsang dengan x, persamaan yang betul ialah',
            options: [option('A', 'y = kx'), option('B', 'y = k + x'), option('C', 'y = k/x'), option('D', 'y = x/k')],
            correct: 'C',
            explanation: 'Ubahan songsang bermaksud satu kuantiti berkadar dengan songsangan kuantiti yang lain.',
            focus: ['Kenal pasti bentuk songsang', 'Gunakan pemalar k']
          }),
          q({
            question: 'Diberi y = 24/x. Apakah nilai y apabila x = 6?',
            options: [option('A', '4'), option('B', '6'), option('C', '18'), option('D', '144')],
            correct: 'A',
            explanation: 'y = 24/6 = 4.',
            focus: ['Substitusi nilai x', 'Bahagi dengan betul']
          }),
          q({
            question: 'Dalam ubahan songsang, apabila x digandakan, y akan',
            options: [option('A', 'digandakan'), option('B', 'menjadi separuh'), option('C', 'menjadi empat kali ganda'), option('D', 'kekal sama')],
            correct: 'B',
            explanation: 'Bagi y = k/x, peningkatan x menyebabkan nilai y menurun mengikut nisbah songsang.',
            focus: ['Fahami hubungan songsang', 'Banding perubahan faktor']
          })
        ]
      },
      {
        match: () => isMathSubject && has('ubahan langsung', 'direct variation', 'pemalar perkadaran'),
        topic: 'Ubahan Langsung',
        questions: [
          q({
            question: 'Jika y berubah secara langsung dengan x, hubungan yang betul ialah',
            options: [option('A', 'y = kx'), option('B', 'y = k/x'), option('C', 'xy = k'), option('D', 'y = x + k')],
            correct: 'A',
            explanation: 'Ubahan langsung ditulis sebagai y = kx, dengan k sebagai pemalar perkadaran.',
            focus: ['Bentuk persamaan langsung', 'Maksud pemalar k']
          }),
          q({
            question: 'Diberi y = 5x. Apakah nilai y apabila x = 7?',
            options: [option('A', '12'), option('B', '25'), option('C', '35'), option('D', '57')],
            correct: 'C',
            explanation: 'Gantikan x = 7, maka y = 5(7) = 35.',
            focus: ['Substitusi nilai', 'Darab dengan pemalar']
          }),
          q({
            question: 'Graf ubahan langsung y melawan x biasanya',
            options: [option('A', 'lengkung menurun'), option('B', 'garis lurus melalui asalan'), option('C', 'garis mendatar'), option('D', 'garis menegak sahaja')],
            correct: 'B',
            explanation: 'Untuk y = kx, graf ialah garis lurus yang melalui asalan.',
            focus: ['Tafsir graf', 'Hubungkan persamaan dengan bentuk graf']
          })
        ]
      },
      {
        match: () => has('antibiotik', 'kerintangan antibiotik', 'jangkitan bakteria'),
        topic: 'Antibiotik dan Rawatan',
        questions: [
          q({
            question: 'Antibiotik paling sesuai digunakan untuk merawat',
            options: [option('A', 'jangkitan bakteria'), option('B', 'selsema yang disebabkan virus'), option('C', 'semua jenis penyakit'), option('D', 'kekurangan vitamin')],
            correct: 'A',
            explanation: 'Antibiotik bertindak terhadap bakteria, bukan virus.',
            focus: ['Bezakan bakteria dan virus', 'Guna antibiotik dengan betul']
          }),
          q({
            question: 'Apakah tindakan yang membantu mencegah kerintangan antibiotik?',
            options: [option('A', 'Berhenti makan ubat apabila rasa sihat'), option('B', 'Berkongsi antibiotik dengan rakan'), option('C', 'Menghabiskan kursus antibiotik seperti diarahkan'), option('D', 'Mengambil antibiotik untuk setiap batuk')],
            correct: 'C',
            explanation: 'Menghabiskan kursus mengurangkan peluang bakteria bertahan dan menjadi rintang.',
            focus: ['Amalan penggunaan antibiotik', 'Kesan tidak menghabiskan ubat']
          }),
          q({
            question: 'Antibiotik tidak berkesan terhadap virus kerana virus',
            options: [option('A', 'tidak mempunyai struktur sasaran bakteria'), option('B', 'selalu lebih besar daripada bakteria'), option('C', 'hanya hidup dalam tanah'), option('D', 'mempunyai klorofil')],
            correct: 'A',
            explanation: 'Antibiotik menyasarkan proses atau struktur bakteria yang tidak dimiliki oleh virus.',
            focus: ['Ciri virus', 'Sasaran tindakan antibiotik']
          })
        ]
      },
      {
        match: () => has('teknik aseptik', 'pensterilan', 'antiseptik', 'disinfektan'),
        topic: 'Teknik Aseptik',
        questions: [
          q({
            question: 'Tujuan utama teknik aseptik ialah',
            options: [option('A', 'meningkatkan kalori makanan'), option('B', 'menghalang atau menyingkirkan patogen'), option('C', 'menambahkan nitrogen dalam udara'), option('D', 'menghasilkan tenaga elektrik')],
            correct: 'B',
            explanation: 'Teknik aseptik digunakan untuk mencegah jangkitan dan mengurangkan patogen.',
            focus: ['Maksud teknik aseptik', 'Peranan patogen']
          }),
          q({
            question: 'Antiseptik biasanya digunakan pada',
            options: [option('A', 'tisu hidup seperti kulit'), option('B', 'lantai dan meja sahaja'), option('C', 'enjin kereta'), option('D', 'tanah pertanian')],
            correct: 'A',
            explanation: 'Antiseptik digunakan pada tisu hidup, manakala disinfektan digunakan pada benda bukan hidup.',
            focus: ['Bezakan antiseptik dan disinfektan', 'Kenal pasti contoh penggunaan']
          }),
          q({
            question: 'Kaedah pensterilan yang menggunakan suhu tinggi bertujuan untuk',
            options: [option('A', 'membunuh mikroorganisma'), option('B', 'meningkatkan pH'), option('C', 'menambah klorofil'), option('D', 'menghasilkan protein')],
            correct: 'A',
            explanation: 'Haba tinggi boleh memusnahkan mikroorganisma pada alat atau bahan.',
            focus: ['Fungsi pensterilan', 'Kesan haba']
          })
        ]
      },
      {
        match: () => has('faktor yang mempengaruhi pertumbuhan', 'nutrien', 'kelembapan', 'nilai ph', 'suhu') && has('mikroorganisma', 'bakteria', 'kulat'),
        topic: 'Faktor Pertumbuhan Mikroorganisma',
        questions: [
          q({
            question: 'Antara berikut, faktor yang membantu pertumbuhan mikroorganisma ialah',
            options: [option('A', 'nutrien dan kelembapan'), option('B', 'vakum dan cahaya sangat kuat sahaja'), option('C', 'tiada air langsung'), option('D', 'tiada sumber makanan')],
            correct: 'A',
            explanation: 'Mikroorganisma memerlukan nutrien dan air untuk membiak dengan baik.',
            focus: ['Keperluan pertumbuhan', 'Kaitkan nutrien dan air']
          }),
          q({
            question: 'Mengapakah makanan kering tahan lebih lama?',
            options: [option('A', 'Kurang kelembapan menghalang pertumbuhan mikroorganisma'), option('B', 'Makanan kering mempunyai lebih banyak bakteria'), option('C', 'Suhu makanan kering sentiasa tinggi'), option('D', 'Makanan kering tidak mengandungi atom')],
            correct: 'A',
            explanation: 'Kelembapan rendah menyukarkan mikroorganisma menjalankan aktiviti hidup.',
            focus: ['Kesan kelembapan', 'Hubungkan dengan pengawetan makanan']
          }),
          q({
            question: 'Bagi kebanyakan bakteria, suhu terlalu tinggi akan',
            options: [option('A', 'memusnahkan enzim dan sel'), option('B', 'sentiasa mempercepat pembiakan'), option('C', 'menukarkan bakteria kepada alga'), option('D', 'menghasilkan ion nitrat')],
            correct: 'A',
            explanation: 'Suhu tinggi boleh menyahaslikan enzim dan membunuh bakteria.',
            focus: ['Kesan suhu', 'Peranan enzim']
          })
        ]
      },
      {
        match: () => has('virus', 'glikoprotein', 'melekat pada permukaan sel'),
        topic: 'Virus',
        questions: [
          q({
            question: 'Virus hanya boleh membiak apabila',
            options: [option('A', 'berada dalam sel perumah hidup'), option('B', 'berada dalam air suling'), option('C', 'terdedah kepada cahaya matahari'), option('D', 'dicampur dengan baja')],
            correct: 'A',
            explanation: 'Virus memerlukan sel perumah untuk menghasilkan virus baharu.',
            focus: ['Ciri virus', 'Peranan sel perumah']
          }),
          q({
            question: 'Bahan genetik virus biasanya dilindungi oleh',
            options: [option('A', 'kapsid protein'), option('B', 'dinding sel selulosa'), option('C', 'kloroplas'), option('D', 'vakuol makanan')],
            correct: 'A',
            explanation: 'Kapsid protein melindungi bahan genetik virus.',
            focus: ['Struktur virus', 'Fungsi kapsid']
          }),
          q({
            question: 'Langkah awal jangkitan virus pada sel ialah',
            options: [option('A', 'melekat pada permukaan sel perumah'), option('B', 'menjalankan fotosintesis'), option('C', 'membentuk akar'), option('D', 'menghasilkan makanan sendiri')],
            correct: 'A',
            explanation: 'Virus perlu melekat pada sel perumah sebelum memasukkan bahan genetiknya.',
            focus: ['Urutan pembiakan virus', 'Interaksi dengan sel perumah']
          })
        ]
      },
      {
        match: () => has('protozoa', 'bakteria', 'endospora', 'spirilum'),
        topic: 'Protozoa dan Bakteria',
        questions: [
          q({
            question: 'Endospora pada sesetengah bakteria berfungsi untuk',
            options: [option('A', 'bertahan dalam persekitaran ekstrem'), option('B', 'menjalankan fotosintesis'), option('C', 'menghasilkan bunga'), option('D', 'menyerap cahaya sebagai klorofil')],
            correct: 'A',
            explanation: 'Endospora membantu bakteria bertahan apabila keadaan tidak sesuai.',
            focus: ['Fungsi endospora', 'Adaptasi bakteria']
          }),
          q({
            question: 'Antara berikut, yang manakah ciri umum bakteria?',
            options: [option('A', 'Organisma unisel'), option('B', 'Sentiasa multisel'), option('C', 'Mempunyai akar'), option('D', 'Mempunyai organ lengkap')],
            correct: 'A',
            explanation: 'Bakteria ialah mikroorganisma unisel.',
            focus: ['Ciri bakteria', 'Bezakan daripada organisma kompleks']
          }),
          q({
            question: 'Protozoa biasanya dikelaskan sebagai mikroorganisma kerana',
            options: [option('A', 'saiznya seni dan perlu dilihat dengan mikroskop'), option('B', 'semuanya menghasilkan biji benih'), option('C', 'semuanya hidup sebagai logam'), option('D', 'tidak mempunyai sebarang sel')],
            correct: 'A',
            explanation: 'Protozoa ialah organisma seni yang memerlukan mikroskop untuk diperhatikan dengan jelas.',
            focus: ['Definisi mikroorganisma', 'Ciri protozoa']
          })
        ]
      },
      {
        match: () => has('fungi', 'kulat', 'alga', 'yis', 'klorofil'),
        topic: 'Fungi dan Alga',
        questions: [
          q({
            question: 'Alga boleh menghasilkan makanan sendiri kerana mempunyai',
            options: [option('A', 'klorofil'), option('B', 'antibiotik'), option('C', 'hemoglobin'), option('D', 'endospora')],
            correct: 'A',
            explanation: 'Klorofil membolehkan alga menjalankan fotosintesis.',
            focus: ['Struktur alga', 'Fotosintesis']
          }),
          q({
            question: 'Yis dikelaskan dalam kumpulan',
            options: [option('A', 'fungi'), option('B', 'virus'), option('C', 'protozoa'), option('D', 'alga')],
            correct: 'A',
            explanation: 'Yis ialah sejenis fungi unisel.',
            focus: ['Pengelasan mikroorganisma', 'Kenal pasti yis']
          }),
          q({
            question: 'Perbezaan utama fungi berbanding alga ialah fungi',
            options: [option('A', 'tidak mempunyai klorofil'), option('B', 'sentiasa mempunyai kloroplas'), option('C', 'menghasilkan makanan melalui fotosintesis'), option('D', 'ialah tumbuhan berbunga')],
            correct: 'A',
            explanation: 'Fungi tidak mempunyai klorofil, maka tidak menjalankan fotosintesis.',
            focus: ['Banding fungi dan alga', 'Peranan klorofil']
          })
        ]
      },
      {
        match: () => has('flora normal'),
        topic: 'Flora Normal',
        questions: [
          q({
            question: 'Flora normal membantu manusia dengan cara',
            options: [option('A', 'menghalang pertumbuhan patogen'), option('B', 'meningkatkan kandungan karbon dioksida'), option('C', 'membentuk batu ginjal'), option('D', 'mengurangkan semua nutrien badan')],
            correct: 'A',
            explanation: 'Flora normal bersaing dengan patogen dan membantu melindungi badan.',
            focus: ['Kepentingan flora normal', 'Hubungan dengan patogen']
          }),
          q({
            question: 'Flora normal merujuk kepada mikroorganisma yang',
            options: [option('A', 'hidup secara semula jadi pada badan manusia'), option('B', 'hanya hidup dalam gunung berapi'), option('C', 'sentiasa menyebabkan penyakit'), option('D', 'tidak pernah berada pada kulit')],
            correct: 'A',
            explanation: 'Flora normal ialah mikroorganisma biasa pada badan seperti kulit dan usus.',
            focus: ['Maksud flora normal', 'Lokasi pada badan']
          }),
          q({
            question: 'Antara berikut, yang paling berkaitan dengan flora normal dalam usus ialah',
            options: [option('A', 'membantu pencernaan'), option('B', 'membina tulang secara langsung'), option('C', 'menjalankan respirasi pada daun'), option('D', 'menukar cahaya kepada elektrik')],
            correct: 'A',
            explanation: 'Sebahagian flora normal dalam usus membantu proses pencernaan.',
            focus: ['Fungsi dalam usus', 'Kesan kepada kesihatan']
          })
        ]
      },
      {
        match: () => has('nilai kalori', 'gizi seimbang', 'pinggan sihat', 'malnutrisi', 'obesiti'),
        topic: 'Gizi Seimbang dan Kalori',
        questions: [
          q({
            question: 'Nilai kalori makanan merujuk kepada',
            options: [option('A', 'jumlah tenaga yang dibebaskan oleh makanan'), option('B', 'warna makanan selepas dimasak'), option('C', 'bilangan bakteria dalam makanan'), option('D', 'jumlah air hujan')],
            correct: 'A',
            explanation: 'Nilai kalori menunjukkan tenaga yang dibebaskan apabila makanan dioksidakan.',
            focus: ['Maksud nilai kalori', 'Hubungan makanan dan tenaga']
          }),
          q({
            question: 'Kelas makanan yang mempunyai nilai kalori tertinggi per gram ialah',
            options: [option('A', 'lemak'), option('B', 'air'), option('C', 'vitamin'), option('D', 'garam mineral')],
            correct: 'A',
            explanation: 'Lemak membebaskan lebih banyak tenaga per gram berbanding karbohidrat dan protein.',
            focus: ['Banding kelas makanan', 'Tenaga per gram']
          }),
          q({
            question: 'Pengambilan kalori berlebihan untuk jangka masa panjang boleh menyebabkan',
            options: [option('A', 'obesiti'), option('B', 'fotosintesis'), option('C', 'pendenitritan'), option('D', 'pensterilan')],
            correct: 'A',
            explanation: 'Kalori berlebihan yang tidak digunakan disimpan sebagai lemak badan.',
            focus: ['Kesan kalori berlebihan', 'Masalah kesihatan']
          })
        ]
      },
      {
        match: () => has('nutrien tumbuhan', 'makronutrien', 'mikronutrien', 'kekurangan nitrogen'),
        topic: 'Nutrien Tumbuhan',
        questions: [
          q({
            question: 'Nitrogen penting kepada tumbuhan kerana membantu pembentukan',
            options: [option('A', 'protein dan klorofil'), option('B', 'plastik mikro'), option('C', 'antibiotik sahaja'), option('D', 'gas oksigen dalam tanah')],
            correct: 'A',
            explanation: 'Nitrogen diperlukan untuk membina protein dan klorofil.',
            focus: ['Fungsi nitrogen', 'Kesan kepada pertumbuhan']
          }),
          q({
            question: 'Kesan kekurangan nitrogen yang biasa dilihat pada daun ialah',
            options: [option('A', 'daun menjadi kuning atau hijau pucat'), option('B', 'daun bertukar menjadi logam'), option('C', 'akar hilang serta-merta'), option('D', 'pokok menghasilkan antibiotik')],
            correct: 'A',
            explanation: 'Kekurangan nitrogen mengurangkan pembentukan klorofil lalu menyebabkan klorosis.',
            focus: ['Simptom kekurangan', 'Kaitkan dengan klorofil']
          }),
          q({
            question: 'Makronutrien diperlukan oleh tumbuhan dalam kuantiti',
            options: [option('A', 'besar'), option('B', 'sifar'), option('C', 'sangat kecil sahaja'), option('D', 'tidak tetap kerana bukan nutrien')],
            correct: 'A',
            explanation: 'Makronutrien ialah nutrien yang diperlukan dalam kuantiti yang banyak.',
            focus: ['Bezakan makro dan mikro', 'Keperluan tumbuhan']
          })
        ]
      },
      {
        match: () => has('kitar nitrogen', 'pengikatan nitrogen', 'pendenitritan', 'ion nitrat'),
        topic: 'Kitar Nitrogen',
        questions: [
          q({
            question: 'Tumbuhan menyerap nitrogen daripada tanah terutamanya dalam bentuk',
            options: [option('A', 'ion nitrat'), option('B', 'gas nitrogen terus'), option('C', 'protein haiwan'), option('D', 'karbon monoksida')],
            correct: 'A',
            explanation: 'Tumbuhan tidak menyerap gas nitrogen secara langsung; akar menyerap ion nitrat.',
            focus: ['Bentuk nitrogen diserap', 'Peranan akar']
          }),
          q({
            question: 'Bakteria pengikat nitrogen banyak ditemui pada nodul akar',
            options: [option('A', 'pokok kekacang'), option('B', 'pokok kaktus plastik'), option('C', 'kulat roti sahaja'), option('D', 'daun kering sahaja')],
            correct: 'A',
            explanation: 'Pokok kekacang mempunyai nodul akar yang mengandungi bakteria pengikat nitrogen.',
            focus: ['Lokasi bakteria pengikat nitrogen', 'Kepentingan pokok kekacang']
          }),
          q({
            question: 'Proses pendenitritan menukarkan ion nitrat kepada',
            options: [option('A', 'gas nitrogen'), option('B', 'glukosa'), option('C', 'plastik'), option('D', 'klorofil')],
            correct: 'A',
            explanation: 'Pendenitritan mengembalikan nitrogen ke atmosfera sebagai gas nitrogen.',
            focus: ['Maksud pendenitritan', 'Arah kitar nitrogen']
          })
        ]
      },
      {
        match: () => has('pemprosesan makanan', 'penapaian', 'pempasteuran'),
        topic: 'Pemprosesan Makanan',
        questions: [
          q({
            question: 'Penapaian dalam pemprosesan makanan melibatkan tindakan',
            options: [option('A', 'mikroorganisma berfaedah'), option('B', 'logam berat'), option('C', 'gas nitrogen sahaja'), option('D', 'plastik mikro')],
            correct: 'A',
            explanation: 'Penapaian menggunakan mikroorganisma seperti yis atau bakteria untuk mengubah bahan makanan.',
            focus: ['Maksud penapaian', 'Peranan mikroorganisma']
          }),
          q({
            question: 'Contoh makanan yang boleh dihasilkan melalui penapaian ialah',
            options: [option('A', 'yogurt'), option('B', 'air suling'), option('C', 'besi'), option('D', 'kaca')],
            correct: 'A',
            explanation: 'Yogurt dihasilkan melalui tindakan bakteria berfaedah.',
            focus: ['Contoh penapaian', 'Mikroorganisma berfaedah']
          }),
          q({
            question: 'Tujuan utama pemprosesan makanan ialah',
            options: [option('A', 'memanjangkan jangka hayat dan menjamin keselamatan makanan'), option('B', 'menjadikan makanan tidak boleh dimakan'), option('C', 'menghilangkan semua nutrien'), option('D', 'meningkatkan pencemaran air')],
            correct: 'A',
            explanation: 'Pemprosesan makanan boleh mengurangkan kerosakan dan mengekalkan kualiti makanan.',
            focus: ['Tujuan pemprosesan', 'Keselamatan makanan']
          })
        ]
      },
      {
        match: () => has('pengeluaran makanan', 'baka', 'jentera', 'teknologi pengeluaran'),
        topic: 'Teknologi Pengeluaran Makanan',
        questions: [
          q({
            question: 'Penggunaan jentera dalam pertanian membantu',
            options: [option('A', 'meningkatkan kecekapan dan menjimatkan masa'), option('B', 'mengurangkan semua hasil tanaman'), option('C', 'menghapuskan keperluan air sepenuhnya'), option('D', 'menukar tanaman kepada logam')],
            correct: 'A',
            explanation: 'Jentera mempercepat kerja ladang dan meningkatkan produktiviti.',
            focus: ['Kelebihan jentera', 'Produktiviti makanan']
          }),
          q({
            question: 'Baka tanaman yang baik dipilih untuk mendapatkan',
            options: [option('A', 'hasil lebih berkualiti dan banyak'), option('B', 'tanaman yang tidak boleh dimakan'), option('C', 'buah tanpa sebarang nutrien'), option('D', 'tanah yang lebih tercemar')],
            correct: 'A',
            explanation: 'Pemilihan baka membantu meningkatkan kuantiti dan kualiti makanan.',
            focus: ['Pemilihan baka', 'Kualiti hasil']
          }),
          q({
            question: 'Satu tujuan teknologi pengeluaran makanan ialah',
            options: [option('A', 'menjamin bekalan makanan mencukupi'), option('B', 'menghentikan semua aktiviti pertanian'), option('C', 'meningkatkan pembaziran makanan'), option('D', 'mengurangkan keselamatan makanan')],
            correct: 'A',
            explanation: 'Teknologi membantu memenuhi permintaan makanan yang semakin meningkat.',
            focus: ['Tujuan teknologi', 'Bekalan makanan']
          })
        ]
      },
      {
        match: () => has('suplemen', 'makanan kesihatan'),
        topic: 'Makanan Kesihatan dan Suplemen',
        questions: [
          q({
            question: 'Suplemen kesihatan paling sesuai diambil apabila',
            options: [option('A', 'perlu melengkapkan kekurangan nutrien tertentu'), option('B', 'ingin menggantikan semua makanan utama'), option('C', 'mahu mengelakkan air sepenuhnya'), option('D', 'hendak merawat semua penyakit tanpa nasihat doktor')],
            correct: 'A',
            explanation: 'Suplemen bertujuan melengkapkan nutrien, bukan menggantikan pemakanan seimbang.',
            focus: ['Peranan suplemen', 'Had penggunaan']
          }),
          q({
            question: 'Amalan terbaik sebelum mengambil suplemen secara berterusan ialah',
            options: [option('A', 'mendapatkan nasihat pakar kesihatan'), option('B', 'mengambil dos sebanyak mungkin'), option('C', 'mengabaikan label produk'), option('D', 'mencampur semua produk serentak')],
            correct: 'A',
            explanation: 'Nasihat pakar membantu mengelakkan dos berlebihan atau interaksi yang tidak sesuai.',
            focus: ['Penggunaan selamat', 'Rujuk pakar']
          }),
          q({
            question: 'Makanan kesihatan masih perlu diambil bersama',
            options: [option('A', 'gizi seimbang'), option('B', 'diet tanpa nutrien'), option('C', 'antibiotik tanpa sebab'), option('D', 'bahan toksik')],
            correct: 'A',
            explanation: 'Makanan kesihatan tidak menggantikan keperluan diet seimbang.',
            focus: ['Gizi seimbang', 'Peranan makanan kesihatan']
          })
        ]
      },
      {
        match: () => has('kitaran hayat produk', 'jejak karbon', '5r', 'mikroplastik'),
        topic: 'Kitaran Hayat Produk',
        questions: [
          q({
            question: 'Jejak karbon sesuatu produk merujuk kepada',
            options: [option('A', 'jumlah gas rumah hijau yang dikaitkan dengan produk'), option('B', 'warna pembungkusan produk'), option('C', 'berat produk sahaja'), option('D', 'bilangan pengguna produk')],
            correct: 'A',
            explanation: 'Jejak karbon mengambil kira pelepasan gas rumah hijau sepanjang hayat produk.',
            focus: ['Maksud jejak karbon', 'Kesan alam sekitar']
          }),
          q({
            question: 'Antara berikut, amalan 5R yang mengurangkan sisa ialah',
            options: [option('A', 'Reuse'), option('B', 'Increase waste'), option('C', 'Ignore'), option('D', 'Pollute')],
            correct: 'A',
            explanation: 'Reuse bermaksud guna semula, iaitu salah satu amalan 5R.',
            focus: ['Kenal pasti 5R', 'Kurangkan sisa']
          }),
          q({
            question: 'Mikroplastik berbahaya kerana',
            options: [option('A', 'boleh memasuki rantai makanan'), option('B', 'menjadi baja nitrogen terbaik'), option('C', 'sentiasa mudah dilihat dan dikutip'), option('D', 'menghasilkan oksigen dalam air')],
            correct: 'A',
            explanation: 'Saiz mikroplastik yang kecil membolehkannya dimakan oleh organisma kecil dan bergerak dalam rantai makanan.',
            focus: ['Kesan mikroplastik', 'Rantai makanan']
          })
        ]
      },
      {
        match: () => has('pencemaran', 'eutrofikasi', 'bod', 'metilena biru'),
        topic: 'Pencemaran Alam Sekitar',
        questions: [
          q({
            question: 'BOD yang tinggi menunjukkan air',
            options: [option('A', 'lebih tercemar dengan bahan organik'), option('B', 'lebih tulen sepenuhnya'), option('C', 'tidak mengandungi mikroorganisma'), option('D', 'sentiasa sesuai diminum terus')],
            correct: 'A',
            explanation: 'BOD tinggi bermaksud banyak oksigen diperlukan untuk penguraian bahan organik.',
            focus: ['Maksud BOD', 'Tafsiran pencemaran air']
          }),
          q({
            question: 'Eutrofikasi biasanya berpunca daripada peningkatan',
            options: [option('A', 'nutrien seperti nitrat dan fosfat dalam air'), option('B', 'oksigen bersih sahaja'), option('C', 'cahaya bulan'), option('D', 'kandungan pasir kering')],
            correct: 'A',
            explanation: 'Nutrien berlebihan menyebabkan pertumbuhan alga yang pesat.',
            focus: ['Punca eutrofikasi', 'Pertumbuhan alga']
          }),
          q({
            question: 'Dalam ujian metilena biru, warna biru hilang lebih cepat apabila air',
            options: [option('A', 'lebih tercemar'), option('B', 'lebih bersih'), option('C', 'beku sepenuhnya'), option('D', 'tiada bakteria langsung')],
            correct: 'A',
            explanation: 'Air tercemar mempunyai lebih banyak mikroorganisma yang menggunakan oksigen dengan cepat.',
            focus: ['Ujian metilena biru', 'Hubungan dengan pencemaran']
          })
        ]
      },
      {
        match: () => has('teknologi hijau', 'teknologi emisi negatif', 'kereta hibrid', 'perjanjian paris', 'protokol kyoto'),
        topic: 'Pemeliharaan Alam Sekitar',
        questions: [
          q({
            question: 'Teknologi emisi negatif bertujuan untuk',
            options: [option('A', 'menyingkirkan CO2 dari atmosfera'), option('B', 'menambah pencemaran udara'), option('C', 'meningkatkan penggunaan bahan api fosil'), option('D', 'mengurangkan kawasan hijau')],
            correct: 'A',
            explanation: 'Teknologi emisi negatif mengurangkan gas rumah hijau seperti CO2 di atmosfera.',
            focus: ['Maksud NET', 'Kesan kepada iklim']
          }),
          q({
            question: 'Contoh teknologi hijau dalam pengangkutan ialah',
            options: [option('A', 'kereta hibrid'), option('B', 'pembakaran terbuka'), option('C', 'enjin bocor minyak'), option('D', 'pembuangan sisa ke sungai')],
            correct: 'A',
            explanation: 'Kereta hibrid mengurangkan penggunaan bahan api fosil berbanding kenderaan biasa.',
            focus: ['Contoh teknologi hijau', 'Sektor pengangkutan']
          }),
          q({
            question: 'Perjanjian antarabangsa seperti Perjanjian Paris berkaitan dengan usaha',
            options: [option('A', 'mengurangkan perubahan iklim'), option('B', 'menambah plastik sekali guna'), option('C', 'menghapuskan semua tumbuhan'), option('D', 'menggalakkan pencemaran air')],
            correct: 'A',
            explanation: 'Perjanjian Paris memberi tumpuan kepada tindakan global terhadap perubahan iklim.',
            focus: ['Kerjasama antarabangsa', 'Isu perubahan iklim']
          })
        ]
      },
      {
        match: () => has('mikroorganisma berfaedah', 'ekoenzim', 'lactobacillus', 'bioteknologi'),
        topic: 'Mikroorganisma Berfaedah',
        questions: [
          q({
            question: 'Mikroorganisma berfaedah boleh digunakan dalam bidang perubatan untuk menghasilkan',
            options: [option('A', 'antibiotik dan vaksin'), option('B', 'plastik mikro'), option('C', 'gas karbon monoksida'), option('D', 'bahan radioaktif sahaja')],
            correct: 'A',
            explanation: 'Sesetengah mikroorganisma digunakan untuk menghasilkan ubat dan vaksin.',
            focus: ['Aplikasi perubatan', 'Produk mikroorganisma']
          }),
          q({
            question: 'Lactobacillus sp. sering dikaitkan dengan',
            options: [option('A', 'probiotik'), option('B', 'kereta hibrid'), option('C', 'eutrofikasi'), option('D', 'penyaduran logam')],
            correct: 'A',
            explanation: 'Lactobacillus sp. ialah bakteria berfaedah yang digunakan sebagai probiotik.',
            focus: ['Contoh bakteria berfaedah', 'Kegunaan probiotik']
          }),
          q({
            question: 'Ekoenzim dianggap mesra alam kerana boleh digunakan sebagai',
            options: [option('A', 'larutan pembersih daripada sisa organik'), option('B', 'racun yang mencemarkan sungai'), option('C', 'bahan api fosil'), option('D', 'plastik sekali guna')],
            correct: 'A',
            explanation: 'Ekoenzim dihasilkan daripada sisa organik dan boleh mengurangkan pembaziran.',
            focus: ['Kegunaan ekoenzim', 'Kelestarian']
          })
        ]
      }
    ]

    const matchedDeck = decks.find((deck) => deck.match()) || {
      topic: title,
      questions: [
        q({
          question: `Apakah fokus utama bahagian "${title}"?`,
          options: [option('A', `Konsep utama yang diterangkan dalam ${title}`), option('B', 'Topik yang tiada kaitan dengan nota'), option('C', 'Arahan teknikal aplikasi'), option('D', 'Maklumat rawak tanpa hubungan')],
          correct: 'A',
          explanation: `Bahagian ini perlu dijawab berdasarkan konsep utama yang dinyatakan dalam "${title}".`,
          focus: ['Baca tajuk bahagian', 'Kenal pasti konsep utama']
        }),
        q({
          question: `Cara terbaik menjawab soalan berkaitan "${title}" ialah`,
          options: [option('A', 'menggunakan istilah daripada bahagian tersebut'), option('B', 'meneka tanpa membaca nota'), option('C', 'menjawab topik subbab lain'), option('D', 'mengabaikan kata kunci soalan')],
          correct: 'A',
          explanation: 'Soalan section-level perlu dijawab dengan istilah dan idea yang muncul dalam bahagian itu sendiri.',
          focus: ['Gunakan kata kunci section', 'Elak jawapan terlalu umum']
        }),
        q({
          question: `Jika soalan meminta aplikasi bagi "${title}", jawapan yang paling sesuai ialah`,
          options: [option('A', 'contoh situasi harian yang menggunakan konsep bahagian ini'), option('B', 'contoh daripada topik lain sahaja'), option('C', 'jawapan tanpa sebab'), option('D', 'senarai pilihan rawak')],
          correct: 'A',
          explanation: 'Aplikasi perlu menunjukkan konsep bahagian itu digunakan dalam situasi sebenar.',
          focus: ['Pilih contoh relevan', 'Kaitkan dengan konsep section']
        })
      ]
    }

    return withSources(matchedDeck)
  }

  const handleExplainSection = (section) => {
    const text = stripMarkdown(section?.content || section?.quizTitle || subchapter?.title || '')
    if (onTextSelect) onTextSelect(text)
    if (onExplainClick) onExplainClick()
  }

  const handleOpenPractice = (section, idx) => {
    setActivePracticeIndex(0)
    setShowPracticeAnswer(false)
    setActivePastYearSection({ section, idx })
  }

  const renderSectionActions = (section, idx) => (
    <div className="mb-5 flex flex-col gap-3 border-l-4 border-primary-500 bg-white py-3 pl-4 pr-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 pr-2">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-primary-700">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          <span>Section {idx + 1}</span>
        </div>
        <p className="truncate text-base font-bold text-slate-950">
          {getSectionTitle(section, idx)}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:justify-end">
        <button
          type="button"
          onClick={() => handleExplainSection(section)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-bold text-primary-800 transition-colors hover:border-primary-300 hover:bg-primary-100"
          title="Explain this section with AI"
        >
          <MessageCircle size={15} />
          <span>Explain</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenPractice(section, idx)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
          title="Open exam-style practice"
        >
          <GraduationCap size={15} />
          <span>Past Exam Questions</span>
        </button>

        <button
          type="button"
          onClick={onNotesClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
          title="Open notes"
          aria-label="Open notes"
        >
          <StickyNote size={15} />
        </button>
      </div>
    </div>
  )

  const activePractice = activePastYearSection
    ? getPracticeDeck(activePastYearSection.section, activePastYearSection.idx)
    : null
  const practiceQuestions = activePractice?.questions || []
  const activeQuestion = practiceQuestions[activePracticeIndex] || practiceQuestions[0]
  const practiceSummary = `${practiceQuestions.length} hardcoded past exam question${practiceQuestions.length === 1 ? '' : 's'}`

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-4xl p-8">
      {/* Breadcrumb */}
      <motion.div 
        className="mb-6 flex items-center space-x-2 text-sm text-gray-600"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span>{chapter?.title}</span>
        <span>/</span>
        <span className="text-primary-600 font-medium">{subchapter?.title}</span>
      </motion.div>

      {/* Content Header with AI Quiz Button */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <BookOpen className="text-primary-600" size={28} />
              <h1 className="text-3xl font-bold text-primary-900">{subchapter?.title}</h1>
            </div>
          </div>
          
          {/* AI Quiz Generation Button */}
          {/* <motion.button
            onClick={handleGenerateQuiz}
            disabled={isGeneratingQuiz}
            className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm flex items-center space-x-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGeneratingQuiz ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Brain size={16} />
                <span>Generate AI Quiz</span>
              </>
            )}
          </motion.button> */}
        </div>
        
        <div className="h-1 w-20 bg-primary-600 rounded-full" />
        
        
      </motion.div>

      {/* Video Section (single video, shown before content if no sections) */}
      {subchapter?.videoUrl && !subchapter?.sections && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Play className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-primary-900">Penjelasan Video</h2>
            </div>
            <VideoPlayer videoUrl={subchapter.videoUrl} />
          </div>
        </motion.div>
      )}

      {/* SECTIONS MODE — renders multiple content/video/quiz blocks in sequence */}
      {subchapter?.sections ? (
        <div ref={contentRef}>
        {subchapter.sections.map((section, idx) => (
          <div key={idx}>
            {/* Section content */}
            {section.content && (
              <>
                {renderSectionActions(section, idx)}
                <motion.div
                  className="markdown-content lesson-markdown max-w-none mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </motion.div>
              </>
            )}

            {/* Section video */}
            {section.videoUrl && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <Play className="text-primary-600" size={24} />
                    <h2 className="text-xl font-bold text-primary-900">{section.videoTitle || 'Penjelasan Video'}</h2>
                  </div>
                  <VideoPlayer videoUrl={section.videoUrl} />
                </div>
              </motion.div>
            )}

            {/* Section quiz */}
            {section.quiz && (
              <motion.div
                className="mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 shadow-sm">
                  {/* Header row */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <FileQuestion className="text-purple-600" size={24} />
                      <h2 className="text-xl font-bold text-purple-900">{section.quizTitle || 'Uji Pengetahuan Anda'}</h2>
                    </div>
                    <motion.button
                      onClick={() => handleGenerateSectionQuiz(idx, section)}
                      disabled={sectionAIQuizzes[idx]?.isGenerating}
                      className="ml-auto px-4 py-2 bg-blue-800 text-white rounded-lg font-medium text-sm flex items-center space-x-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {sectionAIQuizzes[idx]?.isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Brain size={16} />
                          <span>Generate AI Quiz</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Show AI quiz if generated, otherwise show preset quiz */}
                  {sectionAIQuizzes[idx]?.quiz ? (
                    <div>
                      <p className="text-xs text-purple-600 font-medium mb-3">✨ AI Generated Quiz</p>
                      <QuizComponent
                        quiz={sectionAIQuizzes[idx].quiz}
                        onClose={() => setSectionAIQuizzes(prev => ({ ...prev, [idx]: { ...prev[idx], quiz: null } }))}
                        chapter={chapter}
                        subchapter={subchapter}
                      />
                      <button
                        onClick={() => setSectionAIQuizzes(prev => ({ ...prev, [idx]: { ...prev[idx], quiz: null } }))}
                        className="mt-3 text-xs text-purple-600 underline hover:text-purple-800"
                      >
                        ← Kembali ke soalan asal
                      </button>
                    </div>
                  ) : (
                    <QuizComponent
                      quiz={section.quiz}
                      onClose={() => {}}
                      chapter={chapter}
                      subchapter={subchapter}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ))}
        </div>
      ) : (
        <>
          {/* SINGLE MODE — original render for subchapters without sections */}
          {renderSectionActions(
            {
              content: subchapter?.content || chapter?.content || '',
              quizTitle: subchapter?.title
            },
            0
          )}

          <motion.div
            ref={contentRef}
            className="markdown-content lesson-markdown max-w-none mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {subchapter?.content || chapter?.content || ''}
            </ReactMarkdown>
          </motion.div>

          {/* Quiz Section - Original Style with AI Generation Option */}
          {(subchapter?.quiz || quiz) && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <FileQuestion className="text-purple-600" size={24} />
                    <h2 className="text-xl font-bold text-purple-900">Uji Pengetahuan Anda</h2>
                  </div>
                  <motion.button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="ml-auto px-4 py-2 bg-blue-800 text-white rounded-lg font-medium text-sm flex items-center space-x-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        <span>Generate AI Quiz</span>
                      </>
                    )}
                  </motion.button>
                </div>
                {showQuiz ? (
                  <QuizComponent
                    quiz={quiz || subchapter.quiz}
                    onClose={() => setShowQuiz(false)}
                    chapter={chapter}
                    subchapter={subchapter}
                  />
                ) : (
                  <p className="text-gray-600">
                    Uji pengetahuan anda mengenai {subchapter?.title} dengan {(quiz || subchapter?.quiz)?.questions?.length || 3} soalan.
                    {quiz && <span className="text-purple-600 font-medium"> (AI Generated)</span>}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Navigation Hint */}
      <motion.div
        className="mt-12 p-4 bg-blue-50 border-l-4 border-primary-600 rounded"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-gray-700">
          💡 <strong>Tips:</strong> Gunakan butang Explain pada setiap bahagian untuk mendapatkan penjelasan AI yang tepat mengikut konteks bahagian tersebut.
        </p>
      </motion.div>

      {/* Floating Notes Button - RESTORED */}
      <motion.button
        onClick={onNotesClick}
        className="fixed bottom-8 bg-yellow-400 hover:bg-yellow-500 text-gray-900 p-4 rounded-full shadow-lg transition-all z-30"
        style={{
          right: `${rightPanelWidth + 32}px`,
          transition: 'right 0.15s ease-out'
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        title="Buka Nota"
      >
        <StickyNote size={24} />
      </motion.button>

      <AnimatePresence>
        {activePractice && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-end justify-end bg-slate-950/45 sm:items-stretch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setActivePastYearSection(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="past-year-title"
              className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl sm:h-full sm:max-w-xl sm:rounded-none"
              initial={{ x: 32, y: 24, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ x: 32, y: 24, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                    <GraduationCap size={14} />
                    <span>{activePractice.topic}</span>
                  </div>
                  <h2 id="past-year-title" className="text-lg font-bold text-white">
                    Past Exam Questions
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {practiceSummary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePastYearSection(null)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close past-year question"
                  title="Close"
                >
                  <X size={18} />
                </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {practiceQuestions.map((question, questionIndex) => (
                    <button
                      key={`${activePractice.topic}-${questionIndex}`}
                      type="button"
                      onClick={() => {
                        setActivePracticeIndex(questionIndex)
                        setShowPracticeAnswer(false)
                      }}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                        activePracticeIndex === questionIndex
                          ? 'border-white bg-white text-slate-950'
                          : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wide">
                        {question.questionNumber || `Q${questionIndex + 1}`}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-semibold">
                        {question.type}
                      </span>
                      {question.sourceLabel && (
                        <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-70">
                          {question.sourceLabel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {activeQuestion && (
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <FileQuestion size={16} className="text-primary-600" />
                      <span>Question</span>
                      {activeQuestion.sourceLabel && (
                        <span className="ml-auto rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                          {activeQuestion.sourceLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-base leading-relaxed text-slate-900">
                      {activeQuestion.question}
                    </p>
                    <div className="mt-4 space-y-2">
                      {activeQuestion.options?.map((option) => {
                        const isCorrect = showPracticeAnswer && option.startsWith(`${activeQuestion.correct}.`)
                        return (
                          <div
                            key={option}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                              isCorrect
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                                : 'border-slate-200 bg-slate-50 text-slate-800'
                            }`}
                          >
                            {option}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={() => setShowPracticeAnswer((current) => !current)}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    {showPracticeAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showPracticeAnswer ? 'Hide answer' : 'Reveal answer'}</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {showPracticeAnswer && (
                      <motion.section
                        className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-950">
                          <CheckCircle2 size={16} className="text-emerald-700" />
                          <span>Answer</span>
                        </div>
                        <p className="text-sm leading-relaxed text-emerald-950">
                          {activeQuestion.answer}
                        </p>
                        {activeQuestion.explanation && (
                          <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                            {activeQuestion.explanation}
                          </p>
                        )}
                      </motion.section>
                    )}
                  </AnimatePresence>

                  <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-950">
                      <ListChecks size={16} className="text-amber-700" />
                      <span>Focus</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeQuestion.focus.map((item) => (
                        <span
                          key={item}
                          className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setActivePracticeIndex((current) => Math.max(0, current - 1))
                    setShowPracticeAnswer(false)
                  }}
                  disabled={activePracticeIndex === 0}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>

                <span className="text-xs font-bold text-slate-500">
                  {activePracticeIndex + 1} / {practiceQuestions.length}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActivePracticeIndex((current) => Math.min(practiceQuestions.length - 1, current + 1))
                    setShowPracticeAnswer(false)
                  }}
                  disabled={activePracticeIndex >= practiceQuestions.length - 1}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}


