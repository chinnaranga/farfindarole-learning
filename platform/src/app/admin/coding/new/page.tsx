'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Cpu, 
  Save, 
  HelpCircle,
  Code
} from 'lucide-react';

interface TestCaseStub {
  input_args: string; // JSON String representing arguments array
  expected_output: string; // JSON String representing output
  is_hidden: boolean;
  display_order: number;
}

export default function AdminCreateChallengePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('DSA');
  const [tier, setTier] = useState('Free');
  const [points, setPoints] = useState(50);
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitKb, setMemoryLimitKb] = useState(64000);

  // Code Templates
  const [jsStub, setJsStub] = useState('function solution() {\n  // Write your code here\n}');
  const [pyStub, setPyStub] = useState('def solution():\n    # Write your code here\n    pass');
  const [jsSol, setJsSol] = useState('function solution() {\n  return true;\n}');
  const [pySol, setPySol] = useState('def solution():\n    return True');

  // Test Cases
  const [testCases, setTestCases] = useState<TestCaseStub[]>([
    { input_args: '[]', expected_output: 'true', is_hidden: false, display_order: 1 }
  ]);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== 'admin@farfindarole.com') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user?.id)
            .maybeSingle();

          if (profile?.role !== 'admin') {
            router.push('/dashboard');
            return;
          }
        }
        setIsAdmin(true);
      } catch (err) {
        console.error('Authorization failed:', err);
      } finally {
        setLoading(false);
      }
    }
    verifyAdmin();
  }, []);

  const handleAddTestCase = () => {
    setTestCases(prev => [
      ...prev,
      { 
        input_args: '[]', 
        expected_output: 'true', 
        is_hidden: false, 
        display_order: prev.length + 1 
      }
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(prev => prev.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: keyof TestCaseStub, value: any) => {
    setTestCases(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required!');
      return;
    }

    try {
      // 1. Validate JSON stubs and inputs before saving
      let parsedTestCases: any[] = [];
      try {
        parsedTestCases = testCases.map((tc, idx) => {
          const args = JSON.parse(tc.input_args);
          if (!Array.isArray(args)) {
            throw new Error(`Test Case #${idx + 1} input arguments must be a JSON array (e.g., [1, 2]).`);
          }
          return {
            input_args: args,
            expected_output: JSON.parse(tc.expected_output),
            is_hidden: tc.is_hidden,
            display_order: tc.display_order
          };
        });
      } catch (err: any) {
        alert('Invalid Test Case format. Please ensure input arguments are formatted as valid JSON arrays (e.g. [[1,2], 3]) and outputs are valid JSON values.\n\nError: ' + err.message);
        return;
      }

      // Assemble stubs JSON
      const defaultCodeJson = {
        javascript: jsStub,
        python: pyStub
      };
      
      const solutionCodeJson = {
        javascript: jsSol,
        python: pySol
      };

      // 2. Insert challenge metadata
      const { data: challenge, error: challengeErr } = await supabase
        .from('coding_challenges')
        .insert({
          title,
          description,
          difficulty,
          category,
          tier,
          points: Number(points),
          time_limit_ms: Number(timeLimitMs),
          memory_limit_kb: Number(memoryLimitKb),
          default_code: defaultCodeJson,
          solution_code: solutionCodeJson
        })
        .select()
        .single();

      if (challengeErr || !challenge) {
        throw new Error(challengeErr?.message || 'Failed to insert challenge metadata');
      }

      // 3. Insert test cases
      const casesToInsert = parsedTestCases.map(tc => ({
        challenge_id: challenge.id,
        input_args: tc.input_args,
        expected_output: tc.expected_output,
        is_hidden: tc.is_hidden,
        display_order: tc.display_order
      }));

      const { error: testCasesErr } = await supabase
        .from('challenge_test_cases')
        .insert(casesToInsert);

      if (testCasesErr) {
        throw new Error(testCasesErr.message);
      }

      alert('Coding challenge created and published successfully!');
      router.push('/admin/coding');
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Loading creator module...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSaveChallenge} className="max-w-4xl mx-auto space-y-8">
        
        {/* Back and Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/coding"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white">Create Algorithmic Challenge</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Publish New Problems to Arena</p>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-red-650 to-red-750 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer border-none"
          >
            <Save className="w-4 h-4" /> Publish Challenge
          </button>
        </div>

        {/* Challenge metadata cards */}
        <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-indigo-400" /> Challenge Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Challenge Title</label>
              <input 
                type="text" 
                placeholder="e.g. Find Duplicates"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-550 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="project">Project</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-355 text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="DSA">DSA</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Problem Description (Markdown supported)</label>
            <textarea 
              rows={6}
              placeholder="Describe the challenge statement, requirements, input and output limits, complexity details, and example runs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-550 text-sm focus:outline-none focus:border-indigo-500 transition font-mono leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">XP Points Reward</label>
              <input 
                type="number" 
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Timeout (MS)</label>
              <input 
                type="number" 
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Memory Limit (KB)</label>
              <input 
                type="number" 
                value={memoryLimitKb}
                onChange={(e) => setMemoryLimitKb(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Code Boilerplate templates */}
        <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <Code className="w-4.5 h-4.5 text-indigo-400" /> Language Boilerplate Stubs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">JavaScript Boilerplate Stub</label>
                <textarea 
                  rows={4}
                  value={jsStub}
                  onChange={(e) => setJsStub(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">JavaScript Model Solution</label>
                <textarea 
                  rows={4}
                  value={jsSol}
                  onChange={(e) => setJsSol(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-955 border border-slate-805 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Python Boilerplate Stub</label>
                <textarea 
                  rows={4}
                  value={pyStub}
                  onChange={(e) => setPyStub(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Python Model Solution</label>
                <textarea 
                  rows={4}
                  value={pySol}
                  onChange={(e) => setPySol(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-955 border border-slate-805 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases Sub-form */}
        <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-indigo-400" /> Test Suite Configurations
            </h3>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-250 font-bold text-[10px] rounded-lg flex items-center gap-1 transition uppercase tracking-wider cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" /> Add Case
            </button>
          </div>

          <div className="space-y-4">
            {testCases.map((tc, idx) => (
              <div 
                key={idx}
                className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-indigo-400">Test Case #{idx + 1}</span>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTestCase(idx)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 border border-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Input Arguments (JSON array)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. [[2, 7, 11], 9]"
                      value={tc.input_args}
                      onChange={(e) => handleTestCaseChange(idx, 'input_args', e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected Output (JSON value)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. [0, 1]"
                      value={tc.expected_output}
                      onChange={(e) => handleTestCaseChange(idx, 'expected_output', e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id={`hidden-${idx}`}
                    checked={tc.is_hidden}
                    onChange={(e) => handleTestCaseChange(idx, 'is_hidden', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                  <label htmlFor={`hidden-${idx}`} className="text-xs text-slate-400 font-semibold select-none cursor-pointer">
                    Hidden Test Case (Only executed during final submission evaluation)
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

      </form>
    </div>
  );
}
