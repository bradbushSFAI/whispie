'use client'

import posthog from 'posthog-js'

// Event names
export const EVENTS = {
  SIGNUP: 'user_signed_up',
  LOGIN: 'user_logged_in',
  SCENARIO_STARTED: 'scenario_started',
  CONVERSATION_COMPLETED: 'conversation_completed',
  ANALYSIS_VIEWED: 'analysis_viewed',
  RATE_LIMIT_HIT: 'rate_limit_hit',
} as const

// Track a signup event
export function trackSignup(userId: string) {
  posthog.identify(userId)
  posthog.capture(EVENTS.SIGNUP)
}

// Track a login event
export function trackLogin(userId: string) {
  posthog.identify(userId)
  posthog.capture(EVENTS.LOGIN)
}

// Track when a user starts a scenario
export function trackScenarioStarted(scenarioId: string, scenarioTitle: string, category: string) {
  posthog.capture(EVENTS.SCENARIO_STARTED, {
    scenario_id: scenarioId,
    scenario_title: scenarioTitle,
    category,
  })
}

// Track when a conversation is completed
export function trackConversationCompleted(
  conversationId: string,
  scenarioId: string,
  totalTurns: number
) {
  posthog.capture(EVENTS.CONVERSATION_COMPLETED, {
    conversation_id: conversationId,
    scenario_id: scenarioId,
    total_turns: totalTurns,
  })
}

// Track when analysis is viewed
export function trackAnalysisViewed(
  conversationId: string,
  overallScore: number | null
) {
  posthog.capture(EVENTS.ANALYSIS_VIEWED, {
    conversation_id: conversationId,
    overall_score: overallScore,
  })
}

// Track rate limit hit
export function trackRateLimitHit(userId: string, scenariosUsed: number) {
  posthog.capture(EVENTS.RATE_LIMIT_HIT, {
    user_id: userId,
    scenarios_used: scenariosUsed,
  })
}

// Identify user with properties
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthog.identify(userId, properties)
}

// Reset user (on logout)
export function resetUser() {
  posthog.reset()
}
