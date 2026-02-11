import type { Persona, Scenario } from '@/types/database'

export function buildSystemPrompt(persona: Persona, scenario: Scenario): string {
  const traitsDescription = persona.personality_traits.join(', ')
  const objectivesList = scenario.objectives
    .map((obj, i) => `${i + 1}. ${obj}`)
    .join('\n')

  return `You are roleplaying as ${persona.name}, ${persona.title}.

## Your Character
- **Description:** ${persona.description}
- **Personality Traits:** ${traitsDescription}
- **Communication Style:** ${persona.communication_style}

## Scenario Context
${scenario.context}

## Your Role
Stay fully in character as ${persona.name} throughout the conversation. React authentically based on your personality traits and communication style. You are not an AI assistant - you ARE this character.

## Guidelines
1. Never break character or acknowledge you are an AI
2. Respond naturally as this person would in a real workplace conversation
3. Keep responses concise (2-4 sentences typically, unless the situation calls for more)
4. Show authentic emotional reactions based on your character's personality
5. If the user is doing well, gradually become slightly more receptive (but stay in character)
6. If the user is being rude or aggressive, react as your character naturally would

${persona.custom_qa && persona.custom_qa.length > 0 ? `## Behavioral Rules (follow these naturally during the conversation)
${persona.custom_qa.map(qa => `- When ${qa.trigger}: ${qa.response}`).join('\n')}

` : ''}## User's Hidden Objectives (do not reference these directly)
The user is practicing workplace communication. Their goals are:
${objectivesList}

React naturally - don't make it too easy, but don't be impossible to work with either. The goal is realistic practice.

Start the conversation in character. Your opening line should set the scene based on the scenario context.`
}

export function buildAnalysisPrompt(
  scenario: Scenario,
  messages: Array<{ role: string; content: string }>
): string {
  const conversationText = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'User' : 'AI Persona'}: ${m.content}`)
    .join('\n\n')

  const objectivesList = scenario.objectives
    .map((obj, i) => `${i + 1}. ${obj}`)
    .join('\n')

  return `Analyze this workplace conversation practice session.

## Scenario
**Title:** ${scenario.title}
**Context:** ${scenario.context}

## User's Objectives
${objectivesList}

## Conversation
${conversationText}

## Analysis Required
Provide a JSON response with this exact structure:
{
  "overall_score": <0-100>,
  "clarity_score": <0-100>,
  "empathy_score": <0-100>,
  "assertiveness_score": <0-100>,
  "professionalism_score": <0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "2-3 sentence summary of how they did"
}

## Scoring Criteria
- **Overall:** How well did they achieve their objectives?
- **Clarity:** Were their points communicated clearly?
- **Empathy:** Did they acknowledge the other person's perspective?
- **Assertiveness:** Did they advocate for themselves appropriately?
- **Professionalism:** Did they maintain professional tone and boundaries?

Be constructive but honest. This is a learning tool.

Respond ONLY with the JSON object, no other text.`
}
