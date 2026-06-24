'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Clock, Users, ArrowRight, Zap, Target, Star } from 'lucide-react';

interface Contest {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  participants_count?: number;
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContests() {
      try {
        const { data, error } = await supabase
          .from('contests')
          .select('*')
          .order('start_time', { ascending: true });

        if (!error && data) {
          setContests(data);
        }
      } catch (err) {
        console.error('Failed to load contests:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContests();
  }, []);

  const getTimerString = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();
    const now = new Date().getTime();

    if (now < start) {
      const diff = start - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Starts in ${hours}h ${mins}m`;
    } else if (now >= start && now <= end) {
      const diff = end - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Ends in ${hours}h ${mins}m (LIVE)`;
    } else {
      return 'Contest Finished';
    }
  };

  const getContestStatus = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();
    const now = new Date().getTime();

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'past';
  };

  const mockContests: Contest[] = [
    {
      id: 'mock-1',
      title: 'Weekly Coding Contest #42',
      description: 'Test your algorithmic speed on 4 DSA challenges. Solve matching arrays, dynamic programming, and binary search questions under 90 minutes.',
      start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      participants_count: 342
    },
    {
      id: 'mock-2',
      title: 'Google Hiring Assessment Simulation',
      description: 'Simulate a real coding round from Google. Contains 2 medium and 1 hard algorithmic puzzles. Compete with top peers and get recruiter highlights.',
      start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      participants_count: 512
    },
    {
      id: 'mock-3',
      title: 'Global Hackathon: AI Agent Solutions',
      description: 'Develop functional agents using AI models. Construct prompts, enforce strict tool configurations, and execute test evaluations directly on FarFindARole workflows.',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      participants_count: 1205
    }
  ];

  const activeContests = contests.length > 0 ? contests : mockContests;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-50 to-indigo-50 border border-slate-200 p-8 sm:p-10 mb-8 shadow-sm">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20 mb-4 uppercase tracking-widest leading-none">
              <Trophy className="w-3.5 h-3.5" /> Competitive Arena
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              Coding Contests & Hackathons
            </h1>
            <p className="text-sm text-slate-650 leading-relaxed">
              Participate in time-limited programming contests, compete with top engineers worldwide, practice company-specific assessment rounds, and rank on live leaderboards.
            </p>
          </div>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Live Leaderboards</h4>
              <p className="text-[10px] text-slate-550">Track ranking scores and solve speeds in real-time.</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Company Assessments</h4>
              <p className="text-[10px] text-slate-550">Prepare for target interviews with simulator templates.</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center border border-yellow-500/20">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Milestone Badges</h4>
              <p className="text-[10px] text-slate-550">Gain multipliers and unlock certifications for winning.</p>
            </div>
          </div>
        </div>

        {/* Ongoing and upcoming contests section */}
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
          Active Events ({activeContests.length})
        </h2>

        <div className="space-y-6">
          {activeContests.map(c => {
            const status = getContestStatus(c.start_time, c.end_time);
            return (
              <div 
                key={c.id}
                className="bg-white border border-slate-200 hover:border-slate-300 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition shadow-sm hover:shadow-md"
              >
                {/* Event Description info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      status === 'live' ? 'bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse' :
                      status === 'upcoming' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {status === 'live' ? 'LIVE NOW' : status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {getTimerString(c.start_time, c.end_time)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {c.participants_count || 0} Registered
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 hover:text-indigo-600 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {c.description}
                  </p>
                </div>

                {/* Join trigger button */}
                <div className="shrink-0">
                  <button 
                    onClick={() => alert(status === 'live' ? 'Redirecting to coding challenges associated with this contest round...' : 'Contest will open when the countdown completes!')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                      status === 'live' 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {status === 'live' ? 'Enter Arena' : 'Register Now'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

