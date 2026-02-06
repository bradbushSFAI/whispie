# Whispie - Bugs & Issues

*Last updated: 2026-02-06*

## UI/Visual Issues

### Sign-in Page
- [x] **"Practice tough questions…" text too light** — Fixed: overrode CardDescription with text-slate-600 (commit 7ca0063)

### Onboarding
- [x] **"Asking manager for feedback" button not clickable** — Fixed: turned suggestion box into clickable button that completes onboarding and navigates to feedback scenarios (commit fbc79bd)

### Scenario Page
- [x] **Category pill text too dark** — Fixed: changed active pill text from text-black to text-white (commit 10723a4)
- [x] **Disclaimer text too dim** — Fixed: increased dark mode opacity from 20% to 50% (commit 34d13c3)
- [ ] **No intro to scenario** — Unclear how to start the conversation, needs onboarding or prompt

### Chat Interface
- [x] **Fake the AI's opening line in GUI** — Fixed: preserved AI opening in Gemini history by prepending synthetic user turn instead of slicing it off (commit e86e283)
- [x] **Add "End Conversation" button** — Fixed: added red X button next to Send in chat footer (commit 0cf5b4a)

### Analysis/Scoring
- [x] **Analysis generation broken** — Fixed: missing RLS INSERT policy on analyses table (commit 7deb032)
- [x] **No escape from retry loop** — Fixed: added "Back to Menu" button (commit bf55157)

### Database/Supabase
- [x] **Audit RLS policies on ALL tables** — Audited all 8 tables. Only gap was missing DELETE on conversations (added migration 005). All other tables are properly secured: profiles (trigger handles INSERT), personas/scenarios/achievements (admin-only, SELECT only), messages/analyses (immutable, cascade delete), user_achievements (permanent).

---

## Content/Assets Needed

### Persona Images
- [x] **Generate persona profile pictures** — Generated flat-style illustrations via Gemini for Margaret Chen, Derek Williams, Victoria Santos. Stored in public/personas/. Migration 006 sets avatar_url. (commit 17f4bf4)

---

## Notes

- Testing on mobile Chrome
- Production URL: https://whispie.vercel.app
- Supabase project: Whispie-Production (lbdefruejprfrxxjkzev)
