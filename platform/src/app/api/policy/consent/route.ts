export const runtime = 'edge';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(req: NextRequest) {
  try {
    // 1. Validate User Session from JWT in Authorization Header
    const authHeader = req.headers.get('Authorization')
    let userId = ''
    let token = ''
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
      // Initialize a temp client to authenticate the user
      const tempClient = createClient(supabaseUrl, supabaseKey)
      const { data: { user }, error: authError } = await tempClient.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    }

    const body = await req.json().catch(() => ({}))
    const { 
      policy_type, 
      policy_version = 'v1.0', 
      accepted = true, 
      plan_name, 
      billing_period, 
      source_page 
    } = body

    // Fallback to body's userId for local testing only if authorization header is not provided
    let finalUserId = userId
    if (!finalUserId && body.userId) {
      finalUserId = body.userId
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'Unauthorized: Access token is missing or invalid' }, { status: 401 })
    }

    if (!policy_type) {
      return NextResponse.json({ error: 'Missing policy_type' }, { status: 400 })
    }

    // 2. Initialize Supabase client with the user's token if we have it, or service role key if available
    let dbClient
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      dbClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    } else if (token) {
      // Pass the user's token so that RLS check (auth.uid() = user_id) is satisfied
      dbClient = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })
    } else {
      // In local testing, if we bypass auth header, we might try to use anon key directly.
      // But RLS might fail if it checks auth.uid().
      dbClient = createClient(supabaseUrl, supabaseKey)
    }

    // 3. Record the consent in policy_consents
    const { data, error } = await dbClient
      .from('policy_consents')
      .insert({
        user_id: finalUserId,
        policy_type,
        policy_version,
        accepted,
        plan_name: plan_name || null,
        billing_period: billing_period || null,
        source_page: source_page || 'web_app'
      })
      .select()

    if (error) {
      console.error('Database error recording policy consent:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, consent: data?.[0] || null })
  } catch (err: any) {
    console.error('Error in policy consent API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}