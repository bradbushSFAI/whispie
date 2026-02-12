import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { model, generationConfig } from '@/lib/gemini/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { persona_id, correspondence } = body

  if (!persona_id) {
    return NextResponse.json({ error: 'persona_id is required' }, { status: 400 })
  }

  // Fetch the persona
  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', persona_id)
    .single()

  if (!persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  const prompt = `Based on this persona and ${correspondence ? 'their correspondence' : 'their description'}, generate a practice scenario.

PERSONA:
- Name: ${persona.name}
- Title: ${persona.title}
- Description: ${persona.description}
- Personality: ${persona.personality_traits?.join(', ')}
- Communication style: ${persona.communication_style}
- Difficulty: ${persona.difficulty}

${correspondence ? `CORRESPONDENCE:\n${correspondence}\n` : ''}

Generate a realistic workplace scenario for practicing a difficult conversation with this person. Return ONLY a JSON object:
{
  "title": "Short scenario title (under 60 chars)",
  "category": "feedback" | "negotiation" | "conflict",
  "context": "2-3 sentence description of the situation from the user's perspective",
  "objectives": ["objective 1", "objective 2", "objective 3"]
}

Respond ONLY with the JSON object, no other text.`

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { ...generationConfig, maxOutputTokens: 1024 },
    })

    const text = result.response.text().trim()
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const generated = JSON.parse(jsonMatch[0])

    // Create the scenario
    const { data: scenario, error: createError } = await supabase
      .from('scenarios')
      .insert({
        title: generated.title,
        description: generated.context?.slice(0, 200) || '',
        category: generated.category || 'conflict',
        context: generated.context,
        objectives: generated.objectives || ['Practice this conversation effectively'],
        persona_id,
        difficulty: persona.difficulty,
        estimated_turns: 10,
        is_premium: false,
        is_active: true,
        created_by: user.id,
        source: 'user',
        is_public: false,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating generated scenario:', createError)
      return NextResponse.json({ error: 'Failed to save scenario' }, { status: 500 })
    }

    return NextResponse.json({ scenario, generated }, { status: 201 })
  } catch (err) {
    console.error('Error generating scenario:', err)
    return NextResponse.json({ error: 'Failed to generate scenario' }, { status: 500 })
  }
}
