export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  GraduationCap, CheckCircle2, Award, ArrowLeft, Loader2,
  BookOpen, Trophy, Star, Lock, ChevronRight, Sparkles, Download
} from 'lucide-react'
import { getCourse, getLessons, getProgress, supabase } from '@/lib/supabase'

export default function CourseFinalPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [gradedQuizzes, setGradedQuizzes] = useState<any[]>([])
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('Graduate')
  const [certStatus, setCertStatus] = useState<'idle' | 'checking' | 'eligible' | 'ineligible' | 'issued'>('idle')
  const [certError, setCertError] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const email = user.email || user.id
        setUserId(email)
        setUserName(user.user_metadata?.full_name || email.split('@')[0] || 'Graduate')

        const [courseData, lessonsList] = await Promise.all([
          getCourse(courseId),
          getLessons(courseId)
        ])
        setCourse(courseData)
        setLessons(lessonsList)

        // Count completed lessons
        let count = 0
        for (const les of lessonsList) {
          const done = await getProgress(email, les.id)
          if (done) count++
        }
        setCompletedCount(count)

        // Fetch graded quizzes and check attempts
        const lessonIds = lessonsList.map((l: any) => l.id)
        if (lessonIds.length > 0) {
          const { data: quizzes } = await supabase
            .from('quizzes')
            .select('id, title, passing_score_percent, is_graded, is_final')
            .in('lesson_id', lessonIds)
            .eq('is_graded', true)

          if (quizzes && quizzes.length > 0) {
            setGradedQuizzes(quizzes)
            const passed = new Set<string>()
            for (const quiz of quizzes) {
              const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('passed, score_percent')
                .eq('user_id', email)
                .eq('quiz_id', quiz.id)
              const hasPassed = (attempts || []).some((a: any) =>
                a.passed || a.score_percent >= (quiz.passing_score_percent || 70)
              )
              if (hasPassed) passed.add(quiz.id)
            }
            setPassedQuizzes(passed)
          }
        }

        // Check existing certificate
        const { data: cert } = await supabase
          .from('course_completions')
          .select('certificate_url, completed_at')
          .eq('user_id', email)
          .eq('course_id', courseId)
          .maybeSingle()

        if (cert?.certificate_url) setCertStatus('issued')
      } catch (err) {
        console.error('Error loading final page:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, router])

  const allLessonsCompleted = completedCount === lessons.length && lessons.length > 0
  const allQuizzesPassed = gradedQuizzes.length === 0 || gradedQuizzes.every(q => passedQuizzes.has(q.id))
  const isEligible = allLessonsCompleted && allQuizzesPassed
  const overallProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  const handleClaimCertificate = async () => {
    setIssuing(true)
    setCertError('')
    try {
      const res = await fetch('/api/courses/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ courseId, userId })
      })
      const data = await res.json()
      if (data.success) {
        setCertStatus('issued')
      } else {
        setCertError(data.error || 'Could not issue certificate. Please try again.')
      }
    } catch {
      setCertError('Network error. Please try again.')
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-red-500/20 border-t-red-600 animate-spin" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading Graduation Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </Link>
        <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          Graduation Portal
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">

        {/* Hero Banner */}
        <div className={`rounded-3xl p-8 text-center space-y-3 border ${isEligible ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 text-white' : 'bg-white border-slate-200'}`}>
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${isEligible ? 'bg-white/20' : 'bg-slate-100'}`}>
            {isEligible
              ? <Trophy className="w-10 h-10 text-white" />
              : <GraduationCap className="w-10 h-10 text-slate-400" />
            }
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${isEligible ? 'text-white' : 'text-slate-900'}`}>
            {isEligible ? '🎉 Congratulations!' : 'Complete the Course to Graduate'}
          </h1>
          <p className={`text-sm leading-relaxed max-w-md mx-auto ${isEligible ? 'text-indigo-100' : 'text-slate-500'}`}>
            {isEligible
              ? `You've completed all lessons and passed all assessments in "${course?.title}". You're ready to claim your certificate!`
              : `Complete all lessons and pass all graded assessments to earn your "${course?.title}" certificate.`
            }
          </p>
          {isEligible && certStatus !== 'issued' && (
            <button
              onClick={handleClaimCertificate}
              disabled={issuing}
              className="inline-flex items-center gap-2 mt-4 bg-white text-indigo-700 font-black px-8 py-3.5 rounded-2xl text-sm transition hover:bg-indigo-50 disabled:opacity-60 cursor-pointer border-none shadow-lg"
            >
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              {issuing ? 'Issuing Certificate...' : 'Claim Certificate'}
            </button>
          )}
          {certStatus === 'issued' && (
            <div className="space-y-6 pt-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-550 text-emerald-300 font-extrabold px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Certificate Securely Issued
              </div>
              
              {/* Premium HTML Certificate Preview */}
              <div className="relative w-full aspect-[1.414/1] bg-[#fdfbf7] text-slate-800 border-[12px] border-indigo-950 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden text-center flex flex-col justify-between my-6 border-double select-none">
                {/* Gold Inner Border */}
                <div className="absolute inset-2 border-2 border-amber-600/35 rounded-xl pointer-events-none" />
                {/* Corner Ornaments */}
                <div className="absolute top-3 left-3 w-3 h-3 bg-amber-600/60" />
                <div className="absolute top-3 right-3 w-3 h-3 bg-amber-600/60" />
                <div className="absolute bottom-3 left-3 w-3 h-3 bg-amber-600/60" />
                <div className="absolute bottom-3 right-3 w-3 h-3 bg-amber-600/60" />
                
                {/* Header Brand */}
                <div className="space-y-1">
                  <p className="text-[9px] sm:text-xs font-black tracking-[0.2em] text-indigo-950 uppercase font-sans">
                    FarFindARole Learning Academy
                  </p>
                  <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 tracking-widest uppercase font-sans">
                    On Recommendation of the Automated Evaluation Board
                  </p>
                </div>
                
                {/* Main Title */}
                <div>
                  <h2 className="text-xl sm:text-3xl font-serif italic font-bold text-slate-900 tracking-wide">
                    Certificate of Mastery & Graduation
                  </h2>
                  <p className="text-[7px] sm:text-[9px] font-sans font-bold text-amber-700 tracking-widest uppercase mt-2">
                    This Honorable Credential is Proudly Presented To
                  </p>
                </div>
                
                {/* Graduate Name */}
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-4xl font-serif font-extrabold text-red-800 tracking-wide">
                    {userName}
                  </h3>
                  <div className="w-40 sm:w-60 h-[1px] bg-amber-600/40 mx-auto" />
                </div>
                
                {/* Body Text */}
                <p className="text-[8px] sm:text-xs text-slate-500 font-serif italic max-w-lg mx-auto leading-relaxed">
                  for successfully demonstrating expert proficiency, completing all required curriculum modules, passing all graded coding challenges, and achieving a passing grade on the final assessment for the course
                </p>
                
                {/* Course Title Capsule */}
                <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl inline-block mx-auto max-w-md">
                  <h4 className="text-[10px] sm:text-sm font-black text-indigo-950 tracking-wide uppercase font-sans">
                    {course?.title || 'Course'}
                  </h4>
                </div>
                
                {/* Signatures & Seal */}
                <div className="flex justify-between items-end pt-4 border-t border-slate-100/55">
                  {/* Left Signature */}
                  <div className="text-left space-y-1 w-1/3">
                    <p className="font-serif italic text-xs sm:text-base text-indigo-950 leading-none h-6 flex items-end justify-start pl-2">
                      FarFindARole Board
                    </p>
                    <div className="h-[1px] bg-slate-200 w-full" />
                    <p className="text-[7px] sm:text-[9px] font-bold text-slate-800">Academic Board Chair</p>
                    <p className="text-[6px] sm:text-[7px] text-slate-400 uppercase">Verified Curriculum Audit</p>
                  </div>
                  
                  {/* Center Gold Seal */}
                  <div className="relative flex flex-col items-center justify-center -mb-2">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-amber-600 bg-amber-50 flex items-center justify-center shadow-md">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-amber-600/50 flex flex-col items-center justify-center text-amber-700">
                        <span className="text-[5px] sm:text-[7px] font-black tracking-tighter">SECURE</span>
                        <Star className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 fill-amber-500 text-amber-500" />
                        <span className="text-[4px] sm:text-[5px] font-bold">VERIFIED</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Signature */}
                  <div className="text-right space-y-1 w-1/3">
                    <p className="font-serif italic text-xs sm:text-base text-indigo-950 leading-none h-6 flex items-end justify-end pr-2">
                      AI Agent Evaluator
                    </p>
                    <div className="h-[1px] bg-slate-200 w-full" />
                    <p className="text-[7px] sm:text-[9px] font-bold text-slate-800">Automated Grading System</p>
                    <p className="text-[6px] sm:text-[7px] text-slate-400 uppercase">Cryptographic Code Check</p>
                  </div>
                </div>
              </div>
              
              {/* Real PDF Download & Email Action */}
              <div className="pt-2">
                <a
                  href={`/api/courses/certificate/download?courseId=${courseId}&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(userName)}&sendEmail=true`}
                  download
                  onClick={() => {
                    alert(`Your certificate download has started, and a copy has been sent to your registered email: ${userId}`);
                  }}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-4 rounded-2xl text-sm transition shadow-lg cursor-pointer border-none decoration-none"
                >
                  <Download className="w-4 h-4 text-white" /> Download & Email Certificate (PDF)
                </a>
              </div>
            </div>
          )}
          {certError && (
            <p className="text-red-300 text-xs mt-2">{certError}</p>
          )}
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Your Progress
          </h2>

          {/* Overall progress bar */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
              <span>{completedCount} of {lessons.length} lessons completed</span>
              <span>{overallProgress}