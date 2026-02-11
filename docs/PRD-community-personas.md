# PRD: Community Personas & Scenarios

**Product:** Whispie
**Author:** Brad Bush / Molty
**Date:** 2026-02-10
**Status:** Ready for Development
**MoltyBoard Tasks:** `94081b93` (Pre-written Q&A), `b531a9bd` (Upload Your Boss), `19eee90d` (Community Scenarios)

---

## Overview

Transform Whispie from admin-seeded personas/scenarios into a platform where users create, customize, and share conversation partners based on real people in their lives. Three existing MoltyBoard tasks combine into one unified feature.

## Problem

Users can only practice with system-created personas. They can't:
- Practice with someone who acts like their *actual* boss, client, or coworker
- Share effective practice scenarios with other users
- Discover new scenarios from the community

## Solution

A three-layer system:

1. **Structured Q&A pairs** on personas/scenarios (makes AI responses more realistic)
2. **"Upload Your..." flow** — users create private personas from real relationships
3. **Community gallery** — users share sanitized versions for others to use

---

## Tech Stack Context

- **Frontend:** Next.js 14, React 18, Tailwind 3, Radix UI, TypeScript
- **Backend:** Supabase (Postgres + Auth + RLS)
- **AI Chat:** MiniMax M2-Her via OpenRouter (OpenAI SDK)
- **Analysis:** Gemini 2.5 Pro
- **Existing tables:** `profiles`, `personas`, `scenarios`, `conversations`, `messages`, `analyses`

---

## Database Changes

### Migration: `007_community_personas.sql`

#### Extend `personas` table

```sql
ALTER TABLE public.personas
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'system' CHECK (source IN ('system', 'user', 'community')),
  ADD COLUMN upvotes integer DEFAULT 0,
  ADD COLUMN use_count integer DEFAULT 0,
  ADD COLUMN custom_qa jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN tags text[] DEFAULT '{}';
```

- `created_by` — NULL = system-seeded, UUID = user-created
- `source` — `system` (admin), `user` (private), `community` (shared publicly)
- `custom_qa` — structured Q&A pairs that guide AI behavior (see schema below)
- `tags` — categorization: `boss`, `peer`, `employee`, `client`, `hr`, `interviewer`

#### Extend `scenarios` table

```sql
ALTER TABLE public.scenarios
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean DEFAULT false,
  ADD COLUMN source text DEFAULT 'system' CHECK (source IN ('system', 'user', 'community')),
  ADD COLUMN upvotes integer DEFAULT 0,
  ADD COLUMN use_count integer DEFAULT 0;
```

#### New `community_votes` table

```sql
CREATE TABLE public.community_votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('persona', 'scenario')),
  target_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
```

#### RLS Policies

```sql
-- Users can view: system personas + their own + public community personas
CREATE POLICY "Users can view available personas"
  ON public.personas FOR SELECT
  USING (
    is_active = true AND (
      source = 'system'
      OR created_by = auth.uid()
      OR (source = 'community' AND is_public = true)
    )
  );

-- Users can create their own personas
CREATE POLICY "Users can create personas"
  ON public.personas FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own personas
CREATE POLICY "Users can update own personas"
  ON public.personas FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own personas
CREATE POLICY "Users can delete own personas"
  ON public.personas FOR DELETE
  USING (created_by = auth.uid());

-- Same pattern for scenarios (SELECT, INSERT, UPDATE, DELETE)
-- Same pattern for community_votes (users manage their own votes)
```

**Important:** Drop the existing `"Anyone can view active personas"` and `"Anyone can view active scenarios"` policies and replace with the scoped versions above.

#### Indexes

```sql
CREATE INDEX idx_personas_source ON public.personas(source);
CREATE INDEX idx_personas_created_by ON public.personas(created_by);
CREATE INDEX idx_personas_tags ON public.personas USING gin(tags);
CREATE INDEX idx_personas_upvotes ON public.personas(upvotes DESC);
CREATE INDEX idx_community_votes_target ON public.community_votes(target_type, target_id);
```

---

## custom_qa Schema

```typescript
type CustomQA = {
  trigger: string;      // "if user says something like..."
  response: string;     // "respond with..."
  category: 'redirect' | 'escalate' | 'boundary' | 'emotional' | 'custom';
}[];
```

**Examples:**

```json
[
  {
    "trigger": "user stalls or goes silent",
    "response": "Tap your pen impatiently and say 'I don't have all day, what's your point?'",
    "category": "redirect"
  },
  {
    "trigger": "user becomes aggressive or inappropriate",
    "response": "Stand up, say 'This meeting is over', and leave",
    "category": "boundary"
  },
  {
    "trigger": "user tries to change the subject",
    "response": "Redirect back: 'We're not done discussing the deadline issue'",
    "category": "redirect"
  }
]
```

These get injected into the AI system prompt alongside the persona's existing personality_traits and communication_style. The AI should treat them as behavioral rules, not scripts — natural integration, not robotic if/then.

---

## Feature 1: Custom Q&A Pairs on Personas/Scenarios

