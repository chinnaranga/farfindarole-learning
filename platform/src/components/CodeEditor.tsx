'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to bypass SSR window reference crashes
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-900 border border-slate-800 rounded-lg text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse">Loading IDE Workspace...</p>
      </div>
    ),
  }
);

interface CodeEditorProps {
  value: string;
  language: string;
  theme?: 'vs-dark' | 'light';
  onChange: (value: string | undefined) => void;
}

export default function CodeEditor({ value, language, theme = 'vs-dark', onChange }: CodeEditorProps) {
  const [editorLanguage, setEditorLanguage] = useState(language);

  // Normalize language for Monaco editor compatibility
  useEffect(() => {
    if (language === 'python') {
      setEditorLanguage('python');
    } else if (language === 'javascript') {
      setEditorLanguage('javascript');
    } else if (language === 'typescript') {
      setEditorLanguage('typescript');
    } else if (language === 'cpp') {
      setEditorLanguage('cpp');
    } else if (language === 'java') {
      setEditorLanguage('java');
    } else {
      setEditorLanguage(language);
    }
  }, [language]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Editor Control Panel */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
          <span className="ml-2 font-mono font-medium text-slate-300">
            workspace.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'cpp'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono capitalize">
            {language}
          </span>
          <span className="text-[10px] text-slate-500">UTF-8</span>
        </div>
      </div>

      {/* Editor Frame */}
      <div className="w-full h-[calc(100%-40px)] min-h-[380px]">
        <MonacoEditor
          height="100%"
          language={editorLanguage}
          theme={theme}
          value={value}
          onChange={onChange}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            lineHeight: 22,
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: true, strings: true },
            wordWrap: 'on',
            renderWhitespace: 'selection',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            }
          }}
        />
      </div>
    </div>
  );
}
