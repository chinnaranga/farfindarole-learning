export const runtime = 'edge';
export const runtime = 'edge';

import { getCourses } from '@/lib/supabase'
import Link from 'next/link'
import { BookOpen, Calendar, Clock, BarChart3, ArrowRight, Zap, Target, Briefcase } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const courses = await getCourses()

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 relative select-none">
      {/* Background Radial Light Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial from-red-550/5 via-slate-200/40 to-transparent pointer-events-none" />

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-650 text-xs font-bold mb-6">
            <span className="px-1.5 py-0.5 rounded bg-red-650 text-white font-extrabold text-[9px] tracking-widest uppercase">E-Learning Studio</span>
            Prove Mastery. Get Hired in Engineering.
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-none">
            Learn Cutting-Edge Skills.<br />
            <span className="bg-gradient-to-r from-red-600 via-amber-650 to-red-700 bg-clip-text text-transparent">Get Hired in Tech.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-500 mb-10 leading-relaxed">
            Acquire role-ready engineering expertise through hands-on labs, guided lessons, and peer-reviewed projects. Completely structured, offline-capable, and self-paced.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/courses" 
              className="w-full sm:w-auto bg-red-600 hover:bg-red-750 text-white font-bold px-8 py-4 rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 text-sm select-none"
            >
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto bg-white border border-slate-250 hover:border-slate-350 text-slate-700 font-bold px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 text-sm select-none"
            >
              View Membership Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Feature stats */}
      <section className="py-8 bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-slate-900">12+</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Premium Courses</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-red-650">100