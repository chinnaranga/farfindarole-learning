export const runtime = 'edge';
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import vm from 'vm';
import { exec } from 'child_process';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function toSnakeCase(str: string) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

/**
 * Converts a JSON-serialized value to a Python literal.
 * JSON uses lowercase true/false/null but Python requires True/False/None.
 */
function toPythonLiteral(value: any): string {
  return JSON.stringify(value)
    .replace(/true/g, 'True')
    .replace(/false/g, 'False')
    .replace(/null/g, 'None');
}

// Deep equal comparison (mirrors submit route logic)
function deepEqual(val1: any, val2: any): boolean {
  if (val1 === val2) return true;
  if (val1 === null || val2 === null) return val1 === val2;
  if (val1 === undefined || val2 === undefined) return val1 === val2;
  if (typeof val1 !== 'object' && typeof val2 !== 'object') return String(val1) === String(val2);
  if (typeof val1 !== typeof val2) return false;
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    const allNum = val1.every(v => typeof v === 'number') && val2.every(v => typeof v === 'number');
    if (allNum) {
      const s1 = [...val1].sort((a, b) => a - b);
      const s2 = [...val2].sort((a, b) => a - b);
      return s1.every((v, i) => v === s2[i]);
    }
    return val1.every((v, i) => deepEqual(v, val2[i]));
  }
  if (Array.isArray(val1) !== Array.isArray(val2)) return false;
  if (typeof val1 === 'object') {
    const k1 = Object.keys(val1), k2 = Object.keys(val2);
    if (k1.length !== k2.length) return false;
    return k1.every(k => deepEqual(val1[k], val2[k]));
  }
  try { return JSON.stringify(val1) === JSON.stringify(val2); } catch { return false; }
}

function runPythonLocally(payloadCode: string, timeLimitMs: number): Promise<{ stdout: string; stderr: string; error?: string }> {
  return new Promise((resolve) => {
    const processInstance = exec('python3', { timeout: timeLimitMs }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          error: error.killed ? 'Time Limit Exceeded' : (error.message || 'Execution error')
        });
      } else {
        resolve({
          stdout: stdout || '',
          stderr: stderr || ''
        });
      }
    });

    if (processInstance.stdin) {
      processInstance.stdin.write(payloadCode);
      processInstance.stdin.end();
    }
  });
}


