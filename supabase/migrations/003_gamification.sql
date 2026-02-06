-- Whispie Gamification Schema
-- Adds XP, leveling, streaks, and achievements

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================

-- Add gamification columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_practice_date date,
ADD COLUMN IF NOT EXISTS total_conversations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_practice_minutes integer DEFAULT 0;

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  key text UNIQUE NOT NULL, -- e.g., 'first_conversation', 'streak_7'
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- emoji or icon name
  xp_reward integer DEFAULT 0,
  category text NOT NULL, -- 'milestone', 'streak', 'skill', 'special'
  requirement_value integer, -- e.g., 7 for 7-day streak
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- USER ACHIEVEMENTS (junction table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements ON DELETE CASCADE NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view active achievements"
  ON public.achievements FOR SELECT
  USING (is_active = true);

-- Users can view their own unlocked achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert achievements for users (via service role)
CREATE POLICY "Users can unlock achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================

INSERT INTO public.achievements (key, name, description, icon, xp_reward, category, requirement_value) VALUES
  -- Milestones
  ('first_conversation', 'First Steps', 'Complete your first conversation', '🎯', 50, 'milestone', 1),
  ('conversations_5', 'Getting Started', 'Complete 5 conversations', '📚', 100, 'milestone', 5),
  ('conversations_10', 'Dedicated Learner', 'Complete 10 conversations', '🎓', 200, 'milestone', 10),
  ('conversations_25', 'Communication Pro', 'Complete 25 conversations', '💼', 500, 'milestone', 25),
  ('conversations_50', 'Master Communicator', 'Complete 50 conversations', '🏆', 1000, 'milestone', 50),

  -- Streaks
  ('streak_3', 'On a Roll', 'Maintain a 3-day practice streak', '🔥', 75, 'streak', 3),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day practice streak', '⚡', 150, 'streak', 7),
  ('streak_14', 'Unstoppable', 'Maintain a 14-day practice streak', '💪', 300, 'streak', 14),
  ('streak_30', 'Legendary', 'Maintain a 30-day practice streak', '👑', 750, 'streak', 30),

  -- Skill
  ('score_80', 'Skilled Talker', 'Score 80+ on a conversation', '⭐', 100, 'skill', 80),
  ('score_90', 'Expert Negotiator', 'Score 90+ on a conversation', '🌟', 200, 'skill', 90),
  ('score_100', 'Perfect Score', 'Achieve a perfect 100 score', '💎', 500, 'skill', 100),
  ('all_categories', 'Well Rounded', 'Complete scenarios in all categories', '🎭', 250, 'skill', NULL),

  -- Special
  ('night_owl', 'Night Owl', 'Practice after 10 PM', '🦉', 50, 'special', NULL),
  ('early_bird', 'Early Bird', 'Practice before 7 AM', '🐦', 50, 'special', NULL),
  ('weekend_warrior', 'Weekend Warrior', 'Practice on a weekend', '🎉', 50, 'special', NULL)
ON CONFLICT (key) DO NOTHING;
