# Build Plan: Community Personas & Scenarios

**PRD:** `docs/PRD-community-personas.md`
**Date:** 2026-02-10

---

## Codebase Patterns (Reference)

| Pattern | Current Implementation |
|---------|----------------------|
| **Routing** | Next.js App Router with `(dashboard)` and `(auth)` route groups |
| **UI Components** | Radix UI + Tailwind + `src/components/ui/` (shadcn pattern) |
| **Supabase Client** | `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server) |
| **Types** | `src/types/database.ts` — manual types (not auto-generated yet) |
| **API Routes** | `src/app/api/conversations/` — REST pattern with Next.js route handlers |
| **System Prompt** | `src/lib/gemini/prompts.ts` → `buildSystemPrompt(persona, scenario)` |
| **Analysis** | `src/lib/gemini/prompts.ts` → `buildAnalysisPrompt(scenario, messages)` |
| **Scenario Browse** | `src/app/(dashboard)/scenarios/page.tsx` + `category-filter.tsx` |
| **Chat** | `src/app/(dashboard)/chat/new/page.tsx` (start) → `chat/[id]/chat-interface.tsx` |
| **Hooks** | `src/hooks/use-user.ts` |

---

## Phase A: Database Migration + Q&A Pairs

**Goal:** Extend schema, update types, inject Q&A into system prompt.

### Step A1: Migration File

**Create:** `supabase/migrations/007_community_personas.sql`

```sql
-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view active personas" ON public.personas;
DROP POLICY IF EXISTS "Anyone can view active scenarios" ON public.scenarios;

-- Extend personas
ALTER TABLE public.personas
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'system' CHECK (source IN ('system', 'user', 'community')),
  ADD COLUMN upvotes integer DEFAULT 0,
  ADD COLUMN use_count integer DEFAULT 0,
  ADD COLUMN custom_qa jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN tags text[] DEFAULT '{}';

-- Extend scenarios
ALTER TABLE public.scenarios
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'system' CHECK (source IN ('system', 'user', 'community')),
  ADD COLUMN upvotes integer DEFAULT 0,
  ADD COLUMN use_count integer DEFAULT 0;

-- Community votes table
CREATE TABLE public.community_votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('persona', 'scenario')),
  target_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

-- New RLS: personas
CREATE POLICY "Users can view available personas"
  ON public.personas FOR SELECT
  USING (is_active = true AND (
    source = 'system'
    OR created_by = auth.uid()
    OR (source = 'community' AND is_public = true)
  ));

CREATE POLICY "Users can create personas"
  ON public.personas FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own personas"
  ON public.personas FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own personas"
  ON public.personas FOR DELETE
  USING (created_by = auth.uid());

-- New RLS: scenarios
CREATE POLICY "Users can view available scenarios"
  ON public.scenarios FOR SELECT
  USING (is_active = true AND (
    source = 'system'
    OR created_by = auth.uid()
    OR (source = 'community' AND is_public = true)
  ));

CREATE POLICY "Users can create scenarios"
  ON public.scenarios FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own scenarios"
  ON public.scenarios FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own scenarios"
  ON public.scenarios FOR DELETE
  USING (created_by = auth.uid());

-- New RLS: community_votes
CREATE POLICY "Users can view own votes"
  ON public.community_votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can vote"
  ON public.community_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own votes"
  ON public.community_votes FOR DELETE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_personas_source ON public.personas(source);
CREATE INDEX idx_personas_created_by ON public.personas(created_by);
CREATE INDEX idx_personas_tags ON public.personas USING gin(tags);
CREATE INDEX idx_personas_upvotes ON public.personas(upvotes DESC);
CREATE INDEX idx_scenarios_source ON public.scenarios(source);
CREATE INDEX idx_scenarios_created_by ON public.scenarios(created_by);
CREATE INDEX idx_community_votes_target ON public.community_votes(target_type, target_id);

