export const runtime = 'edge';
export const runtime = 'edge';

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  Plus, 
  Cpu, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  AlertOctagon, 
  Trash2,
  Settings,
  ArrowLeft
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  points: number;
}

interface StatsSummary {
  totalSubmissions: number;
  acceptedCount: number;
  plagiarizedCount: number;
  avgRuntime: number;
}

export default function AdminCodingDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAdminAndLoad() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || user.email !== 'admin@farfindarole.com') {
          // Check role metadata as fallback
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

        // Fetch challenges
        const { data: list } = await supabase
          .from('coding_challenges')
          .select('id, title, difficulty, category, points')
          .order('created_at', { ascending: false });

        if (list) {
          setChallenges(list);
        }

        // Fetch submissions statistics summary
        const { data: subs } = await supabase
          .from('challenge_submissions')
          .select('status, runtime_ms');

        if (subs) {
          const total = subs.length;
          const accepted = subs.filter((s: any) => s.status === 'accepted').length;
          const plagiarized = subs.filter((s: any) => s.status === 'plagiarized').length;
          const runtimes = subs.map((s: any) => s.runtime_ms || 0);
          const avgRun = runtimes.length ? Math.round(runtimes.reduce((a: number, b: number) => a + b, 0) / runtimes.length) : 0;

          setStats({
            totalSubmissions: total,
            acceptedCount: accepted,
            plagiarizedCount: plagiarized,
            avgRuntime: avgRun
          });
        }
      } catch (err) {
        console.error('Failed to load admin workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    verifyAdminAndLoad();
  }, []);

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This deletes all associated test cases and student submissions!')) return;

    try {
      const { error } = await supabase
        .from('coding_challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setChallenges(prev => prev.filter(c => c.id !== id));
      alert('Challenge deleted successfully.');
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Authorizing Admin Panel...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back and title bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Challenge Workspace Editor</h1>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Administrative Control Console</p>
            </div>
          </div>

          <Link
            href="/admin/coding/new"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-750 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Create Challenge
          </Link>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Total Submissions</span>
            <span className="text-3xl font-black tracking-tight">{stats?.totalSubmissions ?? 0}</span>
          </div>
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Accepted Passes</span>
              <span className="text-3xl font-black tracking-tight text-emerald-400">{stats?.acceptedCount ?? 0}</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
          </div>
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Plagiarism Flags</span>
              <span className="text-3xl font-black tracking-tight text-rose-500">{stats?.plagiarizedCount ?? 0}</span>
            </div>
            <AlertOctagon className="w-8 h-8 text-rose-500/20" />
          </div>
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Avg Runtime speed</span>
            <span className="text-3xl font-black tracking-tight">{stats?.avgRuntime ?? 0} <span className="text-xs text-slate-400">ms</span></span>
          </div>
        </div>

        {/* Challenges Catalog */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest">Global Challenges ({challenges.length})</h3>
            <Settings className="w-4 h-4 text-slate-550" />
          </div>

          <div className="divide-y divide-slate-800">
            {challenges.length > 0 ? (
              challenges.map(c => (
                <div 
                  key={c.id}
                  className="px-6 py-4 hover:bg-slate-900/10 flex items-center justify-between transition-colors text-xs text-slate-350"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="font-black text-sm text-slate-100 block truncate mb-1">
                      {c.title}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 font-bold uppercase text-[9px]">
                        {c.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{c.category} • {c.points} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDeleteChallenge(c.id)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-rose-900/20 text-slate-450 hover:text-rose-500 border border-slate-800 hover:border-rose-900/20 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-550">
                <Cpu className="w-12 h-12 mx-auto stroke-1 mb-2" />
                <p className="font-bold">No coding challenges found in database</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}