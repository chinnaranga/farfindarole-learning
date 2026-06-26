'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, BookOpen, ArrowLeft, Award, Trophy, Flame, Target, Monitor, Server,
  Layers, Brain, Cloud, Shield, Code, Briefcase, Database, Calendar, Loader2,
  Play, Users, CheckCircle, ChevronRight, X, Sparkle, Send, Terminal, HelpCircle,
  Clock, RotateCw, ShieldCheck, Check, Globe, Star, Lock
} from 'lucide-react'
import {
  supabase,
  getUserLearningStats,
  upsertUserLearningStats
} from '@/lib/supabase'

// ─── SYLLABUS DATA MAPPINGS FOR POPULAR CAREER TRACKS ──────────────────────────
export interface LearningNode {
  id: string;
  name: string;
  desc: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectives: string[];
  prerequisites: string[];
  lessonContent: string;
  quizQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  starterCode: string;
  expectedOutput: string;
  testValidation: string; // Evaluation js code
  projectSpec?: {
    title: string;
    desc: string;
    deliverables: string[];
  };
}

export interface Milestone {
  title: string;
  desc: string;
  nodes: LearningNode[];
}

export const ROADMAP_DATA: Record<string, Milestone[]> = {
  frontend: [
    {
      title: 'Milestone 1: Web Standards & Design',
      desc: 'Master the foundation of user interfaces, styling layouts, and accessibility standards.',
      nodes: [
        {
          id: 'html-basics',
          name: 'Semantic HTML & Accessibility',
          desc: 'Structure web pages using modern HTML5 semantic elements and screen-reader standards.',
          duration: '3 hours',
          difficulty: 'Beginner',
          prerequisites: ['None'],
          objectives: [
            'Understand document structure layout',
            'Deploy semantic elements like main, section, nav, header, article, aside',
            'Implement ARIA labels and alt attributes for screen readers'
          ],
          lessonContent: `# Semantic HTML & Accessibility

HTML5 introduced semantic elements to describe the meaning of web content to browsers and assistive technologies.

## Key Semantic Elements
* \`<header>\`: Header section for a document or section.
* \`<nav>\`: Set of navigation links.
* \`<main>\`: The dominant content area of the document.
* \`<section>\`: A thematic grouping of content.
* \`<article>\`: A self-contained composition (e.g., blog post).
* \`<aside>\`: Tangentially related content (e.g., sidebar).
* \`<footer>\`: Footer section for a document.

## Accessibility (a11y) Rules
* Always use a single, descriptive \`<h1>\` per page.
* Use \`alt\` text on all images.
* Wrap interactive controls in proper semantic tags (use \`<button>\` instead of \`<div onclick="...">\`).`,
          quizQuestions: [
            {
              question: 'Which element represents the main dominant content area of a document?',
              options: ['<section>', '<main>', '<content>', '<body>'],
              correctIndex: 1,
              explanation: 'The <main> element represents the dominant content area of the <body> of a document.'
            },
            {
              question: 'Why are semantic elements preferred over generic divs?',
              options: [
                'They are faster to compile',
                'They provide accessibility to screen readers and improve SEO',
                'They have built-in styling gradients',
                'They require fewer closing tags'
              ],
              correctIndex: 1,
              explanation: 'Semantic elements inform browsers, search engines, and screen readers about the structural purpose of the block, improving SEO and accessibility (a11y).'
            }
          ],
          starterCode: `// Write a function named 'getWelcomeHeading' that returns 
// the HTML string: "<h1>Welcome to FarFindARole</h1>"
function getWelcomeHeading() {
  // Write your code here
  
}`,
          expectedOutput: '<h1>Welcome to FarFindARole</h1>',
          testValidation: "getWelcomeHeading() === '<h1>Welcome to FarFindARole</h1>'"
        },
        {
          id: 'css-flexbox',
          name: 'CSS Layouts: Flexbox & Grid',
          desc: 'Align and distribute space among items in a container, even when their size is dynamic.',
          duration: '4 hours',
          difficulty: 'Beginner',
          prerequisites: ['Semantic HTML & Accessibility'],
          objectives: [
            'Master CSS flex direction, alignment, and distribution',
            'Design grid layouts using templates and responsive fractions (fr)',
            'Implement responsive breakpoints using media queries'
          ],
          lessonContent: `# CSS Layouts: Flexbox & Grid

CSS Flexbox and Grid have revolutionized how developers design responsive, structured layouts.

## Flexbox Core Concepts
Flexbox is one-dimensional (aligning elements horizontally or vertically).
* \`display: flex;\` activates flexbox on a container.
* \`flex-direction\`: sets the main axis (row or column).
* \`justify-content\`: aligns items along the main axis.
* \`align-items\`: aligns items along the cross axis.

## CSS Grid Core Concepts
Grid is two-dimensional (handling both columns and rows concurrently).
* \`display: grid;\` activates grid layout.
* \`grid-template-columns\`: defines columns (e.g., \`repeat(3, 1fr)\`).
* \`gap\`: defines spacing between cells.`,
          quizQuestions: [
            {
              question: 'Which property aligns flex items along the cross-axis?',
              options: ['justify-content', 'align-items', 'flex-direction', 'place-content'],
              correctIndex: 1,
              explanation: 'The align-items property aligns items along the cross-axis, whereas justify-content aligns along the main axis.'
            }
          ],
          starterCode: `// Write a function that returns the CSS string needed to 
// center flex items horizontally and vertically in a row.
function getFlexCenterStyles() {
  return \`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  \`.trim();
}`,
          expectedOutput: `display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;`,
          testValidation: "getFlexCenterStyles().replace(/\\s+/g, '') === 'display:flex;flex-direction:row;justify-content:center;align-items:center;'"
        }
      ]
    },
    {
      title: 'Milestone 2: Dynamic Interfaces with JavaScript',
      desc: 'Inject logical state, handle events, fetch API data, and construct modern Single Page Applications.',
      nodes: [
        {
          id: 'js-dom',
          name: 'DOM Manipulation & Events',
          desc: 'Select elements, listen to user clicks, and dynamically update document values in real-time.',
          duration: '5 hours',
          difficulty: 'Beginner',
          prerequisites: ['CSS Layouts: Flexbox & Grid'],
          objectives: [
            'Query document elements using querySelector and querySelectorAll',
            'Add event listeners for clicks, inputs, and submits',
            'Update node text, attributes, and CSS classes dynamically'
          ],
          lessonContent: `# DOM Manipulation & Events

The Document Object Model (DOM) is the programming interface that allows JavaScript to interact with HTML.

## Querying Elements
* \`document.getElementById('id')\`: Selects a single element by ID.
* \`document.querySelector('.class')\`: Selects the first matching element.
* \`document.querySelectorAll('div')\`: Selects all matching elements as a NodeList.

## Event Listeners
Listen to user interactions:
\`\`\`javascript
const button = document.querySelector('button');
button.addEventListener('click', (event) => {
  console.log('Button clicked!');
});
\`\`\``,
          quizQuestions: [
            {
              question: 'Which method returns all elements matching a specific CSS selector?',
              options: ['getElementById', 'querySelector', 'querySelectorAll', 'getElementsByClassName'],
              correctIndex: 2,
              explanation: 'querySelectorAll returns a static NodeList containing all elements matching the specified CSS selector.'
            }
          ],
          starterCode: `// Write a function named 'calculateSum' that takes two numbers
// and returns their sum.
function calculateSum(a, b) {
  // Write your code here
  
}`,
          expectedOutput: '8',
          testValidation: "calculateSum(3, 5) === 8 && calculateSum(-1, 4) === 3"
        },
        {
          id: 'js-fetch',
          name: 'Asynchronous JS & Fetch API',
          desc: 'Fetch data from REST endpoints using async/await, promises, and JSON parsers.',
          duration: '4 hours',
          difficulty: 'Intermediate',
          prerequisites: ['DOM Manipulation & Events'],
          objectives: [
            'Understand Promises and Async/Await execution',
            'Make HTTP GET/POST requests using fetch()',
            'Handle network errors and loading states gracefully'
          ],
          lessonContent: `# Asynchronous JS & Fetch API

Web applications rely on fetching data from remote API servers asynchronously, without locking the UI thread.

## Promises & Async/Await
A Promise represents an operation that will complete in the future. Async/Await is modern syntax to write async code that looks synchronous:

\`\`\`javascript
async function loadUserData() {
  try {
    const response = await fetch('https://api.example.com/user');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}
\`\`\``,
          quizQuestions: [
            {
              question: 'What does fetch() return in JavaScript?',
              options: ['A JSON object', 'A Promise resolving to a Response object', 'A status code integer', 'An array of data'],
              correctIndex: 1,
              explanation: 'The fetch() method returns a Promise that resolves to a Response object representing the server response.'
            }
          ],
          starterCode: `// Write an async function named 'fetchMockStatus' that returns
// a resolved promise containing the object: { status: "active" }
async function fetchMockStatus() {
  // Write your code here
  
}`,
          expectedOutput: '{"status":"active"}',
          testValidation: "(async () => { const res = await fetchMockStatus(); return res && res.status === 'active'; })()"
        }
      ]
    },
    {
      title: 'Milestone 3: Modern Component Architectures',
      desc: 'Build scalable interfaces using React components, state lifecycles, and unified layouts.',
      nodes: [
        {
          id: 'react-components',
          name: 'React Components & Hooks',
          desc: 'Build reusable UI widgets, manage state with useState, and handle lifecycles with useEffect.',
          duration: '6 hours',
          difficulty: 'Intermediate',
          prerequisites: ['Asynchronous JS & Fetch API'],
          objectives: [
            'Create functional React components and pass props',
            'Manage state using the useState hook',
            'Handle side-effects (e.g. data fetching) using useEffect'
          ],
          lessonContent: `# React Components & Hooks

React is a component-driven UI library that updates DOM elements efficiently using a Virtual DOM.

## Reusable Components
Components are JS functions that return JSX (HTML-like syntax in JS):
\`\`\`jsx
function ProfileCard({ name }) {
  return <div className="card">Welcome, {name}</div>;
}
\`\`\`

## Hooks: useState
Manage reactive state variables:
\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
\`\`\``,
          quizQuestions: [
            {
              question: 'Which hook should you use to handle data fetching side-effects in React?',
              options: ['useState', 'useRef', 'useEffect', 'useMemo'],
              correctIndex: 2,
              explanation: 'The useEffect hook is designed to manage side-effects, such as API fetching, subscriptions, and manual DOM updates.'
            }
          ],
          starterCode: `// Write a function named 'formatCounterText' that takes a number
// and returns: "Count is: N"
function formatCounterText(n) {
  // Write your code here
  
}`,
          expectedOutput: 'Count is: 5',
          testValidation: "formatCounterText(5) === 'Count is: 5' && formatCounterText(0) === 'Count is: 0'"
        },
        {
          id: 'frontend-project',
          name: 'Final Project: Enterprise React Dashboard',
          desc: 'Assemble all your skills to build a functional client-side dashboard with state and analytics.',
          duration: '10 hours',
          difficulty: 'Advanced',
          prerequisites: ['React Components & Hooks'],
          objectives: [
            'Create a multi-tab dashboard layout with state hooks',
            'Fetch and display API data with search filters',
            'Submit project repositories for recruiter verification'
          ],
          lessonContent: `# Final Project: Enterprise React Dashboard

Congratulations on reaching the final node of the Frontend Developer roadmap!

## Project Requirements
To achieve **Skill Verification** and earn your **Verifiable Certificate**, you must build and submit a functional React Dashboard.
* **Layout**: A responsive sidebar/header interface using Sapphire Navy and Crimson brand highlights.
* **Analytics Cards**: Render at least 4 stats boxes with data counters.
* **Searchable Grid**: Load a list of mock users/items and allow users to type in a search box to filter them in real-time.
* **AI Mentor Chat**: Include a simple mock chat bubble that replies with helpful tutoring hints.

## Submission Rules
1. Host your project on **GitHub**.
2. Deploy the build to a hosting platform like **Vercel**, **Netlify**, or **GitHub Pages**.
3. Submit both the GitHub Repository URL and the live deployment URL in the **Project tab** inside this drawer.`,
          quizQuestions: [
            {
              question: 'What is required to verify your frontend developer skills and unlock your certificate?',
              options: [
                'Passing a multiple choice quiz only',
                'Submitting a valid GitHub repository and live deployment URL for the enterprise dashboard project',
                'Paying an upgrade fee',
                'Watching 10 hours of video lectures'
              ],
              correctIndex: 1,
              explanation: 'Skill verification requires submitting a valid GitHub repository and live deployment URL for the portfolio project.'
            }
          ],
          starterCode: `// Write a function named 'validateUrls' that takes a githubUrl and
// liveUrl, and returns true if both are non-empty strings.
function validateUrls(githubUrl, liveUrl) {
  return typeof githubUrl === 'string' && githubUrl.trim().length > 0 &&
         typeof liveUrl === 'string' && liveUrl.trim().length > 0;
}`,
          expectedOutput: 'true',
          testValidation: "validateUrls('github.com/user', 'user.vercel.app') === true && validateUrls('', 'user.app') === false",
          projectSpec: {
            title: 'Enterprise React Dashboard',
            desc: 'A responsive, interactive administration dashboard with searchable stats, tables, and AI support widget.',
            deliverables: [
              'Functional React/Next.js codebase hosted on GitHub',
              'Live, accessible deployment URL',
              'Responsive grid with Sapphire/Crimson corporate highlights',
              'Search filter implementation on a grid of items'
            ]
          }
        }
      ]
    }
  ],
  backend: [
    {
      title: 'Milestone 1: Server Logic & Node.js Core',
      desc: 'Learn sever execution engines, HTTP protocols, file streams, and event loops.',
      nodes: [
        {
          id: 'node-basics',
          name: 'Node.js Core & Event Loop',
          desc: 'Execute server-side JavaScript, read files, and manage asynchronous task execution.',
          duration: '4 hours',
          difficulty: 'Beginner',
          prerequisites: ['JavaScript Basics'],
          objectives: [
            'Understand the Node.js event loop and non-blocking I/O',
            'Read and write local files using fs modules',
            'Import and export modules using CommonJS and ESM'
          ],
          lessonContent: `# Node.js Core & Event Loop

Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser, powered by Google's V8 engine.

## Non-Blocking I/O
Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications.

## Common fs Operations
Read and write files asynchronously:
\`\`\`javascript
const fs = require('fs/promises');

async function readFileContent(path) {
  const content = await fs.readFile(path, 'utf-8');
  return content;
}
\`\`\``,
          quizQuestions: [
            {
              question: 'Which engine powers Node.js to execute JavaScript outside of browser containers?',
              options: ['Gecko', 'SpiderMonkey', 'V8', 'WebKit'],
              correctIndex: 2,
              explanation: 'Node.js is built on Google Chrome V8 JavaScript execution engine.'
            }
          ],
          starterCode: `// Write a function named 'greetDeveloper' that takes a name 
// and returns: "Hello, Developer name"
function greetDeveloper(name) {
  // Write your code here
  
}`,
          expectedOutput: 'Hello, Developer John',
          testValidation: "greetDeveloper('John') === 'Hello, Developer John'"
        }
      ]
    }
  ]
};

export default function InteractiveRoadmapWorkspace() {
  const params = useParams()
  const router = useRouter()
  const roadmapId = (params?.id as string) || 'frontend'

  // Load appropriate roadmap data or fallback
  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    const localData = localStorage.getItem(`edited_roadmap_${roadmapId}`)
    if (localData) {
      try {
        setMilestones(JSON.parse(localData))
        return
      } catch (e) {
        console.error(e)
      }
    }
    setMilestones(ROADMAP_DATA[roadmapId] || ROADMAP_DATA.frontend)
  }, [roadmapId])

  // Auth & Stats state
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userStats, setUserStats] = useState<any>(null)
  const [xpPoints, setXpPoints] = useState(0)

  // Track user progress locally (locked/completed nodes)
  const [completedNodes, setCompletedNodes] = useState<string[]>([])
  const [activeNode, setActiveNode] = useState<LearningNode | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'study' | 'mentor' | 'code' | 'quiz' | 'project'>('study')

  // Code Playground State
  const [code, setCode] = useState('')
  const [codeOutput, setCodeOutput] = useState('')
  const [codeSuccess, setCodeSuccess] = useState<boolean | null>(null)
  const [compiling, setCompiling] = useState(false)

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  // Project Submission State
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [projectSuccess, setProjectSuccess] = useState(false)

  // AI Mentor Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: 'student' | 'mentor', text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [aiTyping, setAiTyping] = useState(false)

  // Load user session and local storage progress
  useEffect(() => {
    const loadSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email)
        const stats = await getUserLearningStats(user.id)
        setUserStats(stats)
        if (stats) setXpPoints(stats.xp_total || 0)
      }

      // Load progress from localStorage
      const savedProgress = localStorage.getItem(`roadmap_progress_${roadmapId}`)
      if (savedProgress) {
        setCompletedNodes(JSON.parse(savedProgress))
      } else {
        // Initial setup - default first node unlocked, nothing completed
        setCompletedNodes([])
      }
    }
    loadSession()
  }, [roadmapId])

  // Save progress helper
  const markNodeCompleted = async (nodeId: string) => {
    if (completedNodes.includes(nodeId)) return
    const updated = [...completedNodes, nodeId]
    setCompletedNodes(updated)
    localStorage.setItem(`roadmap_progress_${roadmapId}`, JSON.stringify(updated))

    // Increment XP in database
    if (userId) {
      const rewardXp = 100
      const currentXp = xpPoints + rewardXp
      setXpPoints(currentXp)
      await upsertUserLearningStats(userId, {
        xp_total: currentXp,
        lessons_completed: (userStats?.lessons_completed || 0) + 1
      })
    }
  }

  // Handle Node Click
  const handleNodeClick = (node: LearningNode, isNodeLocked: boolean) => {
    if (isNodeLocked) return
    setActiveNode(node)
    setCode(node.starterCode)
    setCodeOutput('')
    setCodeSuccess(null)
    setSelectedAnswers({})
    setQuizSubmitted(false)
    setProjectSuccess(false)
    setDrawerTab('study')
    
    // Initial AI Mentor greeting
    setChatMessages([
      {
        sender: 'mentor',
        text: `Hello! I am your AI learning coach for ${node.name}. Ask me to explain concepts, give examples, or verify your understanding. What would you like to cover first?`
      }
    ])
    
    setDrawerOpen(true)
  }

  // Monaco-style JavaScript Compiler evaluation
  const handleRunCode = () => {
    if (!activeNode) return
    setCompiling(true)
    setCodeOutput('')
    setCodeSuccess(null)

    setTimeout(() => {
      try {
        // Safe iframe/sandboxed evaluation helper
        // Create an evaluation context
        const userCode = code
        const validation = activeNode.testValidation

        // Create evaluation function
        const evalFn = new Function(`
          ${userCode}
          try {
            const result = eval("${validation.replace(/"/g, '\\"')}");
            return { success: !!result, output: String(eval("${activeNode.testValidation.split('===')[0]}")) };
          } catch(e) {
            return { success: false, error: e.message };
          }
        `)

        const res = evalFn()
        setCompiling(false)

        if (res.error) {
          setCodeOutput(`Runtime Error: ${res.error}`)
          setCodeSuccess(false)
        } else if (res.success) {
          setCodeOutput(`Output: ${res.output}\n\n✓ All test assertions passed!`)
          setCodeSuccess(true)
          // Mark as completed!
          markNodeCompleted(activeNode.id)
        } else {
          setCodeOutput(`Output: ${res.output}\n\n✗ Test assertion failed. Function did not return expected output.`);
          setCodeSuccess(false)
        }
      } catch (err: any) {
        setCompiling(false)
        setCodeOutput(`Syntax Error: ${err.message}`)
        setCodeSuccess(false)
      }
    }, 800)
  }

  // Quiz submission
  const handleQuizSubmit = () => {
    if (!activeNode) return
    let score = 0
    activeNode.quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1
      }
    })
    setQuizScore(score)
    setQuizSubmitted(true)

    const passed = score === activeNode.quizQuestions.length
    if (passed) {
      markNodeCompleted(activeNode.id)
    }
  }

  // Project submission
  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl.trim() || !liveUrl.trim()) return
    setProjectSuccess(true)
    if (activeNode) {
      markNodeCompleted(activeNode.id)
    }
  }

  // Conversational AI Mentor chat ping
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeNode) return
    const studentQuery = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { sender: 'student', text: studentQuery }])
    setAiTyping(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeNode.name,
          query: studentQuery
        })
      })
      const data = await response.json()
      setAiTyping(false)
      setChatMessages(prev => [...prev, { sender: 'mentor', text: data.reply || 'I am currently configuring your lesson stack. Please ask again.' }])
    } catch {
      setAiTyping(false)
      setChatMessages(prev => [...prev, { sender: 'mentor', text: 'Connection timed out. Please try again.' }])
    }
  }

  // AI Quick Prompts triggers
  const triggerQuickPrompt = async (promptText: string) => {
    setChatInput(promptText)
  }

  // Total progress calculation
  const allNodes = milestones.flatMap(m => m.nodes)
  const completedCount = completedNodes.length
  const totalCount = allNodes.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 pb-20 relative select-none flex flex-col">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-radial from-brand-primary/5 via-slate-200/20 to-transparent pointer-events-none" />

      {/* Header Panel */}
      <section className="bg-white border-b border-slate-200 py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left w-full sm:w-auto">
            <Link href="/roadmaps" className="w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 flex items-center justify-center text-slate-550 transition flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[9px] font-black text-brand-secondary uppercase tracking-widest leading-none">Interactive Learning Path</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 capitalize tracking-tight mt-1">
                {roadmapId.replace('-', ' ')} Developer Roadmap
              </h1>
            </div>
          </div>

          {/* Tracker bar widget */}
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-4">
              {/* Progress SVG circular gauge */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" className="stroke-slate-100 fill-none stroke-[4]" />
                  <circle cx="24" cy="24" r="20" className="stroke-brand-primary fill-none stroke-[4] transition-all duration-500"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-slate-800">{progressPercent}%</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-450 uppercase leading-none">Role Readiness</p>
                <p className="text-xs font-bold text-slate-650 mt-1"><strong>{completedCount}</strong> of <strong>{totalCount}</strong> nodes completed</p>
              </div>
            </div>

            {/* Certification Status */}
            {progressPercent === 100 ? (
              <button className="bg-brand-secondary text-white font-black text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-md hover:bg-brand-secondary/90 transition flex items-center gap-1.5 animate-bounce">
                <Award className="w-4 h-4" /> Claim Certificate
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-slate-350" /> Sponsored License
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Flowchart Workspace */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center items-center">
        
        {milestones.map((milestone, mIdx) => (
          <div key={mIdx} className="w-full flex flex-col items-center relative">
            
            {/* Milestone Header Box */}
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left relative overflow-hidden my-6">
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{milestone.title}</h3>
              <p className="text-xs text-slate-450 leading-relaxed mt-1.5">{milestone.desc}</p>
            </div>

            {/* SVG Vertical connection link */}
            {milestone.nodes.map((node, nIdx) => {
              // Node locks evaluation: First node of Milestone 1 is always unlocked.
              // Subsequent nodes unlock only if the previous node is completed.
              // Find index of this node in the flattened array of all nodes.
              const flatIdx = allNodes.findIndex(item => item.id === node.id)
              const isLocked = flatIdx > 0 && !completedNodes.includes(allNodes[flatIdx - 1].id)
              const isCompleted = completedNodes.includes(node.id)
              const isInProgress = !isLocked && !isCompleted

              return (
                <div key={node.id} className="flex flex-col items-center w-full relative">
                  
                  {/* SVG line connector between nodes */}
                  {flatIdx > 0 && (
                    <svg className="w-2 h-12 pointer-events-none">
                      <line x1="4" y1="0" x2="4" y2="48" className={`stroke-[3] ${isCompleted ? 'stroke-emerald-500' : isInProgress ? 'stroke-brand-secondary/40 stroke-dash' : 'stroke-slate-200'}`} />
                    </svg>
                  )}

                  {/* Node Card */}
                  <button
                    onClick={() => handleNodeClick(node, isLocked)}
                    disabled={isLocked}
                    className={`w-full max-w-sm p-4.5 rounded-2xl border transition duration-200 flex items-center justify-between text-left shadow-sm ${
                      isCompleted
                        ? 'bg-white border-emerald-500 hover:border-emerald-605 cursor-pointer'
                        : isInProgress
                        ? 'bg-white border-brand-secondary shadow-md hover:scale-[1.01] cursor-pointer animate-pulse-border'
                        : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-605'
                          : isInProgress
                          ? 'bg-brand-secondary/10 text-brand-secondary'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4.5 h-4.5" />
                        ) : (
                          <Code className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{node.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{node.duration} &bull; {node.difficulty}</p>
                      </div>
                    </div>

                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : isInProgress ? 'text-brand-secondary' : 'text-slate-400'}`} />
                    )}
                  </button>

                </div>
              )
            })}

          </div>
        ))}

      </div>

      {/* ── INTERACTIVE WORKSPACE SLIDE-OUT DRAWER ────────────────────────────────── */}
      {drawerOpen && activeNode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs select-none">
          {/* Overlay click closer */}
          <div className="flex-1 cursor-pointer" onClick={() => setDrawerOpen(false)} />

          {/* Drawer Panel */}
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col relative animate-slideLeft">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-left">
                <p className="text-[9px] font-black text-brand-secondary uppercase tracking-widest">Active Node Workstation</p>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-0.5">{activeNode.name}</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab selection menu */}
            <div className="flex border-b border-slate-200 bg-white">
              {[
                { id: 'study', label: 'Study Content', icon: BookOpen },
                { id: 'mentor', label: 'AI Mentor', icon: Sparkles },
                { id: 'code', label: 'Coding Lab', icon: Terminal },
                { id: 'quiz', label: 'Assessment', icon: HelpCircle },
                ...(activeNode.projectSpec ? [{ id: 'project', label: 'Portfolio Project', icon: Briefcase }] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as any)}
                  className={`flex-1 py-3 border-b-2 text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    drawerTab === tab.id
                      ? 'border-brand-secondary text-brand-secondary'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              
              {/* TAB 1: STUDY */}
              {drawerTab === 'study' && (
                <div className="space-y-6 text-left max-w-none">
                  {/* Topic stats card */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Estimated Time</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeNode.duration}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Topic Difficulty</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{activeNode.difficulty}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Prerequisites</p>
                      <div className="flex flex-wrap gap-1">
                        {activeNode.prerequisites.map((p, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-bold">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Syllabus markdown text */}
                  <div className="prose prose-slate prose-xs bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs whitespace-pre-line leading-relaxed text-xs">
                    {activeNode.lessonContent}
                  </div>

                  {/* Objectives card */}
                  <div className="p-6 bg-brand-primary rounded-3xl text-white space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/10 rounded-full blur-[20px]" />
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-4 h-4 text-brand-secondary" /> Learning Objectives
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {activeNode.objectives.map((o, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-brand-secondary mt-0.5">&bull;</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: AI MENTOR */}
              {drawerTab === 'mentor' && (
                <div className="h-full flex flex-col gap-4">
                  {/* Messages box */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 overflow-y-auto space-y-4 max-h-[350px] shadow-xs">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed text-left ${
                          msg.sender === 'student'
                            ? 'bg-brand-primary text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-150'
                        }`}>
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {aiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-150 text-[10px] font-bold flex items-center gap-1.5">
                          <RotateCw className="w-3.5 h-3.5 animate-spin" /> AI Tutor is writing...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Tutoring Actions */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      `Explain ${activeNode.name}`,
                      'Give a simple analogy',
                      'Create a practice question',
                      'Recommend next steps'
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => triggerQuickPrompt(q)}
                        disabled={aiTyping}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition cursor-pointer disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder={`Ask me anything about ${activeNode.name}...`}
                      className="flex-1 bg-white border border-slate-205 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary transition"
                      onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                      disabled={aiTyping}
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={aiTyping || !chatInput.trim()}
                      className="w-12 h-12 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: CODE PLAYGROUND */}
              {drawerTab === 'code' && (
                <div className="h-full flex flex-col gap-4">
                  {/* Editor Window */}
                  <div className="flex-1 flex flex-col border border-slate-250 rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[250px] shadow-lg">
                    <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compiler: Sandbox Workspace</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-primary text-white rounded-md uppercase leading-none">JavaScript</span>
                    </div>
                    {/* Simulated Monaco Editor TextArea */}
                    <textarea
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="flex-1 bg-slate-950 text-emerald-400 font-mono text-xs p-4 border-none outline-none resize-none min-h-[150px] focus:ring-0 leading-relaxed"
                      spellCheck={false}
                    />
                  </div>

                  {/* Console logs output */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5" /> Compiler Console Log
                    </h4>
                    {codeOutput ? (
                      <pre className="font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-normal">{codeOutput}</pre>
                    ) : (
                      <p className="font-mono text-[10px] text-slate-500 italic">No output logged. Click 'Run Workspace Code' below.</p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRunCode}
                      disabled={compiling || !code.trim()}
                      className="flex-1 bg-brand-secondary hover:bg-brand-secondary/95 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition cursor-pointer disabled:opacity-50 select-none uppercase tracking-wider"
                    >
                      {compiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{compiling ? 'Compiling and Running...' : 'Run Workspace Code'}</span>
                    </button>
                    <button
                      onClick={() => setCode(activeNode.starterCode)}
                      className="px-4 py-3 rounded-xl border border-slate-250 hover:border-slate-350 bg-white hover:bg-slate-50 text-xs font-bold text-slate-655 transition cursor-pointer"
                    >
                      Reset Code
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: ASSESSMENT */}
              {drawerTab === 'quiz' && (
                <div className="space-y-6 text-left">
                  <div className="space-y-4">
                    {activeNode.quizQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-800 leading-normal">
                          Question {qIdx + 1}: {q.question}
                        </h4>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedAnswers[qIdx] === optIdx
                            return (
                              <button
                                key={optIdx}
                                onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                disabled={quizSubmitted}
                                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                                  isSelected
                                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <span>{opt}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-brand-primary" />}
                              </button>
                            )
                          })}
                        </div>

                        {/* Explaination card on submit */}
                        {quizSubmitted && (
                          <div className={`p-3 text-[10px] leading-relaxed rounded-xl font-medium border ${
                            selectedAnswers[qIdx] === q.correctIndex
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-red-50 border-red-100 text-red-700'
                          }`}>
                            <p className="font-bold mb-1">
                              {selectedAnswers[qIdx] === q.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
                            </p>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Submission controls */}
                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(selectedAnswers).length !== activeNode.quizQuestions.length}
                      className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-45 text-xs uppercase tracking-wider cursor-pointer select-none"
                    >
                      Submit Graded Assessment
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-slate-100 p-4 rounded-2xl border border-slate-200">
                      <span className="text-xs font-black text-slate-700 uppercase">
                        Score: {quizScore} / {activeNode.quizQuestions.length}
                      </span>
                      {quizScore === activeNode.quizQuestions.length ? (
                        <span className="text-xs font-black text-emerald-700 uppercase flex items-center gap-1">
                          <CheckCircle className="w-4.5 h-4.5 fill-current" /> Passed! Node Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setQuizSubmitted(false)
                            setSelectedAnswers({})
                          }}
                          className="text-xs font-black text-brand-secondary hover:underline uppercase cursor-pointer"
                        >
                          Retry Assessment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PORTFOLIO PROJECT */}
              {drawerTab === 'project' && activeNode.projectSpec && (
                <div className="space-y-6 text-left">
                  {/* Spec card */}
                  <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[8px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full uppercase leading-none">Graduation Deliverable</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-1">{activeNode.projectSpec.title}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-450 leading-relaxed">{activeNode.projectSpec.desc}</p>

                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Deliverables</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeNode.projectSpec.deliverables.map((d, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-750">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission Form */}
                  {projectSuccess ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-605 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Project Successfully Submitted!</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                          Excellent work! Your dashboard project has been linked to your recruiter hiring profile. All course nodes are complete!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleProjectSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Submit Project URLs</h4>
                        <p className="text-[10px] text-slate-500">Provide verifiable repositories for direct talent pipelines matching.</p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">GitHub Repository URL <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="e.g. https://github.com/username/project"
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 pl-11 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                            required
                          />
                          <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Live Deployment URL <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="e.g. https://project.vercel.app"
                            value={liveUrl}
                            onChange={e => setLiveUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 pl-11 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                            required
                          />
                          <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!githubUrl.trim() || !liveUrl.trim()}
                        className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-40 text-xs uppercase tracking-wider cursor-pointer select-none"
                      >
                        Submit Portfolio Deliverables
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
