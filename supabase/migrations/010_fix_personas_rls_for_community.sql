-- Fix personas RLS to allow viewing personas referenced by community scenarios
-- This allows users to see persona info (avatar, name, etc.) when viewing community scenarios

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view available personas" ON public.personas;

-- Create updated policy that includes personas referenced by community scenarios
CREATE POLICY "Users can view available personas"
  ON public.personas FOR SELECT
  USING (
    is_active = true AND (
      source = 'system'
      OR created_by = auth.uid()
      OR (source = 'community' AND is_public = true)
      -- Allow viewing personas that are referenced by public community scenarios
      OR EXISTS (
        SELECT 1 FROM public.scenarios
        WHERE scenarios.persona_id = personas.id
        AND scenarios.source = 'community'
        AND scenarios.is_public = true
        AND scenarios.is_active = true
      )
    )
  );