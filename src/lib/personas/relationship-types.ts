import type { CustomQA } from '@/types/database'

export type QATemplate = {
  prompt: string
  category: CustomQA['category']
}

export type RelationshipType = {
  key: string
  label: string
  icon: string
  tag: string
  suggestedTraits: string[]
  communicationStyles: string[]
  qaTemplates: QATemplate[]
}

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  {
    key: 'boss',
    label: 'Boss / Manager',
    icon: '👔',
    tag: 'boss',
    suggestedTraits: [
      'detail-oriented', 'impatient', 'assertive', 'perfectionist',
      'results-driven', 'controlling', 'supportive', 'demanding',
    ],
    communicationStyles: ['direct', 'passive-aggressive', 'aggressive', 'avoidant'],
    qaTemplates: [
      { prompt: 'What happens when you disagree with them?', category: 'redirect' },
      { prompt: 'How do they react to bad news?', category: 'emotional' },
      { prompt: "What's their pet peeve?", category: 'boundary' },
    ],
  },
  {
    key: 'coworker',
    label: 'Coworker / Peer',
    icon: '👥',
    tag: 'peer',
    suggestedTraits: [
      'competitive', 'passive-aggressive', 'territorial', 'helpful',
      'gossipy', 'defensive', 'collaborative', 'dismissive',
    ],
    communicationStyles: ['passive-aggressive', 'direct', 'avoidant', 'supportive'],
    qaTemplates: [
      { prompt: 'How do they respond when you need help?', category: 'redirect' },
      { prompt: 'What happens when credit is shared?', category: 'boundary' },
      { prompt: 'How do they act in meetings vs. 1:1?', category: 'emotional' },
    ],
  },
  {
    key: 'employee',
    label: 'Employee / Direct Report',
    icon: '📋',
    tag: 'employee',
    suggestedTraits: [
      'defensive', 'disengaged', 'resistant', 'eager',
      'unreliable', 'sensitive', 'ambitious', 'confrontational',
    ],
    communicationStyles: ['avoidant', 'passive-aggressive', 'direct', 'supportive'],
    qaTemplates: [
      { prompt: 'How do they react to constructive feedback?', category: 'emotional' },
      { prompt: 'What excuses do they commonly make?', category: 'redirect' },
      { prompt: 'How do they respond to deadlines?', category: 'boundary' },
    ],
  },
  {
    key: 'client',
    label: 'Client / Customer',
    icon: '🤝',
    tag: 'client',
    suggestedTraits: [
      'demanding', 'impatient', 'high-standards', 'results-driven',
      'indecisive', 'aggressive', 'reasonable', 'nitpicky',
    ],
    communicationStyles: ['aggressive', 'direct', 'passive-aggressive', 'supportive'],
    qaTemplates: [
      { prompt: "What's their biggest concern?", category: 'emotional' },
      { prompt: 'How do they react to pushback on scope?', category: 'escalate' },
      { prompt: 'What triggers escalation?', category: 'escalate' },
    ],
  },
  {
    key: 'hr',
    label: 'HR / Interviewer',
    icon: '💼',
    tag: 'hr',
    suggestedTraits: [
      'formal', 'procedural', 'empathetic', 'by-the-book',
      'cautious', 'neutral', 'probing', 'supportive',
    ],
    communicationStyles: ['direct', 'supportive', 'avoidant', 'passive-aggressive'],
    qaTemplates: [
      { prompt: 'How do they handle emotional conversations?', category: 'emotional' },
      { prompt: 'What policies do they always reference?', category: 'redirect' },
      { prompt: 'How do they react when you challenge a decision?', category: 'boundary' },
    ],
  },
  {
    key: 'other',
    label: 'Other',
    icon: '🎭',
    tag: 'other',
    suggestedTraits: [
      'assertive', 'passive-aggressive', 'direct', 'avoidant',
      'supportive', 'demanding', 'empathetic', 'confrontational',
    ],
    communicationStyles: ['direct', 'passive-aggressive', 'aggressive', 'avoidant', 'supportive'],
    qaTemplates: [
      { prompt: 'How do they typically react under pressure?', category: 'emotional' },
      { prompt: 'What behavior frustrates you most?', category: 'boundary' },
      { prompt: 'How do they respond to direct confrontation?', category: 'redirect' },
    ],
  },
]

export const COMMUNICATION_STYLES = [
  'direct',
  'passive-aggressive',
  'aggressive',
  'avoidant',
  'supportive',
] as const

export const ALL_TRAITS = [
  'detail-oriented', 'impatient', 'assertive', 'perfectionist',
  'results-driven', 'controlling', 'supportive', 'demanding',
  'competitive', 'passive-aggressive', 'territorial', 'helpful',
  'gossipy', 'defensive', 'collaborative', 'dismissive',
  'disengaged', 'resistant', 'eager', 'unreliable',
  'sensitive', 'ambitious', 'confrontational', 'empathetic',
  'formal', 'procedural', 'by-the-book', 'cautious',
  'neutral', 'probing', 'arrogant', 'high-standards',
  'indecisive', 'aggressive', 'reasonable', 'nitpicky',
  'anxious',
] as const
