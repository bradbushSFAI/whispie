'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

posthog.init('phc_pI1dy50VsyIeaJVXc0i8Fb2pw20GF27krvKzcAZbykO', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
})

if (process.env.NODE_ENV === 'development') {
  posthog.opt_out_capturing()
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>
}
