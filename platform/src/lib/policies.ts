export const POLICY_VERSIONS = {
  general: 'v1.0',
  pricing: 'v1.0',
  subscription: 'v1.0',
  course: 'v1.0',
} as const

export interface PolicyContent {
  title: string
  lastUpdated: string
  sections: Array<{
    heading: string
    content: string
  }>
}

export const POLICIES: Record<string, { terms: PolicyContent; privacy: PolicyContent }> = {
  general: {
    terms: {
      title: 'General Terms & Conditions',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          content: 'Welcome to farFindAROLE. By creating an account or accessing our services, you agree to comply with and be bound by these General Terms & Conditions. Please review them carefully.'
        },
        {
          heading: '2. User Accounts',
          content: 'You must provide accurate and complete information during registration. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'
        },
        {
          heading: '3. Acceptable Use',
          content: 'You agree to use our platform only for lawful educational purposes. Any attempts to disrupt, reverse-engineer, or exploit the services will result in immediate termination of your account and potential legal action.'
        },
        {
          heading: '4. Limitation of Liability',
          content: 'Under no circumstances shall farFindAROLE be liable for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to use the platform services.'
        }
      ]
    },
    privacy: {
      title: 'General Privacy Policy',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          content: 'We collect personal information that you provide directly to us, including your name, email address, profile photo, and password hash. We also log analytical telemetry regarding course progress.'
        },
        {
          heading: '2. How We Use Data',
          content: 'We use your personal data to manage user logins, track learning progress, generate personalized certificates, customize AI mentoring outline results, and communicate platform changes.'
        },
        {
          heading: '3. Data Sharing & Security',
          content: 'We do not sell, rent, or trade your personal data to third parties. We use industry-standard encryption protocols (SSL/TLS) to secure and store all user records.'
        },
        {
          heading: '4. Cookies & Trackers',
          content: 'We utilize functional security cookies to keep you logged in across sessions and trace active workspace pings. You can disable cookies in browser options, but it may break session persistence.'
        }
      ]
    }
  },
  pricing: {
    terms: {
      title: 'Pricing T&C & Billing Terms',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Recurring Payments & Subscriptions',
          content: 'All paid tiers (Basic, Pro, Advanced) are billed on a recurring monthly or annual basis depending on your selection. Billed cycles start immediately on activation.'
        },
        {
          heading: '2. Automatic Renewal',
          content: 'To prevent study access disruptions, subscriptions renew automatically at the end of each billing cycle using the payment method on file, unless cancelled beforehand.'
        },
        {
          heading: '3. Cancel Anytime Policy',
          content: 'You can cancel auto-renewal at any time directly through your account billing settings. Once cancelled, your premium access continues until the end of your prepaid period.'
        },
        {
          heading: '4. Refund Restrictions',
          content: 'Prepaid monthly and annual license fees are non-refundable. Prorated credits may be calculated and applied automatically if upgrading to higher-tier configurations.'
        }
      ]
    },
    privacy: {
      title: 'Pricing Data Privacy Policy',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Collection of Billing Data',
          content: 'To process upgrades, we collect information regarding your selected billing period, pricing tier, currency, and invoice reference metadata. Your raw payment cards are never stored on our servers.'
        },
        {
          heading: '2. Third-Party Payment Processor',
          content: 'We integrate with Stripe to handle checkouts securely. Stripe manages billing information under strict PCI-DSS compliance regulations.'
        }
      ]
    }
  },
  subscription: {
    terms: {
      title: 'Subscription Purchase Agreement',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. License Grants',
          content: 'Upon successful checkout, you receive a personal, non-exclusive, non-transferable license to access the selected subscription content tier. Sharing licenses is strictly forbidden.'
        },
        {
          heading: '2. Payment Authorization',
          content: 'By confirming purchase, you authorize farFindAROLE (via Stripe) to charge the current fee plus applicable taxes to your specified payment method on a recurring basis.'
        },
        {
          heading: '3. Downgrades & Upgrades',
          content: 'Upgrades to higher plan levels take effect immediately and are billed on a prorated basis. Downgrading to lower paid tiers or the Free tier is disabled during active paid billing cycles.'
        }
      ]
    },
    privacy: {
      title: 'Subscription Privacy Guidelines',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Checkout Data Synchronization',
          content: 'We synchronize user metadata (IDs, emails) with Stripe Checkout sessions to securely match payments to user accounts and activate access instantly upon success.'
        },
        {
          heading: '2. Webhook Event Tracking',
          content: 'We process secure webhook signals from Stripe regarding billing changes (checkout success, subscription updates, or deleted plans) to update user levels dynamically.'
        }
      ]
    }
  },
  course: {
    terms: {
      title: 'Course Access & Certificate Terms',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Learning Content Usage Rules',
          content: 'All learning resources (syllabi, code snippets, interactive quizzes, video playbacks, AI mentoring outputs) are copyrighted assets. Copying or redistribution is prohibited.'
        },
        {
          heading: '2. Anti-sharing & Account Integrity',
          content: 'Access is bound to your personal credentials. Sharing account access to bypass course paywalls will lead to immediate account suspension and revocation of all progress.'
        },
        {
          heading: '3. Certificate Eligibility',
          content: 'Graduation credentials and verifiable certificates are issued exclusively upon 100% completion of course lessons, checkpoints, and quizzes. Falsifying progress resets credentials.'
        },
        {
          heading: '4. Classroom Environment',
          content: 'You must maintain polite and professional conduct inside comment boards, discussion loops, and shared coding tasks. Harassment results in instant ban.'
        }
      ]
    },
    privacy: {
      title: 'Learning Analytics Privacy Policy',
      lastUpdated: 'June 21, 2026',
      sections: [
        {
          heading: '1. Progress Track & Logging',
          content: 'We track lesson start and completion timestamps, quiz scores, and certificate issuance records. This is stored in your user profile to show progress graphs.'
        },
        {
          heading: '2. Mentoring Chat History Logs',
          content: 'Conversations with the AI Mentor floating widget are logged to cache queries and maintain chat context across refresh states. Chat histories are private to your account.'
        }
      ]
    }
  }
}
