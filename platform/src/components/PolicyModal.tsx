'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ShieldCheck, Scroll, FileText, Check } from 'lucide-react'
import { POLICIES, PolicyContent } from '@/lib/policies'

interface PolicyModalProps {
  isOpen: boolean
  onClose?: () => void
  onAccept?: () => void
  onDecline?: () => void
  policyType: 'general' | 'pricing' | 'subscription' | 'course'
  showAcceptDecline?: boolean
  isUndismissible?: boolean
}

export default function PolicyModal({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  policyType,
  showAcceptDecline = true,
  isUndismissible = false
}: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [termsRead, setTermsRead] = useState(false)
  const [privacyRead, setPrivacyRead] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const policyData = POLICIES[policyType] || POLICIES.general
  const currentContent: PolicyContent = activeTab === 'terms' ? policyData.terms : policyData.privacy

  // Reset scroll state on modal open
  useEffect(() => {
    if (isOpen) {
      setTermsRead(false)
      setPrivacyRead(false)
      setActiveTab('terms')
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    }
  }, [isOpen])

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activeTab])

  // Check scrollability (e.g. if content fits without scrollbar, mark as read)
  useEffect(() => {
    if (!isOpen) return

    const checkScrollability = () => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight } = contentRef.current
        if (scrollHeight <= clientHeight + 5) {
          if (activeTab === 'terms') {
            setTermsRead(true)
          } else {
            setPrivacyRead(true)
          }
        }
      }
    }

    const timer = setTimeout(checkScrollability, 150)
    return () => clearTimeout(timer)
  }, [activeTab, isOpen])

  const handleScroll = () => {
    if (!contentRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current
    
    if (scrollHeight - scrollTop - clientHeight < 24) {
      if (activeTab === 'terms') {
        setTermsRead(true)
      } else {
        setPrivacyRead(true)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] relative animate-scaleUp">
        
        {/* Modal Header */}
        <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-200 flex items-center justify-center text-red-650">
              {activeTab === 'terms' ? <Scroll className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{currentContent.title}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Policy version {POLICIES[policyType] ? 'v1.0' : 'v1.0'} &bull; Updated {currentContent.lastUpdated}</p>
            </div>
          </div>
          
          {!isUndismissible && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200/50 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Toggle Controls */}
        <div className="flex border-b border-slate-100 p-3 bg-white gap-2">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 select-none cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms &amp; Conditions
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 select-none cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Privacy Policy
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[50vh] scrollbar-thin scroll-smooth"
        >
          {currentContent.sections.map((sect, i) => (
            <div key={i} className="space-y-2">
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">{sect.heading}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{sect.content}</p>
            </div>
          ))}
          
          {/* Scroll Completion Helper */}
          {activeTab === 'terms' && !termsRead && (
            <div className="text-center py-2 text-[10px] text-slate-400 font-bold border-t border-dashed border-slate-100 animate-pulse mt-4">
              Scroll down to read and verify all Terms &amp; Conditions...
            </div>
          )}
          {activeTab === 'privacy' && !privacyRead && (
            <div className="text-center py-2 text-[10px] text-slate-400 font-bold border-t border-dashed border-slate-100 animate-pulse mt-4">
              Scroll down to read and verify all Privacy Guidelines...
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {showAcceptDecline && (
          <div className="border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
            {/* Helper Text */}
            <div className="text-[10.5px] text-slate-500 font-bold text-center sm:text-left">
              {!termsRead && activeTab === 'terms' && (
                <span>Scroll terms to bottom to verify.</span>
              )}
              {termsRead && !privacyRead && activeTab === 'terms' && (
                <span className="text-indigo-650 animate-pulse">✓ Terms verified. Select the Privacy Policy tab next.</span>
              )}
              {!privacyRead && activeTab === 'privacy' && (
                <span>Scroll privacy policy to bottom to verify.</span>
              )}
              {!termsRead && privacyRead && activeTab === 'privacy' && (
                <span className="text-indigo-650 animate-pulse">✓ Privacy verified. Select the Terms &amp; Conditions tab next.</span>
              )}
              {!termsRead && privacyRead && activeTab === 'terms' && (
                <span>Scroll terms to bottom to verify.</span>
              )}
              {termsRead && privacyRead && (
                <span className="text-emerald-600">✓ All guidelines reviewed. You may now continue.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onDecline && (
                <button
                  onClick={onDecline}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-650 transition select-none cursor-pointer"
                >
                  Decline
                </button>
              )}
              {onAccept && (
                <button
                  onClick={onAccept}
                  disabled={!(termsRead && privacyRead)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 select-none cursor-pointer ${
                    (termsRead && privacyRead)
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent hover:scale-[1.01]'
                      : 'bg-slate-200 border border-transparent text-slate-400 cursor-not-allowed opacity-80'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> Accept &amp; Continue
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
