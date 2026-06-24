'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BookOpen, Trophy, Award, Flame, Star, Search, Filter, Cpu, CheckCircle } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'project';
  category: string;
  tier: string;
  points: number;
}

interface UserStats {
  problems_solved: number;
  streak_days: number;
  xp_points: number;
  languages_used: Record<string, number>;
  difficulty_solved: { easy: number; medium: number; hard: number; project: number };
}

interface LeaderboardUser {
  user_id: string;
  xp_points: number;
  problems_solved: number;
  streak_days: number;
}

export default function CodingCatalogPage() {
  const [user, setUser] = useState<any>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
          
          // Fetch user coding stats
          const { data: stats } = await supabase
            .from('user_coding_stats')
            .select('*')
            .eq('user_id', authUser.email)
            .maybeSingle();
          
          if (stats) {
            setUserStats(stats);
          }

          // Fetch user badges
          const { data: userBadges } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', authUser.email);
          
          if (userBadges) {
            setBadges(userBadges.map((b: any) => b.badge_id));
          }

          // Fetch user's completed submissions
          const { data: completed } = await supabase
            .from('challenge_submissions')
            .select('challenge_id')
            .eq('user_id', authUser.email)
            .eq('status', 'accepted');
          
          if (completed) {
            setSolvedChallenges(Array.from(new Set(completed.map((c: any) => c.challenge_id))));
          }
        }

        // Fetch all challenges
        const { data: challengesList } = await supabase
          .from('coding_challenges')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (challengesList) {
          setChallenges(challengesList);
        }

        // Fetch global leaderboard
        const { data: leaders } = await supabase
          .from('user_coding_stats')
          .select('user_id, xp_points, problems_solved, streak_days')
          .order('xp_points', { ascending: false })
          .limit(5);

        if (leaders) {
          setLeaderboard(leaders);
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25';
      case 'medium': return 'bg-amber-500/10 text-amber-700 border border-amber-500/25';
      case 'hard': return 'bg-rose-500/10 text-rose-700 border border-rose-500/25';
      default: return 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/25';
    }
  };

  const filteredChallenges = challenges.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const easySolved = userStats?.difficulty_solved?.easy ?? 0;
  const mediumSolved = userStats?.difficulty_solved?.medium ?? 0;
  const hardSolved = userStats?.difficulty_solved?.hard ?? 0;
  const totalSolved = solvedChallenges.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider">Configuring Coding Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Hero banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-slate-200 p-8 sm:p-10 mb-8 shadow-sm">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-650 border border-indigo-500/20 mb-4 uppercase tracking-widest leading-none">
              <Cpu className="w-3.5 h-3.5" /> Coding Arena
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              Master Data Structures & Algorithms
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Write, compile, and execute code in Monaco Editor against robust test suites. Optimize space and time complexities, bypass plagiarism checks, and earn prestigious badges.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          
          {/* Circular solve progress */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Solved Progress
            </h3>
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="28" className="stroke-indigo-500" strokeWidth="6" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 28} 
                          strokeDashoffset={2 * Math.PI * 28 * (1 - (challenges.length ? totalSolved / challenges.length : 0))} 
                          strokeLinecap="round" />
                </svg>
                <span className="absolute text-xs font-black text-slate-900">{totalSolved}/{challenges.length}</span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{totalSolved}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Problems Solved</p>
              </div>
            </div>
          </div>

          {/* XP Point Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Coding Points
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-slate-900">{userStats?.xp_points ?? 0}</span>
              <span className="text-xs text-yellow-600 font-bold uppercase">XP</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-2 uppercase">Ranked on active platform levels</p>
          </div>

          {/* Streak Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Daily Streak
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-orange-500">{userStats?.streak_days ?? 0}</span>
              <span className="text-xs text-orange-600 font-bold uppercase">Days</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-2 uppercase">Submit daily to protect streak</p>
          </div>

          {/* Difficulty breakdown list */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-500" /> Difficulty Split
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-600 font-semibold">Easy</span>
                <span className="font-mono font-bold text-slate-850">{easySolved}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${challenges.length ? (easySolved / challenges.length) * 100 : 0}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-600 font-semibold">Medium</span>
                <span className="font-mono font-bold text-slate-850">{mediumSolved}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${challenges.length ? (mediumSolved / challenges.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

        </div>

        {/* Content Section: Challenges & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Center: Filter and Challenges catalog list */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search and Filters panel */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search challenges..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Difficulty Dropdown */}
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {/* Category Dropdown */}
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="DSA">DSA</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
              </select>
            </div>

            {/* Challenges list */}
            <div className="space-y-4">
              {filteredChallenges.length > 0 ? (
                filteredChallenges.map(c => {
                  const isSolved = solvedChallenges.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 p-5 rounded-2xl flex items-center justify-between transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getDifficultyColor(c.difficulty)}`}>
                            {c.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">{c.category}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {c.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="text-sm font-black text-slate-800">{c.points} XP</span>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Rewards</p>
                        </div>
                        {isSolved ? (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        ) : (
                          <Link 
                            href={`/dashboard/coding/${c.id}`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:scale-[1.02] transition-all"
                          >
                            Solve
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-sm">
                  <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                  <p className="font-semibold text-sm">No challenges found matching filters</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Leaderboard & Badges */}
          <div className="space-y-6">
            
            {/* Top Coding Leaderboard */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-slate-900">
              <h3 className="text-slate-800 text-sm font-black tracking-wider mb-4 flex items-center gap-2 uppercase">
                <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
              </h3>
              <div className="space-y-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((item, idx) => (
                    <div 
                      key={item.user_id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        user?.email === item.user_id 
                          ? 'bg-indigo-500/10 border-indigo-500/30' 
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          idx === 0 ? 'bg-yellow-500 text-slate-900' :
                          idx === 1 ? 'bg-slate-300 text-slate-900' :
                          idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-650'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.user_id.split('@')[0]}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                            {item.problems_solved} Solved • {item.streak_days}d Streak
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-indigo-600">{item.xp_points} XP</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No stats logged yet. Be the first to solve!
                  </div>
                )}
              </div>
            </div>

            {/* Coding Badges & Milestones */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-slate-900">
              <h3 className="text-slate-800 text-sm font-black tracking-wider mb-4 flex items-center gap-2 uppercase">
                <Award className="w-4 h-4 text-indigo-500" /> Milestones Earned
              </h3>
              
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {badges.map(b => (
                    <div 
                      key={b} 
                      className="flex flex-col items-center justify-center p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20 mb-2">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-800 capitalize">
                        {b.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                  <Award className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="text-xs">No badges unlocked. Solve challenges to earn milestones.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
