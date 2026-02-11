# Phase D Instructions

Read `docs/PRD-community-personas.md` and `docs/BUILD-PLAN-community-personas.md` for context on what's already built. Then implement these changes:

## 1. "Upload Your..." — AI-powered persona creation from correspondence

Create a new path at `/personas/upload` with this flow:
- Step 1: Pick relationship type (same picker as manual create)
- Step 2: Paste area for emails/messages/correspondence from the person. Support multiple pastes.
- Step 3: Call a new API route `POST /api/personas/analyze` that sends the text to Gemini 2.5 Pro and extracts: name, title/role, personality traits, communication style, difficulty level, and auto-generates custom_qa behavioral rules based on patterns in the correspondence
- Step 4: Show the extracted persona in an editable review form (reuse the edit form pattern). User can adjust anything before saving.
- Step 5: Auto-generate a default scenario from the correspondence context via `POST /api/scenarios/generate`, then redirect to chat

Add "Upload Your..." button to the dashboard (prominent, above "Create Persona"). Also add it to the My Personas page.

## 2. Default scenario on persona creation

After ANY persona is created:
- **Upload path:** Auto-generate a default scenario from the correspondence context via Gemini
- **Manual path:** After persona is saved, take user to a scenario creation form (title, category, context, objectives) — they must create at least one scenario before they can practice. Then redirect to `/chat/new?scenario={id}` to start practicing immediately.
- Use `POST /api/scenarios/generate` for the upload auto-generation path

## 3. Cascade delete + constraint rules

- **Deleting a persona** deletes ALL of that user's scenarios linked to it. Add `ON DELETE CASCADE` or handle in the API. Confirm dialog should warn: "This will also delete X scenarios."
- **Cannot delete the last scenario** on a persona. API should return 400 with error message if user tries. UI should hide/disable delete button when only 1 scenario remains on a persona.
- Make sure both persona and scenario delete flows enforce these rules.

## 4. My Scenarios page

Create `/scenarios/my` page:
- List all user-created scenarios grouped by persona
- Each card shows: title, category, persona name, practice count, last practiced date
- Actions: Edit, Delete (disabled if last scenario), Practice (start conversation)
- "New Scenario" button that lets you pick from your personas, then creates a scenario for that persona
- Add "My Scenarios" nav link to dashboard

## 5. Community scenarios browsing

Extend the `/community` page:
- Add a tab toggle: "Personas" | "Scenarios"
- Scenarios tab shows community-shared scenarios with the same filter/sort/upvote/clone pattern
- "Try It" on a community scenario clones both the scenario AND its linked persona if user doesn't have it

## 6. Update the PRD

Append these changes to `docs/PRD-community-personas.md` as "Phase D — Upload Your... + Scenario Flow" with the database changes, API routes, and component list.

## Build order

3 first (delete constraints), then 2 (default scenario flow), then 4 (My Scenarios page), then 1 (Upload Your...), then 5 (community scenarios). Run `npm run build` after each phase to verify.
