export const runtime = 'edge';

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Clock, Users, ArrowRight, Zap, Target, Star, ShieldAlert } from 'lucide-react';

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

  // Timer component logic helper
  const getTimerString = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();
    const now = new Date().getTime();

    if (now < start) {
      const diff = start - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff 