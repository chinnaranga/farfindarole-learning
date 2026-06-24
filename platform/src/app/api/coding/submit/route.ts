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
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None');
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

// Clean and extract trigrams for similarity
function getTrigrams(str: string): Set<string> {
  const trigrams = new Set<string>();
  const cleaned = str.replace(/\s+/g, ''); // ignore all spaces and newlines
  if (cleaned.length < 3) return new Set([cleaned]);
  for (let i = 0; i < cleaned.length - 2; i++) {
    trigrams.add(cleaned.substring(i, i + 3));
  }
  return trigrams;
}

// Calculate similarity index
function calculateJaccardSimilarity(code1: string, code2: string): number {
  const t1 = getTrigrams(code1);
  const t2 = getTrigrams(code2);
  if (t1.size === 0 && t2.size === 0) return 1.0;
  
  let intersection = 0;
  t1.forEach(tg => {
    if (t2.has(tg)) intersection++;
  });
  
  const union = t1.size + t2.size - intersection;
  return Number((intersection / union).toFixed(4));
}

// Deep equal output comparison with type-coercion fallback
function deepEqual(val1: any, val2: any): boolean {
  // Direct equality
  if (val1 === val2) return true;

  // Null checks
  if (val1 === null || val2 === null) return val1 === val2;
  if (val1 === undefined || val2 === undefined) return val1 === val2;

  // Type coercion for scalars: allow number 2 == "2" type mismatches from DB
  if (typeof val1 !== 'object' && typeof val2 !== 'object') {
    return String(val1) === String(val2);
  }

  if (typeof val1 !== typeof val2) return false;

  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    // Order-insensitive for purely numeric arrays (Two Sum style)
    const allNum1 = val1.every(v => typeof v === 'number');
    const allNum2 = val2.every(v => typeof v === 'number');
    if (allNum1 && allNum2) {
      const s1 = [...val1].sort((a, b) => a - b);
      const s2 = [...val2].sort((a, b) => a - b);
      return s1.every((v, i) => v === s2[i]);
    }
    // Order-sensitive for string/mixed arrays
    return val1.every((v, i) => deepEqual(v, val2[i]));
  }

  if (Array.isArray(val1) !== Array.isArray(val2)) return false;

  if (typeof val1 === 'object') {
    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => deepEqual(val1[key], val2[key]));
  }

  // Final fallback: JSON string compare
  try { return JSON.stringify(val1) === JSON.stringify(val2); } catch { return false; }
}

export async function POST(req: Request) {
  try {
    const { challengeId, language, code, userId } = await req.json();

    if (!challengeId || !language || !code || !userId) {
      return NextResponse.json({ error: 'Missing challengeId, language, code, or userId' }, { status: 400 });
    }

    // Security Check: owner authorization verification
    const authUserId = req.headers.get('x-user-id');
    if (!authUserId || authUserId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch challenge info and ALL test cases (both public and hidden)
    const { data: challenge, error: challengeErr } = await supabase
      .from('coding_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeErr || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const { data: testCases, error: tcErr } = await supabase
      .from('challenge_test_cases')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('display_order', { ascending: true });

    if (tcErr || !testCases || testCases.length === 0) {
      return NextResponse.json({ error: 'Test cases not found' }, { status: 404 });
    }

    const timeLimitMs = challenge.time_limit_ms || 2000;
    const pointsAwarded = challenge.points || 50;
    const challengeDifficulty = challenge.difficulty || 'medium';
    
    // Deduce function name
    const titleWords = challenge.title.split(' ');
    const functionName = titleWords.length > 0
      ? titleWords[0].toLowerCase() + titleWords.slice(1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
      : 'solution';

    let execResults: any[] = [];
    let logs: string[] = [];
    let executionStatus = 'accepted';
    let runtimeMs = 0;
    let compileErrorText = '';

    // 2. Perform Code Plagiarism check
    let highestPlagScore = 0;
    const { data: acceptedSubmissions } = await supabase
      .from('challenge_submissions')
      .select('submitted_code')
      .eq('challenge_id', challengeId)
      .eq('status', 'accepted')
      .neq('user_id', userId)
      .limit(10); // Check against last 10 successful submissions

    if (acceptedSubmissions && acceptedSubmissions.length > 0) {
      for (const sub of acceptedSubmissions) {
        const sim = calculateJaccardSimilarity(code, sub.submitted_code);
        if (sim > highestPlagScore) {
          highestPlagScore = sim;
        }
      }
    }

    // 3. Execute code
    if (language === 'javascript') {
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

        execResults = vm.runInContext(driverCode, context, { timeout: timeLimitMs });
      } catch (err: any) {
        executionStatus = 'compile_error';
        compileErrorText = err.message || 'Compilation error';
      }
    } else if (language === 'python') {
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
        logs = stdout.split('\n').filter((line: string) => !line.startsWith('__RESULTS__:'));

        if (error) {
          executionStatus = error === 'Time Limit Exceeded' ? 'time_limit_exceeded' : 'runtime_error';
          compileErrorText = error === 'Time Limit Exceeded' ? 'Time Limit Exceeded' : (stderr || error);
        } else if (stderr) {
          executionStatus = 'runtime_error';
          compileErrorText = stderr;
        } else {
          const resultLine = stdout.split('\n').find((line: string) => line.startsWith('__RESULTS__:'));
          if (!resultLine) {
            executionStatus = 'failed';
            compileErrorText = 'Execution finished but failed to retrieve results wrapper.';
          } else {
            execResults = JSON.parse(resultLine.replace('__RESULTS__:', ''));
          }
        }
      } catch (err: any) {
        executionStatus = 'runtime_error';
        compileErrorText = err.message || 'Python execution error';
      }
    } else {
      // Execute via Piston API fallback for other languages (if authorized)
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
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: mapped.language,
            version: mapped.version,
            files: [{ content: payloadCode }]
          })
        });

        if (!response.ok) {
          throw new Error(`Piston error: ${response.statusText}`);
        }

        const execution = await response.json();
        const stdout = execution.run.stdout || '';
        const stderr = execution.run.stderr || '';
        logs = stdout.split('\n').filter((line: string) => !line.startsWith('__RESULTS__:'));

        if (stderr) {
          executionStatus = 'runtime_error';
          compileErrorText = stderr;
        } else {
          const resultLine = stdout.split('\n').find((line: string) => line.startsWith('__RESULTS__:'));
          if (!resultLine) {
            executionStatus = 'failed';
            compileErrorText = 'Execution finished but failed to retrieve results wrapper.';
          } else {
            execResults = JSON.parse(resultLine.replace('__RESULTS__:', ''));
          }
        }
      } catch (err: any) {
        executionStatus = 'runtime_error';
        compileErrorText = `Piston execution failed (401 Unauthorized/unsupported). Please use Javascript or Python for local runtime.`;
      }
    }

    // 4. Verify outputs against expectations
    let passedCases = 0;
    const totalCases = testCases.length;
    let caseErrors: string[] = [];

    if (executionStatus === 'accepted' || executionStatus === 'failed') {
      // Always evaluate all cases regardless of intermediate failures
      execResults.forEach((res: any, i: number) => {
        const expected = testCases[i]?.expected_output;
        runtimeMs += (res.duration || 0);

        if (res.error) {
          caseErrors.push(`Case ${i + 1}: Runtime error — ${res.error}`);
        } else if (deepEqual(res.output, expected)) {
          passedCases++;
        } else {
          caseErrors.push(`Case ${i + 1}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(res.output)}`);
        }
      });

      executionStatus = passedCases === totalCases ? 'accepted' : 'failed';
      if (!compileErrorText && caseErrors.length > 0) {
        compileErrorText = caseErrors.join('\n');
      }
    }

    // Flag plagiarism if similarity > 75%
    if (highestPlagScore > 0.75) {
      executionStatus = 'plagiarized';
    }

    // 5. Save submission to database
    const { error: subErr } = await supabase
      .from('challenge_submissions')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        language,
        submitted_code: code,
        status: executionStatus,
        passed_cases: passedCases,
        total_cases: totalCases,
        runtime_ms: runtimeMs,
        plagiarism_score: highestPlagScore * 100,
        ai_feedback: executionStatus === 'accepted' ? 'Great job! Clean solution.' : (compileErrorText || 'Failed test cases.')
      });

    if (subErr) {
      console.error('Failed to log submission:', subErr);
    }

    // 6. Update user stats & streak if solution accepted and not plagiarized
    let statsUpdated = false;
    let earnedBadges: string[] = [];

    if (executionStatus === 'accepted') {
      // Fetch or create user coding stats
      const { data: currentStats, error: statsFetchErr } = await supabase
        .from('user_coding_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const todayStr = new Date().toISOString().split('T')[0];
      let streak = currentStats?.streak_days ?? 0;
      let solved = currentStats?.problems_solved ?? 0;
      let xp = currentStats?.xp_points ?? 0;
      let langMap = currentStats?.languages_used ?? {};
      let diffMap = currentStats?.difficulty_solved ?? { easy: 0, medium: 0, hard: 0, project: 0 };

      // Update languages count
      langMap[language] = (langMap[language] || 0) + 1;
      
      // Update difficulty count
      diffMap[challengeDifficulty] = (diffMap[challengeDifficulty] || 0) + 1;

      // Handle coding streak
      if (currentStats) {
        const lastSubmitDate = currentStats.last_submit_date;
        if (lastSubmitDate) {
          const lastDate = new Date(lastSubmitDate);
          const today = new Date(todayStr);
          const diffTime = Math.abs(today.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            streak += 1;
          } else if (diffDays > 1) {
            streak = 1;
          }
          // if diffDays === 0, keep same streak (already submitted today)
        } else {
          streak = 1;
        }
        solved += 1;
        xp += pointsAwarded;
      } else {
        streak = 1;
        solved = 1;
        xp = pointsAwarded;
      }

      // Upsert stats
      const { error: upsertErr } = await supabase
        .from('user_coding_stats')
        .upsert({
          user_id: userId,
          problems_solved: solved,
          streak_days: streak,
          xp_points: xp,
          languages_used: langMap,
          difficulty_solved: diffMap,
          last_submit_date: todayStr
        });

      if (!upsertErr) {
        statsUpdated = true;

        // Check and award badges
        const awardsToCheck = [
          { id: 'first_solve', threshold: 1, type: 'solve' },
          { id: 'solve_10', threshold: 10, type: 'solve' },
          { id: 'polyglot', threshold: 3, type: 'languages' }
        ];

        for (const award of awardsToCheck) {
          let shouldAward = false;
          if (award.type === 'solve' && solved >= award.threshold) {
            shouldAward = true;
          } else if (award.type === 'languages' && Object.keys(langMap).length >= award.threshold) {
            shouldAward = true;
          }

          if (shouldAward) {
            const { error: badgeErr } = await supabase
              .from('user_badges')
              .insert({
                user_id: userId,
                badge_id: award.id
              });
            
            if (!badgeErr) {
              earnedBadges.push(award.id);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: executionStatus,
      passedCases,
      totalCases,
      runtimeMs,
      plagiarismScore: highestPlagScore * 100,
      compileError: compileErrorText,
      earnedBadges,
      statsUpdated
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