-- Upvote sync function
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
```

### Step A2: Update TypeScript Types

**Modify:** `src/types/database.ts`

```typescript
// Add to Persona type:
  created_by: string | null
  is_public: boolean
  source: 'system' | 'user' | 'community'
  upvotes: number
  use_count: number
  custom_qa: CustomQA[]
  tags: string[]

// Add to Scenario type:
  created_by: string | null
  is_public: boolean
  source: 'system' | 'user' | 'community'
  upvotes: number
  use_count: number

// Add new types:
export type CustomQA = {
  trigger: string
  response: string
  category: 'redirect' | 'escalate' | 'boundary' | 'emotional' | 'custom'
}

export type CommunityVote = {
  id: string
  user_id: string
  target_type: 'persona' | 'scenario'
  target_id: string
  created_at: string
}

// Add to Database.public.Tables:
  community_votes: { Row: CommunityVote; Insert: ...; Update: ... }
```

### Step A3: Inject Q&A into System Prompt

**Modify:** `src/lib/gemini/prompts.ts`

Update `buildSystemPrompt(persona, scenario)` to append Q&A rules:

```typescript
export function buildSystemPrompt(persona: Persona, scenario: Scenario): string {
  // ... existing prompt ...

  // Add after Guidelines section:
  let qaSection = ''
  if (persona.custom_qa && persona.custom_qa.length > 0) {
    const rules = persona.custom_qa
      .map(qa => `- When ${qa.trigger}: ${qa.response}`)
      .join('\n')
    qaSection = `\n## Behavioral Rules (follow these naturally during the conversation)\n${rules}\n`
  }

  // Insert qaSection before "User's Hidden Objectives"
}
```

### Step A4: Q&A Editor Component

**Create:** `src/components/personas/qa-editor.tsx`

- Dynamic list of Q&A pairs
- Each row: trigger input, response textarea, category select
- Add/remove buttons
- Props: `value: CustomQA[]`, `onChange: (qa: CustomQA[]) => void`, `readOnly?: boolean`

### Step A5: Add Q&A to Existing System Personas (Seed Update)

**Create:** `supabase/migrations/008_seed_persona_qa.sql`

Add sample Q&A pairs to the 3 existing personas (Margaret Chen, Derek Williams, Victoria Santos) to demonstrate the feature.

### Step A6: Test

- Verify existing personas still load (RLS change)
- Start conversation with persona that has Q&A → confirm rules appear in AI behavior
- Verify Q&A editor renders on persona detail

---

## Phase B: "Upload Your..." (Private Persona Creation)

**Goal:** Users create personas from real relationships.

### Step B1: Persona API Routes

**Create:** `src/app/api/personas/route.ts`

```typescript
// GET — list personas visible to current user (system + own + public community)
// POST — create new persona (sets created_by = auth.uid(), source = 'user')
```

**Create:** `src/app/api/personas/[id]/route.ts`

```typescript
// GET — single persona detail
// PATCH — update own persona
// DELETE — delete own persona
```

### Step B2: Relationship Type Config

**Create:** `src/lib/personas/relationship-types.ts`

```typescript
export const RELATIONSHIP_TYPES = [
  { key: 'boss', label: 'Boss / Manager', icon: '👔', tag: 'boss',
    suggestedTraits: ['detail-oriented', 'impatient', 'assertive', ...],
    qaTemplates: [
      { prompt: 'What happens when you disagree with them?', category: 'redirect' },
      { prompt: 'How do they react to bad news?', category: 'emotional' },
      { prompt: "What's their pet peeve?", category: 'boundary' },
    ]
  },
  { key: 'coworker', label: 'Coworker / Peer', icon: '👥', tag: 'peer', ... },
  { key: 'employee', label: 'Employee / Direct Report', icon: '📋', tag: 'employee', ... },
  { key: 'client', label: 'Client / Customer', icon: '🤝', tag: 'client', ... },
  { key: 'hr', label: 'HR / Interviewer', icon: '💼', tag: 'hr', ... },
  { key: 'other', label: 'Other', icon: '🎭', tag: 'other', ... },
] as const
```

### Step B3: Multi-Step Create Form

**Create:** `src/app/(dashboard)/personas/create/page.tsx`

Multi-step wizard (manage step state with useState):

| Step | Component | Fields |
|------|-----------|--------|
| 1 | `RelationshipPicker` | Select relationship type (card grid) |
| 2 | `BasicInfoForm` | Name, title, description |
| 3 | `PersonalityForm` | Trait chips (multi-select), communication style dropdown, difficulty slider |
| 4 | `QASetupForm` | Pre-populated Q&A templates from relationship type + custom add |
| 5 | `CreateScenarioForm` (optional) | Title, category, context, objectives |

**Create supporting components:**

- `src/components/personas/relationship-picker.tsx` — card grid of 6 relationship types
- `src/components/personas/personality-form.tsx` — trait chips + style dropdown
- `src/components/personas/create-scenario-form.tsx` — optional linked scenario

### Step B4: My Personas Library Page

**Create:** `src/app/(dashboard)/personas/my/page.tsx`

- Grid of user's personas (source = 'user') + cloned community personas
- Each card: name, title, tags, difficulty badge, Q&A count
- Actions: Edit, Delete, Start Conversation, Share to Community
- "Create New" button → `/personas/create`

### Step B5: Persona Edit Page

**Create:** `src/app/(dashboard)/personas/[id]/edit/page.tsx`

- Same fields as create form but pre-populated
- Q&A editor (from Step A4)
- Only works for personas where `created_by = auth.uid()`

### Step B6: Wire Up Scenarios Page

**Modify:** `src/app/(dashboard)/scenarios/page.tsx`

- Add "My Personas" tab/section alongside system scenarios
- When user selects their custom persona, show linked scenarios or option to create one

### Step B7: Wire Up Chat Start

**Modify:** `src/app/(dashboard)/chat/new/page.tsx`

- Support starting conversation with user-created personas
- Pass custom_qa through to system prompt via existing `buildSystemPrompt`

### Step B8: Increment use_count

**Modify:** `src/app/api/conversations/route.ts` (POST handler)

- After creating conversation, increment `use_count` on the persona

### Step B9: Test

- Create persona through full wizard flow
- Verify persona appears in "My Personas"
- Start conversation → verify Q&A rules affect AI behavior
- Edit persona → verify changes persist
- Delete persona → verify removed

---

## Phase C: Community Gallery

**Goal:** Users share sanitized personas, browse and clone community content.

### Step C1: Community API Routes

**Create:** `src/app/api/community/route.ts`

```typescript
// GET — list community personas/scenarios with filters
// Query params: type (persona|scenario), tag, sort (upvotes|use_count|newest), page, limit
```

**Create:** `src/app/api/community/[id]/clone/route.ts`

```typescript
// POST — clone a community persona to user's library
// Creates copy with source='user', created_by=auth.uid()
// Increments use_count on original
```

**Create:** `src/app/api/community/vote/route.ts`

```typescript
// POST — toggle upvote (insert or delete from community_votes)
// Body: { target_type, target_id }
```

### Step C2: Share Flow

**Create:** `src/app/api/personas/[id]/share/route.ts`

```typescript
// POST — create community copy of user's persona
// Copies persona with source='community', is_public=true, new id
// Strips created_by from copy (or keeps for attribution?)
// Original persona unchanged
```

**Create:** `src/components/personas/share-dialog.tsx`

- Modal with sanitization preview
- Auto-suggests generic name (strips real name)
- Editable title, description fields
- Confirmation checkbox: "I confirm this doesn't contain identifying information"
- Submit → calls share API

### Step C3: Community Browse Page

**Create:** `src/app/(dashboard)/community/page.tsx`

- Category tabs: All | Boss | Coworker | Employee | Client | HR
- Sort dropdown: Most Popular | Most Used | Newest
- Responsive card grid

**Create:** `src/components/community/community-card.tsx`

- Persona name + title
- Tags as pills (reuse Badge component)
- Difficulty badge
- Upvote count + Use count
- "Try It" button
- Upvote toggle button (heart or arrow)

**Create:** `src/components/community/community-filters.tsx`

- Tab bar for categories (similar pattern to existing `category-filter.tsx`)
- Sort select

### Step C4: Community Detail Page

**Create:** `src/app/(dashboard)/community/[id]/page.tsx`

- Full persona description
- Q&A rules preview (read-only)
- Personality traits display
- "Try It" button (clones + starts conversation)
- Upvote button
- Use count / upvote count

### Step C5: Add to Navigation

**Modify:** Dashboard layout/sidebar (wherever nav lives)

- Add "Community" link between Scenarios and Progress
- Add "My Personas" link

### Step C6: Upvote Hook

**Create:** `src/hooks/use-vote.ts`

```typescript
// Manages vote state for a target
// Returns: { hasVoted, voteCount, toggleVote, isLoading }
// Fetches current vote status on mount
// Optimistic UI update on toggle
```

### Step C7: Test

- Share persona → verify sanitization dialog
- Browse community → verify filters and sort
- Upvote → verify count updates (optimistic + persisted)
- "Try It" → verify clone created + conversation starts
- Verify original persona unchanged after share

---

## File Summary

### New Files (17)

| File | Phase |
|------|-------|
| `supabase/migrations/007_community_personas.sql` | A |
| `supabase/migrations/008_seed_persona_qa.sql` | A |
| `src/components/personas/qa-editor.tsx` | A |
| `src/app/api/personas/route.ts` | B |
| `src/app/api/personas/[id]/route.ts` | B |
| `src/lib/personas/relationship-types.ts` | B |
| `src/app/(dashboard)/personas/create/page.tsx` | B |
| `src/components/personas/relationship-picker.tsx` | B |
| `src/components/personas/personality-form.tsx` | B |
| `src/components/personas/create-scenario-form.tsx` | B |
| `src/app/(dashboard)/personas/my/page.tsx` | B |
| `src/app/(dashboard)/personas/[id]/edit/page.tsx` | B |
| `src/app/api/community/route.ts` | C |
| `src/app/api/community/[id]/clone/route.ts` | C |
| `src/app/api/community/vote/route.ts` | C |
| `src/app/api/personas/[id]/share/route.ts` | C |
| `src/components/personas/share-dialog.tsx` | C |
| `src/app/(dashboard)/community/page.tsx` | C |
| `src/components/community/community-card.tsx` | C |
| `src/components/community/community-filters.tsx` | C |
| `src/app/(dashboard)/community/[id]/page.tsx` | C |
| `src/hooks/use-vote.ts` | C |

### Modified Files (5)

| File | Phase | Change |
|------|-------|--------|
| `src/types/database.ts` | A | Add new fields to Persona/Scenario, add CustomQA + CommunityVote types |
| `src/lib/gemini/prompts.ts` | A | Inject custom_qa into system prompt |
| `src/app/(dashboard)/scenarios/page.tsx` | B | Add "My Personas" section |
| `src/app/(dashboard)/chat/new/page.tsx` | B | Support user-created personas |
| `src/app/api/conversations/route.ts` | B | Increment use_count on conversation create |

---

## Build Order (for CC)

```
Phase A (do first, everything depends on this):
  A1 → A2 → A3 → A4 → A5 → A6

Phase B (after A is working):
  B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9

Phase C (after B is working):
  C1 → C2 → C3 → C4 → C5 → C6 → C7
```

Each phase should be a working increment. Phase A alone makes existing personas better. Phase B adds the core user creation flow. Phase C adds the social/sharing layer.
