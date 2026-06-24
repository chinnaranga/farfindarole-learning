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
            <p className="text-3xl font-extrabold text-red-650">100%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Project-Based</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">Verifiable</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Certificates</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-red-655">Subscribed</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">Career Portals</p>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Featured Engineering Tracks</h2>
            <p className="text-slate-555 text-xs sm:text-sm">Start with our most popular modules curated by industry experts</p>
          </div>
          <Link href="/courses" className="mt-4 md:mt-0 text-xs font-bold text-red-650 hover:text-red-750 flex items-center gap-1 transition-colors select-none">
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

                  {/* PRO Badge */}
                  <span className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded bg-gradient-to-r from-red-500 to-amber-500 text-white uppercase tracking-wider select-none">
                    PRO
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  {/* Category */}
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1.5 block">
                    {course.category || 'Engineering'}
                  </span>
                  
                  <h3 className="text-base font-extrabold text-slate-900 mb-2 line-clamp-1">
                    {course.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mb-6 line-clamp-3 flex-1 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase tracking-wide select-none">
                      Active
                    </span>
                    <Link 
                      href={`/courses/${course.id}`}
                      className="text-xs font-bold text-red-600 hover:text-red-750 flex items-center gap-1 select-none"
                    >
                      Start Learning <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl">
              <p className="text-slate-400 text-xs mb-4">No featured courses live yet.</p>
              <Link href="/admin" className="text-red-600 hover:underline font-bold text-xs select-none">
                Go to Admin Control to insert courses
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="bg-slate-100/50 border-t border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Structured Career Pathways</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Accelerate your expertise systematically using structured study tracks designed for developer role readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Path 1 */}
            <div className="glass p-8 rounded-3xl flex flex-col bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mb-6">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Frontend Developer</h3>
              <p className="text-xs text-slate-550 mb-6 flex-1 leading-relaxed">
                Master HTML, CSS, client-side JS syntax, and React state hooks. Construct responsive layouts and scale page rendering performance metrics.
              </p>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Includes 4 Courses • ~60 Hours</p>
              </div>
            </div>

            {/* Path 2 */}
            <div className="glass p-8 rounded-3xl flex flex-col bg-white border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-6">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Backend Engineer</h3>
              <p className="text-xs text-slate-550 mb-6 flex-1 leading-relaxed">
                Dive deep into database schemas, parameterized SQL queries, performance indexing scans, Row Level Security rules, APIs, and scaling layers.
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
                Combine client user interfaces with backend databases, authentication keys, distributed system load balancing, and Vercel deployments.
              </p>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Includes 8 Courses • ~120 Hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
