'use client'

import Link from 'next/link'
import { subjects } from '@/data/subjects'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, GitBranch, Sparkles, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const subjectList = Object.values(subjects)
  const chapterCount = subjectList.reduce(
    (sum, subject) => sum + subject.chaptersData.length,
    0
  )
  const topicCount = subjectList.reduce(
    (sum, subject) =>
      sum +
      subject.chaptersData.reduce(
        (count, chapter) => count + chapter.subchapters.length,
        0
      ),
    0
  )

  return (
    <main className="h-screen overflow-hidden bg-slate-100 text-slate-950">
      <header className="h-[76px] border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
              <Sparkles size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold leading-6 tracking-[0]">ALPHA+</h1>
              <p className="text-sm leading-5 text-slate-500">Pembelajaran berteraskan AI</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold leading-5 text-slate-900">Ruang Pembelajaran</p>
              <p className="text-xs leading-4 text-slate-500">Teruskan progres anda</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white shadow-sm">
              MR
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid h-[calc(100vh-76px)] max-w-6xl grid-rows-[minmax(0,0.95fr)_minmax(0,0.78fr)] gap-5 px-4 py-5 md:px-6 md:py-6">
        <section className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-h-0 flex-col justify-center bg-primary-700 px-6 py-6 text-white md:px-8">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">
                <Sparkles size={15} />
                <span>Dashboard Pelajar</span>
              </div>

              <h2 className="text-3xl font-bold leading-tight tracking-[0] md:text-4xl">
                Pilih subjek untuk mula belajar
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
                Masuk ke ruang pembelajaran, gunakan AI assistant, semak kuiz, dan pantau topik
                melalui Knowledge Graph.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="min-w-[96px] rounded-xl bg-white/10 px-4 py-3">
                  <div className="text-2xl font-bold leading-7">{subjectList.length}</div>
                  <div className="text-xs text-blue-100">Subjek aktif</div>
                </div>

                <div className="min-w-[104px] rounded-xl bg-white/10 px-4 py-3">
                  <div className="text-2xl font-bold leading-7">{chapterCount}</div>
                  <div className="text-xs text-blue-100">Bab tersedia</div>
                </div>

                <div className="min-w-[78px] rounded-xl bg-yellow-400 px-4 py-3 text-slate-950">
                  <div className="text-2xl font-bold leading-7">{topicCount}</div>
                  <div className="text-xs font-semibold text-slate-700">Topik</div>
                </div>
              </div>
            </div>

            <aside className="hidden min-h-0 flex-col justify-center bg-slate-800 px-7 py-6 text-white lg:flex">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-slate-950 shadow-sm">
                  MR
                </div>

                <div>
                  <p className="font-semibold leading-5">Selamat kembali</p>
                  <p className="mt-1 text-sm leading-5 text-slate-300">
                    Teruskan pembelajaran anda hari ini.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">Progress minggu ini</span>
                  <TrendingUp size={18} className="text-yellow-300" />
                </div>

                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 w-2/5 rounded-full bg-yellow-400" />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-300">
                  Mulakan satu topik atau jawab kuiz untuk naikkan progres.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid min-h-0 grid-cols-1 gap-5 md:grid-cols-2">
          {subjectList.map((subject) => (
            <motion.div
              key={subject.key}
              className="min-h-0"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
            >
              <Link
                href={`/subject/${subject.key}`}
                prefetch
                className="group flex h-full min-h-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-yellow-300 hover:shadow-lg"
              >
                <div className="min-h-0">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-3xl">
                      {subject.icon}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-yellow-400 group-hover:text-slate-950">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold leading-8 tracking-[0]">{subject.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Terokai nota, video, kuiz objektif dan subjektif, serta Knowledge Graph untuk
                    navigasi topik.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <BookOpen size={16} className="text-primary-700" />
                      <span>{subject.chaptersData.length} Bab</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <GitBranch size={16} className="text-primary-700" />
                      <span>
                        {subject.chaptersData.reduce(
                          (count, chapter) => count + chapter.subchapters.length,
                          0
                        )}{' '}
                        Topik
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>
      </section>
    </main>
  )
}