### What
Add a Q&A editor to existing system personas AND to user-created personas. These pairs make conversations feel more real by giving the AI specific behavioral instructions.

### UI
- On the persona detail/edit page, add a "Conversation Rules" section
- Each rule: trigger input + response textarea + category dropdown
- Add/remove rules dynamically
- For system personas: display read-only (admin manages via seed data)
- For user personas: fully editable

### Backend
- Store as `custom_qa` jsonb on the persona
- When starting a conversation, inject Q&A pairs into AI system prompt
- Format for prompt injection:

```
BEHAVIORAL RULES (follow these during the conversation):
- When the user stalls or goes silent: Tap your pen impatiently and say "I don't have all day, what's your point?"
- When the user becomes aggressive: Stand up, say "This meeting is over", and leave.
```

---

## Feature 2: "Upload Your..." (Create Persona from Real Person)

### What
Users create a private persona based on a real person in their life. The flow guides them through describing the person so the AI can roleplay them convincingly.

### User Flow

1. User clicks "Create New Persona" (or "Upload Your..." from homepage)
2. **Step 1 — Relationship type** (select one):
   - 👔 Boss / Manager
   - 👥 Coworker / Peer
   - 📋 Employee / Direct Report
   - 🤝 Client / Customer
   - 💼 HR / Interviewer
   - 🎭 Other
3. **Step 2 — Basic info:**
   - Name (first name or nickname — this stays private)
   - Their role/title
   - Brief description ("Karen is my VP of Sales. She's been here 15 years and resists any change to her process.")
4. **Step 3 — Personality:**
   - Select personality traits from chips (reuse existing trait vocabulary + allow custom)
   - Communication style dropdown (direct, passive-aggressive, aggressive, avoidant, supportive)
   - Difficulty slider (easy / medium / hard)
5. **Step 4 — Behavioral rules** (optional but encouraged):
   - Pre-populated suggestions based on relationship type selected in Step 1
   - E.g., for "Boss": "What does your boss do when you push back?" → user fills in
   - Stored as `custom_qa` jsonb
6. **Step 5 — Create scenario** (optional):
   - "What situation do you want to practice?"
   - Category, context, objectives auto-suggested based on relationship type
   - Links to the persona

### Result
- Persona created with `source: 'user'`, `is_public: false`, `created_by: auth.uid()`
- Tags auto-set from relationship type (e.g., `['boss']`)
- User sees it in "My Personas" section alongside system personas
- Can start a conversation immediately

### Suggested Q&A Templates by Relationship Type

**Boss:**
- "What happens when you disagree with them?"
- "How do they react to bad news?"
- "What's their pet peeve?"

**Coworker:**
- "How do they respond when you need help?"
- "What happens when credit is shared?"
- "How do they act in meetings vs. 1:1?"

**Client:**
- "What's their biggest concern?"
- "How do they react to pushback on scope?"
- "What triggers escalation?"

---

## Feature 3: Community Gallery

### What
Users can share anonymized versions of their personas/scenarios. Other users can browse, upvote, and clone them.

### Share Flow

1. User opens their private persona → clicks "Share to Community"
2. **Sanitization screen:**
   - Auto-strips real name → suggests generic name (e.g., "The Credit-Stealing Coworker")
   - User reviews and edits title, description — must remove identifying info
   - Checkbox: "I confirm this doesn't contain identifying information"
3. On submit:
   - `source` → `'community'`
   - `is_public` → `true`
   - Original private persona remains unchanged (sharing creates a **copy**)
4. Community copy gets its own `id`, inherits Q&A pairs, traits, etc.

### Browse/Gallery UI

- **Route:** `/community`
- **Filters:**
  - Category tabs: Boss | Coworker | Employee | Client | HR/Interview | All
  - Sort: Most Popular (upvotes) | Most Used (use_count) | Newest
- **Cards show:**
  - Persona name + title
  - Tags as pills
  - Difficulty badge
  - Upvote count + use count
  - "Try It" button → clones to user's library + starts conversation
  - "Upvote" button (one per user per persona, toggleable)

### Upvote Mechanics
- Insert/delete in `community_votes` table
- Trigger or app-level logic to increment/decrement `upvotes` on the persona
- One vote per user per target (enforced by unique constraint)

### "Try It" / Clone Flow
1. User clicks "Try It" on a community persona
2. System clones the persona to user's library with `source: 'user'`, `created_by: auth.uid()`
3. Starts a conversation with the cloned persona
4. Increments `use_count` on the community original

---

## Pages / Routes

| Route | Purpose |
|-------|---------|
| `/personas/create` | "Upload Your..." multi-step form |
| `/personas/[id]/edit` | Edit persona + Q&A rules |
| `/personas/my` | User's persona library (private + cloned) |
| `/community` | Browse community personas + scenarios |
| `/community/[id]` | Community persona detail + "Try It" |

---

## Prompt Integration

When a conversation starts with a persona that has `custom_qa`, build the system prompt like:

