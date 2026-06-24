'use client';

export const runtime = 'edge'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CodeEditor from '@/components/CodeEditor';
import { 
  Play, 
  Send, 
  Cpu, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  Trophy, 
  ArrowLeft,
  ChevronRight,
  Flame,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'project';
  category: string;
  default_code: Record<string, string>;
  points: number;
  time_limit_ms: number;
}

interface TestResult {
  index: number;
  output: any;
  error: string | null;
  duration: number;
}

export default function ChallengeWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId as string;

  const [user, setUser] = useState<any>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  // Workspace Settings
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('light');
  const [code, setCode] = useState('');
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});

  // Tabs for Left Panel
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'hints' | 'ai'>('description');

  // Console / Test Results
  const [outputTab, setOutputTab] = useState<'console' | 'testcases'>('console');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<{
    success: boolean;
    status?: string;
    passedCases?: number;
    totalCases?: number;
    runtimeMs?: number;
    compileError?: string;
    logs?: string[];
    results?: TestResult[];
    earnedBadges?: string[];
  } | null>(null);

  // AI Mentor Chat State
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: "Hello! I am your AI Mentor. I won't give you the direct solution, but I can explain syntax errors, logic bugs, or offer structural hints. How can I help you today?" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
        } else {
          // Redirect to login if user not authenticated
          router.push('/login');
          return;
        }

        const { data: challengeData, error } = await supabase
          .from('coding_challenges')
          .select('*')
          .eq('id', challengeId)
          .single();

        if (error || !challengeData) {
          console.error('Failed to load challenge:', error);
          router.push('/dashboard/coding');
          return;
        }

        setChallenge(challengeData);

        // Prepopulate default codes for all languages
        const defCodes = challengeData.default_code || {};
        setCodeMap(defCodes);
        
        // Select first available local language (javascript or python)
        const availableLangs = Object.keys(defCodes).filter(lang => lang === 'javascript' || lang === 'python');
        const firstLang = availableLangs.includes('javascript') ? 'javascript' : (availableLangs[0] || 'javascript');
        setLanguage(firstLang);
        setCode(defCodes[firstLang] || '');
      } catch (err) {
        console.error('Workspace init error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [challengeId]);

  // Sync editor code state when user changes language
  const handleLanguageChange = (newLang: string) => {
    // Save current code
    setCodeMap(prev => ({ ...prev, [language]: code }));
    // Load or generate fallback code for new language
    setLanguage(newLang);
    setCode(codeMap[newLang] || challenge?.default_code?.[newLang] || '');
  };

  // Reset editor value back to initial boilerplate stub
  const handleResetCode = () => {
    if (confirm('Are you sure you want to reset your editor code to the boilerplate template?')) {
      const originalStub = challenge?.default_code?.[language] || '';
      setCode(originalStub);
      setCodeMap(prev => ({ ...prev, [language]: originalStub }));
    }
  };

  // Execute Code (Run Tests)
  const handleRunCode = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setOutputTab('console');
    setConsoleOutput(null);

    try {
      const response = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          language,
          code
        })
      });

      const data = await response.json();
      setConsoleOutput(data);
    } catch (err: any) {
      setConsoleOutput({
        success: false,
        compileError: err.message || 'Failed to execute run suite'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code for evaluation
  const handleSubmitCode = async () => {
    if (!challenge || !user) return;
    setIsSubmitting(true);
    setOutputTab('console');
    setConsoleOutput(null);

    try {
      const response = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.email
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          language,
          code,
          userId: user.email
        })
      });

      const data = await response.json();
      setConsoleOutput(data);
    } catch (err: any) {
      setConsoleOutput({
        success: false,
        status: 'failed',
        compileError: err.message || 'Failed to submit code suite'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Query AI Mentor
  const handleSendAiMessage = async (customText?: string) => {
    const text = customText || aiMessage;
    if (!text.trim() || !challenge) return;

    const userMsg = text.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    if (!customText) setAiMessage('');
    setIsAiLoading(true);

    // If active console error is present, pass it to AI context
    const activeErr = consoleOutput?.compileError || 
                      (consoleOutput?.results && consoleOutput.results.map(r => r.error).filter(Boolean).join('\n'));

    try {
      const response = await fetch('/api/coding/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          language,
          code,
          errorMsg: activeErr || null,
          userMessage: userMsg
        })
      });

      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.feedback }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I failed to connect to the mentoring server. Try again in a second!' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Mounting Workspace Panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-805 flex flex-col h-[calc(100vh-64px)]">
      
      {/* Top control bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs shrink-0 select-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/coding')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer border-none"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Arena
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <div>
            <h2 className="text-sm font-black text-slate-900">{challenge?.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold outline-none cursor-pointer"
          >
            {challenge?.default_code && Object.keys(challenge.default_code)
              .filter(lang => lang === 'javascript' || lang === 'python')
              .map(lang => (
                <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
              ))}
          </select>

          {/* Theme Selector */}
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition"
          >
            Theme: {theme === 'vs-dark' ? 'Dark' : 'Light'}
          </button>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            title="Reset code boilerplate"
            className="p-1.5 rounded-lg bg-white hover:bg-red-50 hover:text-red-650 border border-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Side: Description / Mentor Panels */}
        <div className="w-full md:w-[40%] border-r border-slate-200 flex flex-col h-full bg-white">
          {/* Tabs */}
          <div className="flex bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider shrink-0">
            <button 
              onClick={() => setActiveLeftTab('description')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeLeftTab === 'description' ? 'border-indigo-600 text-slate-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Description</span>
            </button>
            <button 
              onClick={() => setActiveLeftTab('hints')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeLeftTab === 'hints' ? 'border-indigo-600 text-slate-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Hints</span>
            </button>
            <button 
              onClick={() => setActiveLeftTab('ai')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeLeftTab === 'ai' ? 'border-indigo-600 text-slate-900 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Mentor</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 text-slate-700 text-sm leading-relaxed space-y-4">
            {activeLeftTab === 'description' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider ${
                    challenge?.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25' :
                    challenge?.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/25' :
                    'bg-rose-500/10 text-rose-600 border border-rose-500/25'
                  }`}>
                    {challenge?.difficulty}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                    <Trophy className="w-4 h-4" /> {challenge?.points} XP Points
                  </div>
                </div>

                {/* Problem Statement Rendered */}
                <div className="prose max-w-none text-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Problem Statement</h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-700">
                    {challenge?.description}
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === 'hints' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" /> Learning Hints
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-xs text-slate-600">Hint 1: Think about matching values using a hash map for linear lookup speeds.</p>
                  <p className="text-xs text-slate-600">Hint 2: Subtraction is key. If you subtract current value from the target sum, is that remainder already tracked in your dictionary?</p>
                </div>
              </div>
            )}

            {activeLeftTab === 'ai' && (
              <div className="flex flex-col h-full space-y-4 min-h-0">
                {/* Chat Message Box */}
                <div className="flex-1 overflow-y-auto space-y-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-0">
                  {chatHistory.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${
                        chat.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${
                        chat.sender === 'user' 
                          ? 'bg-indigo-650 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{chat.text}</p>
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex gap-3 items-center text-xs text-slate-500">
                      <div className="w-3.5 h-3.5 border border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                      <span>AI Mentor is studying your code...</span>
                    </div>
                  )}
                </div>

                {/* Quick actions prompt buttons */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <button 
                    onClick={() => handleSendAiMessage("Explain the logic bug in my current approach.")}
                    disabled={isAiLoading}
                    className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition font-medium cursor-pointer"
                  >
                    🔍 Find Bugs
                  </button>
                  <button 
                    onClick={() => handleSendAiMessage("Suggest complexity optimizations for my loops.")}
                    disabled={isAiLoading}
                    className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition font-medium cursor-pointer"
                  >
                    ⚡ Optimize Loop
                  </button>
                </div>

                {/* Chat Send Area */}
                <div className="flex gap-2 shrink-0">
                  <input 
                    type="text" 
                    placeholder="Ask AI Mentor for hints..."
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                    disabled={isAiLoading}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                  <button 
                    onClick={() => handleSendAiMessage()}
                    disabled={isAiLoading || !aiMessage.trim()}
                    className="px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition border-none cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Monaco Editor & Output Console split */}
        <div className="flex-1 flex flex-col h-full min-h-0 bg-white">
          
          {/* Editor Panel (Top half) */}
          <div className="flex-1 min-h-[50%] p-4 relative">
            <CodeEditor 
              value={code} 
              language={language} 
              theme={theme}
              onChange={(val) => setCode(val || '')}
            />
          </div>

          {/* Console / Output Panel (Bottom half) */}
          <div className="h-[40%] min-h-[150px] border-t border-slate-200 flex flex-col overflow-hidden bg-white">
            {/* Tabs for Console/Output */}
            <div className="flex bg-slate-50 border-b border-slate-200 shrink-0 select-none text-[10px] font-bold uppercase tracking-wider">
              <button 
                onClick={() => setOutputTab('console')}
                className={`px-5 py-2.5 border-b-2 transition ${outputTab === 'console' ? 'border-indigo-650 text-slate-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Test Results
              </button>
            </div>

            {/* Console Output Body */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed text-slate-700 min-h-0 bg-white">
              {isRunning && (
                <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                  <span>Running test cases in isolated sandbox...</span>
                </div>
              )}
              {isSubmitting && (
                <div className="flex items-center gap-2 text-indigo-650 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                  <span>Submitting to evaluation engine & checking plagiarism score...</span>
                </div>
              )}

              {!isRunning && !isSubmitting && !consoleOutput && (
                <div className="text-slate-400 flex flex-col items-center justify-center py-10">
                  <Cpu className="w-8 h-8 text-slate-300 stroke-1 mb-2 animate-bounce" />
                  <p>Run your code to see compilation logs and test outputs here.</p>
                </div>
              )}

              {!isRunning && !isSubmitting && consoleOutput && (
                <div className="space-y-4">
                  
                  {/* Status Indicator */}
                  {consoleOutput.status && (
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      consoleOutput.status === 'accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      consoleOutput.status === 'plagiarized' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {consoleOutput.status === 'accepted' ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-extrabold text-sm uppercase tracking-wide">Accepted submission</span>
                          </>
                        ) : consoleOutput.status === 'plagiarized' ? (
                          <>
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-extrabold text-sm uppercase tracking-wide">Similarity check flagged - Plagiarized</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-extrabold text-sm uppercase tracking-wide">Rejected - {consoleOutput.status.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                      <span className="font-bold text-[10px] uppercase">
                        {consoleOutput.passedCases}/{consoleOutput.totalCases} cases passed ({consoleOutput.runtimeMs}ms)
                      </span>
                    </div>
                  )}

                  {/* Milestones Award Alert */}
                  {consoleOutput.earnedBadges && consoleOutput.earnedBadges.length > 0 && (
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-indigo-700">
                      <Award className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-black text-xs">Milestones unlocked!</p>
                        <p className="text-[10px] text-indigo-500 font-semibold uppercase">
                          Earned badge: {consoleOutput.earnedBadges.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Compile/Syntax Errors */}
                  {consoleOutput.compileError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                      <h4 className="font-bold text-xs mb-1 uppercase tracking-wider">Compilation/Runtime Logs:</h4>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-rose-800">{consoleOutput.compileError}</pre>
                    </div>
                  )}

                  {/* Test case validation results list */}
                  {consoleOutput.results && consoleOutput.results.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-2">Test Case Splits:</h4>
                      {consoleOutput.results.map((res, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            res.error ? 'bg-rose-50 border-rose-250 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${res.error ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                            <span className="font-bold text-xs">Test Case #{i + 1}</span>
                          </div>
                          <div className="text-right font-mono text-[10px]">
                            {res.error ? (
                              <span className="text-rose-600">{res.error}</span>
                            ) : (
                              <span>Pass ({res.duration}ms)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User Logs */}
                  {consoleOutput.logs && consoleOutput.logs.length > 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-650">
                      <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Console Output logs:</h4>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-750">{consoleOutput.logs.join('\n')}</pre>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Run / Submit Action Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 disabled:text-slate-400 font-bold transition flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Play className="w-4 h-4 fill-current" /> Run tests
              </button>
              <button 
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-750 disabled:from-slate-100 disabled:to-slate-100 text-white disabled:text-slate-400 font-bold transition shadow-md hover:scale-[1.01] flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Send className="w-4 h-4" /> Submit code
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
