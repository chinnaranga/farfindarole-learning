import { sendEmail } from './email'

export interface Job {
  id: string
  name: string
  data: any
  runAt: number
  retries: number
}

const queue: Job[] = []

/**
 * Pushes a job to the in-memory task runner queue.
 */
export function enqueueJob(name: string, data: any, delayMs: number = 0) {
  const id = `${name}-${Math.random().toString(36).substring(2, 9)}`
  const runAt = Date.now() + delayMs
  queue.push({ id, name, data, runAt, retries: 0 })
  console.log(`[QUEUE-MANAGER] Job enqueued: ${name} (id: ${id}) scheduled to run in ${delayMs}ms`)
  
  // Fire off non-blocking timer to process
  setTimeout(() => {
    processJobs().catch(err => console.error('[QUEUE-MANAGER] Job processing error:', err))
  }, delayMs)
}

/**
 * Scans the active queue list and executes ready jobs.
 */
export async function processJobs() {
  const now = Date.now()
  const jobsToRun = queue.filter(j => j.runAt <= now)
  
  for (const job of jobsToRun) {
    const idx = queue.findIndex(q => q.id === job.id)
    if (idx > -1) queue.splice(idx, 1)
    
    console.log(`[QUEUE-MANAGER] Processing job: ${job.name} (id: ${job.id})`)
    try {
      if (job.name === 'send_email_retry') {
        const { params } = job.data
        const result = await sendEmail(params)
        if (!result.success && job.retries < 3) {
          job.retries++
          job.runAt = Date.now() + Math.pow(3, job.retries) * 1000 // Exponential backoff (3s, 9s, 27s)
          queue.push(job)
          console.warn(`[QUEUE-MANAGER] Job failed, re-scheduled retry #${job.retries} for id ${job.id}: ${result.error}`)
        }
      }
    } catch (err) {
      console.error(`[QUEUE-MANAGER] Error executing job ${job.id}:`, err)
    }
  }
}
