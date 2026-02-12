import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analysisModel, analysisConfig } from '@/lib/gemini/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { correspondence, relationship_type } = body

  if (!correspondence || !correspondence.trim()) {
    return NextResponse.json({ error: 'correspondence is required' }, { status: 400 })
  }

  const prompt = `Analyze this workplace correspondence and extract a persona profile for the other person (NOT the author).

RELATIONSHIP TYPE: ${relationship_type || 'unknown'}

CORRESPONDENCE:
${correspondence}

Based on the communication patterns, extract:
1. Their first name (or best guess from the messages)
2. Their role/title (infer from context)
3. A 2-3 sentence description of how this person communicates and behaves
4. 3-6 personality traits from this list: detail-oriented, impatient, assertive, perfectionist, results-driven, controlling, supportive, demanding, competitive, passive-aggressive, territorial, helpful, gossipy, defensive, collaborative, dismissive, disengaged, resistant, eager, unreliable, sensitive, ambitious, confrontational, empathetic, formal, procedural, by-the-book, cautious, neutral, probing, arrogant, high-standards, indecisive, aggressive, reasonable, nitpicky, anxious
5. Their communication style: one of "direct", "passive-aggressive", "aggressive", "avoidant", "supportive"
6. Difficulty level for practicing with them: "easy", "medium", or "hard"
7. 3-5 custom behavioral rules (trigger/response pairs) based on patterns you see in the correspondence

Return ONLY a JSON object:
{
  "name": "First name",
  "title": "Their role or title",
  "description": "2-3 sentence description",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "communication_style": "direct",
  "difficulty": "medium",
  "custom_qa": [
    { "trigger": "when you ask about deadlines", "response": "They get defensive and deflect to other priorities", "category": "emotional" },
    { "trigger": "when you push back on their ideas", "response": "They escalate to management", "category": "escalate" }
  ]
}

Valid categories for custom_qa: "emotional", "redirect", "escalate", "boundary"

Respond ONLY with the JSON object, no other text.`

  try {
    const result = await analysisModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { ...analysisConfig, maxOutputTokens: 2048 },
    })

    const text = result.response.text().trim()
    console.log('Gemini raw response (first 500 chars):', text.substring(0, 500))
    
    // Try to find JSON in the response - handle markdown code blocks too
    let jsonStr: string | null = null
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }
    }
    
    if (!jsonStr) {
      throw new Error(`Invalid response format. Response starts with: ${text.substring(0, 200)}`)
    }

    const extracted = JSON.parse(jsonStr)

    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('Error analyzing correspondence:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to analyze correspondence: ${message}` }, { status: 500 })
  }
}