// Map languages to Piston runner values
const PISTON_LANG_MAP: Record<string, { language: string; version: string }> = {
  python: { language: 'python', version: '3.10.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  cpp: { language: 'c++', version: '10.2.0' },
  java: { language: 'java', version: '15.0.2' },
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.68.2' },
};

export async function POST(req: Request) {
  try {
    const { challengeId, language, code, testCases: customTestCases } = await req.json();

    if (!challengeId || !language || !code) {
      return NextResponse.json({ error: 'Missing challengeId, language, or code' }, { status: 400 });
    }

    // 1. Fetch challenge details if no custom test cases are provided
    let testCases = customTestCases;
    let timeLimitMs = 2000;
    let functionName = 'solution';

    const { data: challenge, error: challengeErr } = await supabase
      .from('coding_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challengeErr && challenge) {
      timeLimitMs = challenge.time_limit_ms || 2000;
      // Deduce function name from challenge title or use a default camelCase one
      const titleWords = challenge.title.split(' ');
      if (titleWords.length > 0) {
        functionName = titleWords[0].toLowerCase() + titleWords.slice(1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      }
    }

    if (!testCases || testCases.length === 0) {
      const { data: dbTestCases, error: tcErr } = await supabase
        .from('challenge_test_cases')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('is_hidden', false)
        .order('display_order', { ascending: true });

      if (tcErr) {
        return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
      }
      testCases = dbTestCases || [];
    }

    if (testCases.length === 0) {
      return NextResponse.json({ error: 'No public test cases found for this challenge' }, { status: 400 });
    }

    // 2. Execute JavaScript natively via vm module
    if (language === 'javascript') {
      const logs: string[] = [];
      const sandbox = {
        console: {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
        },
        Map,
        Set,
        Array,
        Object,
        Math,
        Date,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      };

      try {
        const context = vm.createContext(sandbox);
        
        // Driver code to evaluate test cases
        const driverCode = `
          ${code}
          
          (function() {
            const testCases = ${JSON.stringify(testCases)};
            const results = [];
            for (let i = 0; i < testCases.length; i++) {
              const tc = testCases[i];
              const startTime = Date.now();
              let output;
              let error = null;
              try {
                // Try camelCase title-derived name first, fallback to solution
                const func = typeof ${functionName} === 'function' ? ${functionName} : (typeof solution === 'function' ? solution : null);
                if (!func) {
                  throw new Error("Function '${functionName}' or 'solution' not found in workspace.");
                }
                output = func(...tc.input_args);
              } catch (e) {
                error = e.message;
              }
              const duration = Date.now() - startTime;
              results.push({
                index: i,
                output: output !== undefined ? output : null,
                error,
                duration
              });
            }
            return results;
          })()
        `;

        const testResults = vm.runInContext(driverCode, context, { timeout: timeLimitMs });

        // Augment each result with pass/fail and expected
        const augmented = (testResults as any[]).map((res: any, i: number) => ({
          ...res,
          expected: testCases[i]?.expected_output ?? null,
          passed: !res.error && deepEqual(res.output, testCases[i]?.expected_output)
        }));

        return NextResponse.json({
          success: true,
          logs,
          results: augmented
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: err.message || 'Execution error',
          status: 'compile_error',
          logs
        });
      }
    }

    // 3. Execute other languages
    if (language === 'python') {
      const snakeFunc = toSnakeCase(functionName);
      const payloadCode = `
${code}

import json
import time

test_cases = ${toPythonLiteral(testCases)}
results = []
for i, tc in enumerate(test_cases):
    start_time = time.time()
    output = None
    error = None
    try:
        func = globals().get('${functionName}') or globals().get('${snakeFunc}') or globals().get('solution')
        if func:
            output = func(*tc['input_args'])
        else:
            raise Exception("Function '${functionName}', '${snakeFunc}', or 'solution' not found.")
    except Exception as e:
        error = str(e)
    duration = int((time.time() - start_time) * 1000)
    results.append({
        "index": i,
        "output": output,
        "error": error,
        "duration": duration
    })

print("__RESULTS__:" + json.dumps(results))
`;

      try {
        const { stdout, stderr, error } = await runPythonLocally(payloadCode, timeLimitMs);
        const outputLogs = stdout.split('
').filter((line: string) => !line.startsWith('__RESULTS__:'));

        if (error) {
          return NextResponse.json({
            success: false,
            error: error === 'Time Limit Exceeded' ? 'Time Limit Exceeded' : (stderr || error),
            status: error === 'Time Limit Exceeded' ? 'time_limit_exceeded' : 'runtime_error',
            logs: outputLogs
          });
        }

        if (stderr) {
          return NextResponse.json({
            success: false,
            error: stderr,
            status: 'runtime_error',
            logs: outputLogs
          });
        }

        const resultLine = stdout.split('
').find((line: string) => line.startsWith('__RESULTS__:'));
        if (!resultLine) {
          return NextResponse.json({
            success: false,
            error: 'Execution completed but results tag was not found. Make sure your function is named properly.',
            logs: outputLogs
          });
        }

        const resultsJson = JSON.parse(resultLine.replace('__RESULTS__:', ''));

        const augmented = resultsJson.map((res: any, i: number) => ({
          ...res,
          expected: testCases[i]?.expected_output ?? null,
          passed: !res.error && deepEqual(res.output, testCases[i]?.expected_output)
        }));

        return NextResponse.json({
          success: true,
          logs: outputLogs,
          results: augmented
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: err.message || 'Python execution error',
          status: 'runtime_error',
          logs: []
        });
      }
    }

    // Default fallback/error for other languages since public Piston is restricted
    const mapped = PISTON_LANG_MAP[language];
    if (!mapped) {
      return NextResponse.json({ error: `Language ${language} execution not supported` }, { status: 400 });
    }

    let payloadCode = code;
    if (language === 'typescript') {
      payloadCode = `
${code}

declare var console: any;
const testCases = ${JSON.stringify(testCases)};
const results: any[] = [];
for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const startTime = Date.now();
  let output;
  let error = null;
  try {
    const globalScope: any = globalThis;
    const func = globalScope['${functionName}'] || globalScope['solution'] || (typeof solution === 'function' ? solution : null);
    if (!func) {
      throw new Error("Function '${functionName}' or 'solution' not found.");
    }
    output = func(...tc.input_args);
  } catch (e: any) {
    error = e.message;
  }
  const duration = Date.now() - startTime;
  results.push({
    index: i,
    output: output !== undefined ? output : null,
    error,
    duration
  });
}
console.log("__RESULTS__:" + JSON.stringify(results));
    `;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s network limit

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: mapped.language,
          version: mapped.version,
          files: [{ content: payloadCode }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Piston API returned status ${response.status}`);
      }

      const execution = await response.json();
      const stdout = execution.run.stdout || '';
      const stderr = execution.run.stderr || '';
      const outputLogs = stdout.split('
').filter((line: string) => !line.startsWith('__RESULTS__:'));

      if (stderr) {
        return NextResponse.json({
          success: false,
          error: stderr,
          status: 'runtime_error',
          logs: outputLogs
        });
      }

      // Try to find the __RESULTS__ tag in stdout
      const resultLine = stdout.split('
').find((line: string) => line.startsWith('__RESULTS__:'));
      if (!resultLine) {
        return NextResponse.json({
          success: false,
          error: 'Execution completed but results tag was not found. Make sure your function is named properly.',
          logs: outputLogs
        });
      }

      const resultsJson = JSON.parse(resultLine.replace('__RESULTS__:', ''));

      return NextResponse.json({
        success: true,
        logs: outputLogs,
        results: resultsJson
      });
    } catch (err: any) {
      console.error('Piston Execution Error:', err);
      return NextResponse.json({
        success: false,
        error: `Piston execution failed (401 Unauthorized/unsupported). Please use Javascript or Python for local runtime.`,
        status: 'runtime_error',
        logs: [err.message]
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}