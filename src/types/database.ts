// Database types for Whispie
// These will be auto-generated later with: npx supabase gen types typescript

export type Profile = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: string | null
  industry: string | null
  experience_level: string | null
  onboarding_completed: boolean
  tier: 'free' | 'pro'
  scenarios_used_this_month: number
  voice_credits: number
  // Gamification fields
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  last_practice_date: string | null
  total_conversations: number
  total_practice_minutes: number
  created_at: string
  updated_at: string
}

export type Persona = {
  id: string
  name: string
  title: string
  description: string
  personality_traits: string[]
  communication_style: string
  avatar_url: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  is_active: boolean
  created_at: string
}

export type Scenario = {
  id: string
  title: string
  description: string
  category: string
  context: string
  objectives: string[]
  persona_id: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_turns: number
  is_premium: boolean
  is_active: boolean
  created_at: string
}

export type Conversation = {
  id: string
  user_id: string
  scenario_id: string | null
  persona_id: string | null
  status: 'active' | 'completed' | 'abandoned'
  started_at: string
  completed_at: string | null
  total_turns: number
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export type Analysis = {
  id: string
  conversation_id: string
  overall_score: number | null
  clarity_score: number | null
  empathy_score: number | null
  assertiveness_score: number | null
  professionalism_score: number | null
  strengths: string[] | null
  improvements: string[] | null
  summary: string | null
  created_at: string
}

export type Achievement = {
  id: string
  key: string
  name: string
  description: string
  icon: string
  xp_reward: number
  category: 'milestone' | 'streak' | 'skill' | 'special'
  requirement_value: number | null
  is_active: boolean
  created_at: string
}

export type UserAchievement = {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}

// Supabase Database type
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      personas: {
        Row: Persona
        Insert: Omit<Persona, 'id' | 'created_at'>
        Update: Partial<Omit<Persona, 'id' | 'created_at'>>
      }
      scenarios: {
        Row: Scenario
        Insert: Omit<Scenario, 'id' | 'created_at'>
        Update: Partial<Omit<Scenario, 'id' | 'created_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'>
        Update: Partial<Omit<Conversation, 'id' | 'created_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      analyses: {
        Row: Analysis
        Insert: Omit<Analysis, 'id' | 'created_at'>
        Update: Partial<Omit<Analysis, 'id' | 'created_at'>>
      }
    }
  }
}
