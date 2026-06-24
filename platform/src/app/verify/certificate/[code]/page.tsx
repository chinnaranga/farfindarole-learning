export const runtime = 'edge'

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Award, CheckCircle2, ShieldCheck, Download, ExternalLink,
  BookOpen, Star, FileCheck2, ArrowLeft, Loader2, Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function PublicVerifyCertificatePage() {
  const params = useParams()
  const code = params.code as string

  const [loading, setLoading] = useState(true)
  const [cert, setCert] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function verifyCredential() {
      try {
        setLoading(true)
        setError('')

        if (!code) {
          setError('Verification code is missing.')
          setLoading(false)
          return
        }

        // 1. Fetch certificate from database
        const { data: certData, error: certErr } = await supabase
          .from('certificates')
          .select('*')
          .eq('verification_code', code)
          .maybeSingle()

        if (certErr) {
          console.error('[VERIFY] DB Error:', certErr)
          setError('Database error during credential lookup.')
          setLoading(false)
          return
        }

        if (!certData) {
          setError('Invalid credential code. This certificate cannot be verified or does not exist.')
          setLoading(false)
          return
        }

        setCert(certData)

        // 2. Fetch course details
        const { data: courseData } = await supabase
          .from('courses')
          .select('title, category, difficulty, duration_hours')
          .eq('id', certData.course_id)
          .maybeSingle()

        setCourse(courseData)

        // 3. Resolve student name
        let resolvedName = ''
        
        // Try to look up profile using user_id if it's a UUID (unlikely since cert table user_id stores email)
        // If it's an email, we can try querying profiles if there is a match (though profiles are UUID-keyed)
        // Let's try to get profile by matching the email to the user meta if possible, or fallback
        // The most reliable fallback is to capitalize their email prefix
        if (!resolvedName) {
          const emailPrefix = certData.user_id.split('@')[0]
          resolvedName = emailPrefix
            .split(/[-_.]/)
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
        
        setStudentName(resolvedName)

      } catch (err) {
        console.error('[VERIFY] Catch Error:', err)
        setError('An unexpected error occurred during verification.')
      } finally {
        setLoading(false)
      }
    }

    verifyCredential()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-indigo-650 animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Verifying Cryptographic Credential...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">Verification Failed</h1>
        <p className="text-sm text-slate-500 max-w-md mb-6">{error}</p>
        <Link href="/" className="px-6 py-3 bg-red-600 hover:bg-red-750 text-white font-extrabold text-xs rounded-xl transition uppercase tracking-wider">
          Return to Platform
        </Link>
      </div>
    )
  }

  const issuedDate = cert?.issued_at ? new Date(cert.issued_at) : new Date()
  const formattedDate = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const downloadUrl = `/api/courses/certificate/download?code=${code}&name=${encodeURIComponent(studentName)}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Verification Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              FAR
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Credential Verification</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Secure Recruiter Portal</p>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" /> Cryptographically Verified
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Certificate HTML Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Preview</span>
                <span className="text-[10px] font-mono text-indigo-600 font-bold">A4 LANDSCAPE RATIO</span>
              </div>
              
              {/* HTML Certificate */}
              <div className="relative w-full aspect-[1.414/1] bg-[#fdfbf7] text-slate-800 border-[8px] sm:border-[12px] border-indigo-950 rounded-2xl p-4 sm:p-8 shadow-inner text-center flex flex-col justify-between border-double select-none">
                <div className="absolute inset-1.5 border border-amber-600/30 rounded-lg pointer-events-none" />
                <div className="absolute top-2.5 left-2.5 w-2 h-2 bg-amber-600/60" />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-600/60" />
                <div className="absolute bottom-2.5 left-2.5 w-2 h-2 bg-amber-600/60" />
                <div className="absolute bottom-2.5 right-2.5 w-2 h-2 bg-amber-600/60" />
                
                <div className="space-y-0.5">
                  <p className="text-[7px] sm:text-[10px] font-black tracking-[0.2em] text-indigo-950 uppercase font-sans">
                    FarFindARole Learning Academy
                  </p>
                  <p className="text-[5px] sm:text-[8px] font-bold text-slate-450 tracking-widest uppercase font-sans">
                    On Recommendation of the Automated Evaluation Board
                  </p>
                </div>
                
                <div>
                  <h2 className="text-sm sm:text-2xl font-serif italic font-bold text-slate-900 tracking-wide">
                    Certificate of Mastery & Graduation
                  </h2>
                  <p className="text-[5px] sm:text-[8px] font-sans font-bold text-amber-700 tracking-widest uppercase mt-1">
                    This Honorable Credential is Proudly Presented To
                  </p>
                </div>
                
                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-3xl font-serif font-extrabold text-red-800 tracking-wide">
                    {studentName}
                  </h3>
                  <div className="w-32 sm:w-52 h-[0.5px] bg-amber-600/30 mx-auto" />
                </div>
                
                <p className="text-[6px] sm:text-[10px] text-slate-500 font-serif italic max-w-md mx-auto leading-relaxed px-2">
                  for successfully demonstrating expert proficiency, completing all required curriculum modules, passing all graded coding challenges, and achieving a passing grade on the final assessment for the course
                </p>
                
                <div className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg inline-block mx-auto max-w-xs">
                  <h4 className="text-[7px] sm:text-xs font-black text-indigo-950 tracking-wide uppercase font-sans">
                    {course?.title || 'Course'}
                  </h4>
                </div>
                
                <div className="flex justify-between items-end pt-2 border-t border-slate-100/50">
                  <div className="text-left space-y-0.5 w-1/3">
                    <p className="font-serif italic text-[8px] sm:text-xs text-indigo-950 leading-none h-4 flex items-end justify-start pl-1">
                      FarFindARole Board
                    </p>
                    <div className="h-[0.5px] bg-slate-200 w-full" />
                    <p className="text-[5px] sm:text-[7px] font-bold text-slate-800">Academic Board Chair</p>
                  </div>
                  
                  <div className="relative flex flex-col items-center justify-center -mb-1">
                    <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full border border-amber-600 bg-amber-50 flex items-center justify-center">
                      <Star className="w-2 h-2 text-amber-600 fill-amber-500" />
                    </div>
                  </div>
                  
                  <div className="text-right space-y-0.5 w-1/3">
                    <p className="font-serif italic text-[8px] sm:text-xs text-indigo-950 leading-none h-4 flex items-end justify-end pr-1">
                      AI Agent Evaluator
                    </p>
                    <div className="h-[0.5px] bg-slate-200 w-full" />
                    <p className="text-[5px] sm:text-[7px] font-bold text-slate-800">Automated System</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Credential Details & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Credential Data Sheet */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" /> Certificate Metadata
              </h2>
              
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 font-medium">Graduate Student</span>
                  <span className="font-extrabold text-slate-800 text-right">{studentName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 font-medium">Course Completed</span>
                  <span className="font-extrabold text-slate-800 text-right max-w-[200px]">{course?.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 font-medium">Issue Date</span>
                  <span className="font-extrabold text-slate-800 text-right">{formattedDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 font-medium">Credential Code</span>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 font-medium">Issuing Body</span>
                  <span className="font-extrabold text-slate-800 text-right">FarFindARole Learn Ltd.</span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span className="text-slate-500 font-medium">Course Difficulty</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded capitalize">{course?.difficulty || 'Beginner'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <a
                  href={downloadUrl}
                  download
                  className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-md border-none cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Official PDF Certificate
                </a>
                
                <Link
                  href="/"
                  className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition border border-slate-200"
                >
                  Visit FarFindARole Academy
                </Link>
              </div>
            </div>

            {/* Platform Credibility Card */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-indigo-100 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">About This Credential</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-200">
                FarFindARole certificates are only awarded upon absolute mastery. The recipient completed all syllabus modules, solved interactive coding playgrounds locally with zero fallbacks, and passed comprehensive assessment checkpoints and sandbox coding exams.
              </p>
              <div className="flex items-center gap-3 text-2xs font-bold text-amber-300 bg-white/5 p-3 rounded-xl border border-white/5">
                <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Estimated workload: {course?.duration_hours || 5} hours of active coding and theory checkups.</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