```
You are [name], [title]. [description]

PERSONALITY: [personality_traits joined]
COMMUNICATION STYLE: [communication_style]
DIFFICULTY: [difficulty]

SCENARIO: [scenario context + objectives]

BEHAVIORAL RULES:
- When [trigger]: [response]
- When [trigger]: [response]
...

Stay in character at all times. These behavioral rules should feel natural, not scripted.
```

---

## Out of Scope (for now)

- Reporting/flagging inappropriate community content
- Admin moderation dashboard
- Scenario builder (beyond the simple create in Upload flow)
- Comments/discussion on community personas
- Following/notifications for community creators

---

## Success Metrics

- % of users who create at least one custom persona (target: 30% of active users)
- Community personas shared (target: 50 within first month of launch)
- Conversations using custom personas vs. system personas
- Average upvotes on community personas (signal of quality)

---

## Implementation Order

**Phase A — Database + Q&A (foundation):**
1. Run migration `007_community_personas.sql`
2. Update RLS policies
3. Add Q&A editor UI to persona detail page
4. Integrate Q&A pairs into AI system prompt
5. Update existing seed personas with sample Q&A pairs

**Phase B — Upload Your... (private personas):**
1. Build multi-step create form at `/personas/create`
2. Build "My Personas" library page
3. Add relationship-type Q&A templates
4. Wire up scenario creation linked to persona
5. Test end-to-end: create persona → start conversation → Q&A rules apply

**Phase C — Community Gallery:**
1. Build share/sanitize flow
2. Build community browse page with filters + sort
3. Implement upvote mechanics (votes table + count sync)
4. Build "Try It" clone flow
5. Add use_count tracking

---

## File References

- Schema: `supabase/migrations/001_initial_schema.sql`
- Seed data: `supabase/migrations/002_seed_personas_scenarios.sql`
- New migration: `supabase/migrations/007_community_personas.sql`
- AI chat logic: check for system prompt construction (likely in `src/lib/` or API routes)

---

## Phase D — Upload Your... + Scenario Flow

### D1: Upload Your... — AI-Powered Persona Creation

**Path:** `/personas/upload`

**Flow:**
1. Pick relationship type (same picker as manual create)
2. Paste emails/messages/correspondence (minimum 50 characters)
3. AI analysis via `POST /api/personas/analyze` — sends text to Gemini 2.5 Pro, extracts name, title, description, personality traits, communication style, difficulty, and auto-generates custom_qa behavioral rules
4. Editable review form (all fields adjustable before saving)
5. Auto-generates a default scenario from correspondence via `POST /api/scenarios/generate`, then redirects to chat

**API Routes:**
- `POST /api/personas/analyze` — Gemini 2.5 Pro correspondence analysis
- `POST /api/scenarios/generate` — Gemini 2.5 Pro scenario generation from persona + correspondence

**UI:**
- "Upload Your Boss / Coworker / Client" button on dashboard (prominent, with upload icon)
- "Upload Your..." + "Create Manually" split buttons on My Personas page

### D2: Default Scenario on Persona Creation

- **Manual path:** After persona creation, redirects to `/personas/[id]/scenario/new` — user must create at least one scenario before practicing
- **Upload path:** Auto-generates scenario from correspondence context via Gemini
- Create persona wizard reduced from 5 to 4 steps (removed inline scenario step)

**New Page:** `src/app/(dashboard)/personas/[id]/scenario/new/page.tsx` — scenario creation form (title, category, context, objectives)

### D3: Cascade Delete + Constraint Rules

- **Deleting a persona** cascades to delete ALL linked user scenarios (handled in API, not DB FK cascade)
- Confirm dialog warns: "This will also delete X scenarios"
- **Cannot delete the last scenario** on a persona — API returns 400, UI disables delete button

**Updated API Routes:**
- `DELETE /api/personas/[id]` — counts and deletes linked scenarios first
- `DELETE /api/scenarios/[id]` — last scenario guard (400 if only 1 remains)

### D4: My Scenarios Page

**Path:** `/scenarios/my`

- Lists user-created scenarios grouped by persona
- Each card shows: title, category, difficulty, persona name, practice count, last practiced date
- Actions: Delete (disabled if last scenario), Practice (start conversation)
- "New scenario for [persona]" quick-create links at top
- "My Scenarios" nav link on dashboard

**Components:**
- `src/app/(dashboard)/scenarios/my/page.tsx`
- `src/app/(dashboard)/scenarios/my/scenario-actions.tsx`

### D5: Community Scenarios Browsing

- Added Personas/Scenarios tab toggle to `/community` page
- Scenarios tab shows community-shared scenarios with same filter/sort/upvote pattern
- "Try It" on a community scenario clones both the scenario AND its linked persona (if user doesn't already have it)

**New API Routes:**
- `GET /api/community/scenarios` — list public community scenarios with persona join
- `POST /api/community/scenarios/[id]/clone` — clones scenario + auto-clones linked persona

**New Component:**
- `src/components/community/community-scenario-card.tsx`

### Dashboard Navigation (Updated)

```
[Start Practice] [View Progress]
[Upload Your Boss / Coworker / Client]
[My Personas]    [My Scenarios]
[Create Persona] [Community]
```
