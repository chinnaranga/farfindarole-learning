export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { getTemplates, saveTemplate } from '@/lib/server-store'

const DEFAULT_TEMPLATES = [
  { id: 't1', category: 'Programming', title: 'React Basics', description: 'Components, state, rendering paradigms, and key loops.', topic: 'React', content: 'Create a lesson introducing React components...' },
  { id: 't2', category: 'Programming', title: 'JavaScript Promises', description: 'Async await, event loop, callbacks, and fetch.', topic: 'JavaScript', content: 'Outline a course on modern asynchronous JS...' },
  { id: 't3', category: 'Programming', title: 'Python Web Apps', description: 'Flask, Django, templates, and database routes.', topic: 'Python', content: 'Generate descriptive assignment tasks for Python web developers...' },
  { id: 't4', category: 'Academic', title: 'Calculus Fundamentals', description: 'Derivatives, integrals, limits, and applications.', topic: 'Mathematics', content: 'Generate a midterm exam on basic calculus concepts...' },
  { id: 't5', category: 'Academic', title: 'Newtonian Mechanics', description: 'Forces, acceleration, conservation of energy.', topic: 'Physics', content: 'Create a case study on orbital satellite physics...' },
  { id: 't6', category: 'Career', title: 'System Design Interview', description: 'Caching, horizontal scaling, microservices.', topic: 'Interview Prep', content: 'Compile descriptive interview questions evaluating microservice scale design...' },
  { id: 't7', category: 'Career', title: 'Aptitude Reasoning', description: 'Quantitative, logical, and verbal reasoning skills.', topic: 'Aptitude', content: 'Generate multiple choice aptitude questions testing logical deduction...' }
]

export async function GET(req: NextRequest) {
  try {
    let list = getTemplates()
    if (list.length === 0) {
      // Seed default templates
      for (const t of DEFAULT_TEMPLATES) {
        saveTemplate(t)
      }
      list = getTemplates()
    }
    return NextResponse.json({ success: true, templates: list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const template = await req.json()
    const list = saveTemplate(template)
    return NextResponse.json({ success: true, templates: list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}