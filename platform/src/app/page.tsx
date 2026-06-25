export const runtime = 'edge'

import { getCourses } from '@/lib/supabase'
import Link from 'next/link'
import { BookOpen, Calendar, Clock, BarChart3, ArrowRight, Zap, Target, Briefcase, GraduationCap, Users, ShieldCheck, Building } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const courses = await getCourses()

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 relative select-none">
      {/* Background Radial Light Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial from-brand-primary/5 via-slate-200/40 to-transparent pointer-events-none" />

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-primary/10 bg-brand-primary/5 text-brand-primary text-xs font-bold mb-6">
            <span className="px-1.5 py-0.5 rounded bg-brand-primary text-white font-extrabold text-[9px] tracking-widest uppercase">Enterprise E-Learning</span>
            Industry-Ready Skills • Cryptographic Verification
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-none">
            Learn Industry Skills.<br />
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-clip-text text-transparent">Launch Your Engineering Career.</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-500 mb-10 leading-relaxed">
            Acquire role-ready engineering expertise through interactive coding labs, structured lessons, and peer-reviewed projects. An enterprise-grade curriculum designed for students, professionals, colleges, and corporate workforces.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/courses" 
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/95 text-white font-bold px-8 py-4 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 text-sm select-none"
            >
              Explore Courses <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/workforce" 
              className="w-full sm:w-auto bg-white border border-slate-250 hover:border-brand-primary text-slate-700 font-bold px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 text-sm select-none"
            >
              Request Enterprise Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Feature stats */}
      <section className="py-8 bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-brand-primary">12+</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Curated Courses</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-secondary">100%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Hands-On Labs</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-primary">Verified</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Cryptographic Certs</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-secondary">Workforce</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Aligned Learning</p>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Featured Engineering Specializations</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Start with our most popular modules aligned to corporate standards</p>
          </div>
          <Link href="/courses" className="mt-4 md:mt-0 text-xs font-bold text-brand-secondary hover:text-brand-secondary/80 flex items-center gap-1 transition-colors select-none">
            View all courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses && courses.length > 0 ? (
            courses.slice(0, 3).map((course: any) => (
              <div 
                key={course.id}
                className="glass rounded-3xl overflow-hidden glass-hover flex flex-col border border-slate-200 bg-white"
              >
                {/* Image Placeholder */}
                <div className="h-44 relative overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-200">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  )}
                  
                  {/* Difficulty Tag */}
                  <span className="absolute top-4 left-4 text-[10px] font-black px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 capitalize select-none">
                    {course.difficulty}
                  </span>

                  {/* Certified Badge */}
                  <span className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded bg-brand-primary text-white uppercase tracking-wider select-none border border-white/20">
                    Certified
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  {/* Category */}
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1.5 block">
                    {course.category || 'Engineering'}
                  </span>
                  
                  <h3 className="text-base font-extrabold text-slate-900 mb-2 line-clamp-1">
                    {course.title}
                  </h3>
                  
                  <p className="text-xs text-slate-550 mb-6 line-clamp-3 flex-1 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase tracking-wide select-none">
                      Active
                    </span>
                    <Link 
                      href={`/courses/${course.id}`}
                      className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 select-none"
                    >
                      Explore Course <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl">
              <p className="text-slate-400 text-xs mb-4">No featured courses live yet.</p>
              <Link href="/admin" className="text-brand-secondary hover:underline font-bold text-xs select-none">
                Go to Admin Control to insert courses
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Structured Career Paths Section */}
      <section className="bg-slate-100/50 border-t border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Structured Career Pathways</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Accelerate your engineering competencies systematically using curriculum paths tailored to modern industry roles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Path 1 */}
            <div className="glass p-8 rounded-3xl flex flex-col bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary mb-6">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Frontend Specialist</h3>
              <p className="text-xs text-slate-550 mb-6 flex-1 leading-relaxed">
                Master modern user experience engineering, asynchronous browser rendering loops, React state models, and scalable performance optimizations.
              </p>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Includes 4 Courses • ~60 Hours</p>
              </div>
            </div>

            {/* Path 2 */}
            <div className="glass p-8 rounded-3xl flex flex-col bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-6">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Backend Engineer</h3>
              <p className="text-xs text-slate-550 mb-6 flex-1 leading-relaxed">
                Design normalized relational database schemas, secure transactions with Row Level Security, optimize index scans, and build high-performance APIs.
              </p>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Includes 5 Courses • ~80 Hours</p>
              </div>
            </div>

            {/* Path 3 */}
            <div className="glass p-8 rounded-3xl flex flex-col bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-550/20 flex items-center justify-center text-indigo-650 mb-6">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Fullstack Practitioner</h3>
              <p className="text-xs text-slate-550 mb-6 flex-1 leading-relaxed">
                Integrate client user interfaces with database engines, secure authentication keys, coordinate distributed services, and manage cloud deployments.
              </p>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Includes 8 Courses • ~120 Hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Learning Ecosystem Section */}
      <section className="border-t border-slate-200 py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary bg-brand-secondary/5 px-3 py-1 rounded-full border border-brand-secondary/10">Our Network</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3 mb-4">A Cohesive Enterprise Ecosystem</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Connecting students, educational institutions, and recruiters in a single unified technical training portal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Ecosystem 1 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-850">Students & Professionals</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Build a verified portfolio of skills, complete interactive labs, and earn cryptographically signed graduation credentials to prove competence.
              </p>
            </div>

            {/* Ecosystem 2 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-secondary text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-850">Universities & Colleges</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Integrate hands-on sandbox assignments directly with course syllabi, verify student skill growth, and streamline campus placements.
              </p>
            </div>

            {/* Ecosystem 3 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-850">Corporate Training & HR</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upskill your engineering staff, build custom enterprise pathways, monitor team capabilities, and track continuous professional education.
              </p>
            </div>

            {/* Ecosystem 4 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-850">Recruiters & Employers</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Access a curated pool of candidates with pre-assessed, verified coding scores and cryptographic certificates, eliminating hiring risk.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
