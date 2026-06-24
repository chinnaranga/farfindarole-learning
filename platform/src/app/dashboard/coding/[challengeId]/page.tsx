export const runtime = 'edge';

'use client';

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
                      (consoleOutput?.results && consoleOutput.results.map(r => r.error).filter(Boolean).join('
'));

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
        <div className="w-full md:w-[40