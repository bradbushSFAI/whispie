-- Community Personas & Scenarios
-- Extends personas/scenarios for user-created and community-shared content
-- Adds community_votes table for upvoting

-- ============================================
-- EXTEND PERSONAS TABLE
-- ============================================

ALTER TABLE public.personas
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'system' CHECK (source IN ('system', 'user', 'community')),
  ADD COLUMN upvotes integer DEFAULT 0,
  ADD COLUMN use_count integer DEFAULT 0,
  ADD COLUMN custom_qa jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN tags text[] DEFAULT '{}';

-- ============================================
-- EXTEND SCENARIOS TABLE
-- ============================================

ALTER TABLE public.scenarios
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'system' CHECK (source IN ('system', 'user', 'community')),
  ADD COLUMN upvotes integer DEFAULT 0,
  ADD COLUMN use_count integer DEFAULT 0;

-- ============================================
-- COMMUNITY VOTES TABLE
-- ============================================

CREATE TABLE public.community_votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('persona', 'scenario')),
  target_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REPLACE PERMISSIVE RLS POLICIES
-- ============================================

-- Drop old open SELECT policies
DROP POLICY IF EXISTS "Anyone can view active personas" ON public.personas;
DROP POLICY IF EXISTS "Anyone can view active scenarios" ON public.scenarios;

-- Personas: scoped SELECT + full CRUD for own
CREATE POLICY "Users can view available personas"
  ON public.personas FOR SELECT
  USING (
    is_active = true AND (
      source = 'system'
      OR created_by = auth.uid()
      OR (source = 'community' AND is_public = true)
    )
  );

CREATE POLICY "Users can create personas"
  ON public.personas FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own personas"
  ON public.personas FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own personas"
  ON public.personas FOR DELETE
  USING (created_by = auth.uid());

-- Scenarios: scoped SELECT + full CRUD for own
CREATE POLICY "Users can view available scenarios"
  ON public.scenarios FOR SELECT
  USING (
    is_active = true AND (
      source = 'system'
      OR created_by = auth.uid()
      OR (source = 'community' AND is_public = true)
    )
  );

CREATE POLICY "Users can create scenarios"
  ON public.scenarios FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own scenarios"
  ON public.scenarios FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own scenarios"
  ON public.scenarios FOR DELETE
  USING (created_by = auth.uid());

-- Community votes: users manage their own votes
CREATE POLICY "Users can view own votes"
  ON public.community_votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can vote"
  ON public.community_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own votes"
  ON public.community_votes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_personas_source ON public.personas(source);
CREATE INDEX idx_personas_created_by ON public.personas(created_by);
CREATE INDEX idx_personas_tags ON public.personas USING gin(tags);
CREATE INDEX idx_personas_upvotes ON public.personas(upvotes DESC);
CREATE INDEX idx_scenarios_source ON public.scenarios(source);
CREATE INDEX idx_scenarios_created_by ON public.scenarios(created_by);
CREATE INDEX idx_community_votes_target ON public.community_votes(target_type, target_id);

-- ============================================
-- UPVOTE SYNC TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_upvote_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'persona' THEN
      UPDATE public.personas SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'scenario' THEN
      UPDATE public.scenarios SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'persona' THEN
      UPDATE public.personas SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'scenario' THEN
      UPDATE public.scenarios SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.community_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_upvote_count();
