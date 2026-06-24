export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getInvoiceResendEmail } from '@/lib/email-templates'
import { getAllUsers } from '@/lib/server-store'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user && user.email === 'admin@farfindarole.com') {
      return true
    }
  }
  return false
}

export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false })

    if (search) {
      query = query.or(`invoice_number.ilike.