import { notFound } from 'next/navigation'

import SubjectLearningPage from '@/components/SubjectLearningPage'
import { subjects } from '@/data/subjects'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(subjects).map((subject) => ({ subject }))
}

export default function SubjectPage({ params }) {
  const subject = subjects[params.subject]

  if (!subject) {
    notFound()
  }

  return (
    <SubjectLearningPage
      chaptersData={subject.chaptersData}
      subjectKey={subject.key}
      subjectTitle={subject.title}
    />
  )
}

