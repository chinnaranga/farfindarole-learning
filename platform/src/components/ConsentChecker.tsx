'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PolicyModal from './PolicyModal'

export default function ConsentChecker() {
  const [userId, setUserId] = useState<string | null>(null)
  const [needsConsent, setNeedsConsent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkConsent() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }
        setUserId(user.id)

        // Query consents for this user for the current version v1.0
        const { data: consents, error } = await supabase
          .from('policy_consents')
          .select('policy_type')
          .eq('user_id', user.id)
          .eq('policy_version', 'v1.0')

        if (error) {
          if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn('policy_consents table does not exist in Supabase yet. Please execute scripts/create-policy-consents.sql in your Supabase SQL Editor.')
            setLoading(false)
            return
          }
          throw error
        }

        const acceptedTypes = new Set(consents?.map((c: any) => c.policy_type) || [])
        
        // If they lack general signup terms or privacy policy consents for v1.0, prompt re-consent
        const missingTerms = !acceptedTypes.has('signup_terms')
        const missingPrivacy = !acceptedTypes.has('signup_privacy')

        if (missingTerms || missingPrivacy) {
          setNeedsConsent(true)
        }
      } catch (err) {
        console.error('Error checking policy consent:', err)
      } finally {
        setLoading(false)
      }
    }

    checkConsent()
  }, [])

  const handleAccept = async () => {
    if (!userId) return

    try {
      // Record both consents in the database
      const { error } = await supabase
        .from('policy_consents')
        .insert([
          { user_id: userId, policy_type: 'signup_terms', policy_version: 'v1.0', accepted: true, source_page: 'reconsent_prompt' },
          { user_id: userId, policy_type: 'signup_privacy', policy_version: 'v1.0', accepted: true, source_page: 'reconsent_prompt' }
        ])

      if (error) throw error
      setNeedsConsent(false)
    } catch (err) {
      console.error('Failed to save policy consent:', err)
    }
  }

  if (loading || !needsConsent) return null

  return (
    <PolicyModal
      isOpen={needsConsent}
      policyType="general"
      isUndismissible={true}
      showAcceptDecline={true}
      onAccept={handleAccept}
    />
  )
}
