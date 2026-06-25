'use client'

import { useState } from 'react'
import { Building, GraduationCap, Users, CheckCircle2, BarChart3, Lock, Sparkles, Globe, Award, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function WorkforcePage() {
  // Demo request form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('corporate')
  const [teamSize, setTeamSize] = useState('11-50')
  const [needs, setNeeds] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmitDemo = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic Validation
    if (!name.trim() || !email.trim() || !orgName.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid work email address.')
      return
    }

    setSubmitting(true)

    // Simulate API request submission
    setTimeout(() => {
      setSubmitting(false)
      setSuccess(true)
    }, 1500)
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 select-none">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-radial from-brand-primary/5 via-slate-200/20 to-transparent pointer-events-none" />

      {/* Header Deck */}
      <section className="relative py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <Globe className="w-3.5 h-3.5" /> Institutional Licensing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Workforce Solutions & Enterprise Partnerships
          </h1>
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-550 leading-relaxed">
            Equip your students, developers, and engineers with industry-aligned skills. FarFindARole Learn offers scalable corporate training portals and university licensing plans with cryptographic certification and skill analytics.
          </p>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Value propositions */}
        <div className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Curriculum Capabilities Designed to Scale
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Unlock our complete catalog of interactive coding environments, system design sandboxes, and AI content assistants for your entire organization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Value 1 */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Unified Skill Analytics</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Track curriculum milestones, coding arena statistics, and student readiness scores through an administrative console.
              </p>
            </div>

            {/* Value 2 */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Verified Credentials</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Students earn cryptographically verified graduation certificates linkable directly to LinkedIn and resume verification databases.
              </p>
            </div>

            {/* Value 3 */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-650">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Perpetual Site Licenses</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Deploy student seats or corporate developer accounts with simple, fixed annual site licenses. No credit cards or complex upgrades.
              </p>
            </div>

            {/* Value 4 */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-655">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Direct Recruiter Pipeline</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Unlock direct corporate recruiter dashboard connections, enabling placement partners to discover top-ranking students.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-white relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 rounded-full blur-[30px]" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 fill-current" />
              <span className="text-xs font-black uppercase tracking-widest text-brand-secondary">AI-Powered Outline Generators</span>
            </div>
            <h3 className="text-sm font-black">AI Study Outline Integration</h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              Corporate HR managers can input specific job descriptions or tech stacks, and our built-in AI will instantly configure matching curriculum pathways for employees.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Contact Demo Form */}
        <div className="relative">
          <div className="glass rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl sticky top-24">
            {success ? (
              <div className="text-center py-12 space-y-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-655 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900">Demo Request Received</h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Thank you! An enterprise relations advisor will contact you at <strong className="text-brand-primary">{email}</strong> within 24 hours to schedule your consultation and configure your organizational sandbox.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSuccess(false)
                    setName('')
                    setEmail('')
                    setOrgName('')
                    setNeeds('')
                  }}
                  className="bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer shadow-sm uppercase tracking-wider"
                >
                  Request Another Demo
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitDemo} className="space-y-5">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-slate-900">Request an Institutional Demo</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Fill out the form below, and our solutions architects will design a custom learning portal for your team or campus.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-650 font-bold text-[11px] rounded-xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Contact Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Contact Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                      required
                    />
                  </div>

                  {/* Work Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Work Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      placeholder="e.g. jane@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                      required
                    />
                  </div>

                  {/* Organization Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Organization / Campus <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                      required
                    />
                  </div>

                  {/* Grid fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Organization Type */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Org Type</label>
                      <select
                        value={orgType}
                        onChange={(e) => setOrgType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition cursor-pointer"
                      >
                        <option value="corporate">Corporation / Enterprise</option>
                        <option value="university">University / College</option>
                        <option value="training">Training Provider</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Team Size */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Seats Required</label>
                      <select
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition cursor-pointer"
                      >
                        <option value="1-10">1 - 10 seats</option>
                        <option value="11-50">11 - 50 seats</option>
                        <option value="51-200">51 - 200 seats</option>
                        <option value="200+">200+ seats</option>
                      </select>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Training Needs (Optional)</label>
                    <textarea
                      placeholder="e.g. Tell us about your syllabus integration goals or engineering stack upskilling needs..."
                      value={needs}
                      onChange={(e) => setNeeds(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-bold py-3.5 rounded-xl transition shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer select-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      Request Consultation <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
