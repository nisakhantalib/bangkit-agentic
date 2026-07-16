'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck
} from 'lucide-react'

const slides = [
  {
    src: '/images/comming-soon.png',
    alt: 'Students learning together',
    title: 'Learn with focus',
    caption: 'Track lessons, quizzes, and revision in one quiet workspace.'
  },
  {
    src: '/images/class.png',
    alt: 'Classroom illustration',
    title: 'Stay exam ready',
    caption: 'Practice Sains and Matematik with structured learning tools.'
  },
  {
    src: '/images/books.png',
    alt: 'Stack of books',
    title: 'Pick up where you left off',
    caption: 'Your dashboard is ready with subjects, tasks, and progress.'
  }
]

export default function LoginPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 4200)

    return () => window.clearInterval(timer)
  }, [])

  const slide = slides[activeSlide]

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <section className="relative hidden min-h-screen overflow-hidden bg-slate-900 lg:block">
          {slides.map((item, index) => (
            <div
              key={item.src}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={index === 0}
                sizes="60vw"
                className="object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-slate-950/45" />

          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">
            <div className="inline-flex w-fit items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-white backdrop-blur">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-primary-700">
                <ShieldCheck size={21} />
              </span>
              <span>
                <span className="block text-sm font-bold uppercase tracking-wide">ALPHA+</span>
                <span className="block text-xs text-white/70">Student Portal</span>
              </span>
            </div>

            <div className="max-w-xl text-white">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">
                Welcome back
              </p>
              <h1 className="text-5xl font-black leading-tight">{slide.title}</h1>
              <p className="mt-5 max-w-md text-lg leading-8 text-white/82">{slide.caption}</p>

              <div className="mt-8 flex gap-2">
                {slides.map((item, index) => (
                  <button
                    key={item.src}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/45'
                    }`}
                    aria-label={`Show slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-lg bg-slate-900">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/35" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-bold uppercase tracking-wide text-cyan-100">ALPHA+</p>
                  <h1 className="mt-1 text-2xl font-black">{slide.title}</h1>
                </div>
              </div>
            </div>

            <div className="mb-8">
              {/* <p className="text-sm font-bold uppercase tracking-wide text-primary-700">
                Sains Tingkatan 5
              </p> */}
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your demo account is ready to use.
              </p>
            </div>

            <form className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
                <span className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-white px-4 py-3 transition focus-within:border-primary-500">
                  <Mail size={19} className="text-slate-400" />
                  <input
                    type="email"
                    defaultValue="mohd.razak@student.alpha.my"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
                <span className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-white px-4 py-3 transition focus-within:border-primary-500">
                  <LockKeyhole size={19} className="text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    defaultValue="Alpha2026"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-primary-600"
                  />
                  Remember me
                </label>
                <button type="button" className="font-bold text-primary-700 hover:text-primary-900">
                  Forgot password?
                </button>
              </div>

              <Link
                href="/dashboard"
                replace
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-primary-700"
              >
                Sign In
                <ArrowRight size={18} />
              </Link>
            </form>

            {/* <p className="mt-8 text-center text-sm text-slate-500">
              Demo access for SMK Taman Selayang students.
            </p> */}
          </div>
        </section>
      </div>
    </main>
  )
}
