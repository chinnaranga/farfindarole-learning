export const runtime = 'edge';

'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import PolicyModal from '@/components/PolicyModal'
import CodeEditor from '@/components/CodeEditor'
import {
  getCourse,
  getLessons,
  getProgress,
  getProgressDetails,
  saveProgress,
  saveCourseCompletion,
  getQuiz,
  supabase,
  getUserSubscription
} from '@/lib/supabase'
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MessageSquare,
  FileText,
  Send,
  Loader2,
  X,
  ThumbsUp,
  Clock,
  BarChart3,
  Award,
  BookMarked,
  Copy,
  Check,
  Download,
  RefreshCw,
  GraduationCap,
  TrendingUp,
  Target,
  Play,
  RotateCcw,
  AlertTriangle,
  Lock,
  Unlock,
  BookOpen,
  FileCheck2,
  Menu,
  Terminal,
  Info,
  Video,
  Code2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string
  title: string
  content: string
  video_url?: string
  duration_minutes?: number
  order_num: number
  free_preview?: boolean
  coding_challenge_id?: string
}

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  difficulty?: string
  category?: string
}

interface Comment {
  id: string
  itemId: string
  userName: string
  commentText: string
  createdAt: string
  likes?: number
}

interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Note {
  id: string
  text: string
  createdAt: Date
  lessonId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins 