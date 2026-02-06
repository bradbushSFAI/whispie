# Whispie - CLAUDE.md

> Corporate Oracle - "Flight simulator for difficult workplace conversations"

## Project Overview

Whispie is a SaaS app that helps professionals practice difficult workplace conversations through AI roleplay. Users chat with AI personas (difficult bosses, coworkers, clients) and receive feedback on their communication skills.

**Target:** Gen Z/Millennial professionals anxious about workplace conversations
**Domain:** whispie.app

## Key Decisions

- **Voice:** User-selectable from voice library (RPG-style), NOT auto-matched to persona
- **Analytics:** PostHog free tier - keep it simple
- **Platform:** Browser PWA, mobile-first responsive
- **Moderation:** AI flags + human override
- **Pricing:**
  - Free: 3 scenarios/month, text only
  - Pro ($12/mo): Unlimited scenarios, 4 voice chats/month, Upload Your Boss, career journal
  - Voice Pack: 7 chats for $10 (add-on)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui |
| AI Chat | Gemini 1.5 Flash |
| Voice Input | Web Speech API (free, browser-native) |
| Voice Output | ElevenLabs (user-selectable voices) |
| Backend/Auth | Supabase |
| Payments | Stripe |
| Analytics | PostHog free tier |
| Hosting | Vercel |
| State | Zustand |

## Directory Structure

```
whispie/
├── CLAUDE.md                 # This file
├── docs/                     # Design docs (reference)
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Login, signup
│   │   ├── (dashboard)/      # Authenticated area
│   │   │   ├── dashboard/
│   │   │   ├── scenarios/
│   │   │   ├── chat/
│   │   │   ├── analysis/
│   │   │   ├── progress/
│   │   │   └── journal/
│   │   ├── (marketing)/      # Landing, pricing
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # shadcn/ui
│   │   ├── chat/
│   │   ├── scenarios/
│   │   ├── analysis/
│   │   ├── gamification/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── gemini/
│   │   ├── elevenlabs/
│   │   └── stripe/
│   ├── hooks/
│   ├── stores/
│   └── types/
├── public/
└── supabase/
    └── migrations/
```

## Build Phases

### Phase 1: MVP (4 weeks) ✅ COMPLETE

**Week 1: Setup + Auth** ✅
- [x] Initialize Next.js 14 + Tailwind + shadcn/ui
- [x] Set up Supabase (auth, database)
- [x] Create database schema
- [x] Implement auth (email + Google OAuth)
- [x] Build onboarding flow

**Week 2: Scenarios + Chat** ✅
- [x] Seed 5 scenarios + 3 personas
- [x] Scenario browsing UI
- [x] Gemini integration
- [x] Chat interface (text-only, streaming)

**Week 3: Analysis + Polish** ✅
- [x] Post-conversation analysis
- [x] Score display UI
- [x] Conversation history
- [x] Error handling + mobile responsive

**Week 4: Launch Prep** ✅
- [x] Landing page
- [x] PostHog analytics
- [x] Rate limiting (free tier)
- [ ] Deploy to Vercel (ready - needs env vars)

### Phase 2: Gamification (2 weeks)
- XP + leveling
- Streaks
- Achievements
- Progress dashboard

### Phase 3: Premium (2 weeks)
- Stripe integration
- Tier gating
- Upload Your Boss
- Career journal

### Phase 4: Social (2 weeks)
- Share to social
- Leaderboard
- Community scenarios

### Phase 5: Voice (2 weeks)
- ElevenLabs integration
- Voice credit system
- User-selectable voice library

## Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run lint          # Run linter

# Database
npx supabase start    # Start local Supabase
npx supabase db push  # Push schema changes
npx supabase gen types typescript --local > src/types/database.ts

# Deployment
vercel                # Deploy to Vercel
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/gemini/prompts.ts` | System prompts for personas |
| `src/lib/gemini/analysis.ts` | Post-conversation analysis prompt |
| `supabase/migrations/*.sql` | Database schema |
| `src/app/api/conversations/[id]/messages/route.ts` | Chat streaming endpoint |

## Spec Reference (Obsidian)

Full specs maintained in Obsidian for Brad to review:
- `Research/MiniSaaS/whispie/FEATURES.md` - Feature list
- `Research/MiniSaaS/whispie/IMPLEMENTATION_PLAN.md` - Detailed build plan
- `Research/MiniSaaS/whispie/marketing/GTM.md` - Go-to-market

## Design References

**CRITICAL:** All screens should follow the design system in `STYLE_GUIDE.md` and reference files in `Google_design/`.

### Style Guide
`STYLE_GUIDE.md` contains:
- Typography (Manrope font, weights, sizes)
- Color palette (primary #38e07b, dark backgrounds #122017/#1a2c22)
- Tailwind config extensions
- Component patterns (cards, buttons, badges, progress bars)
- Icon system (Material Symbols)
- Layout spacing
- Dark mode patterns

### Screen References
| Screen | Reference Folder |
|--------|-----------------|
| Dashboard | `Google_design/whispie_dashboard/` |
| Scenario Library | `Google_design/scenario_library/` |
| Conversation/Chat | `Google_design/conversation_simulator/` |
| Post-Chat Analysis | `Google_design/post-chat_analysis/` |

Each folder contains:
- `code.html` - Full HTML/Tailwind implementation (copy patterns from here)
- `screen.png` - Visual reference screenshot

**Usage:** When building a new screen, find the matching reference folder and use the `code.html` as your implementation guide. The style guide captures reusable patterns; the HTML files show exact layouts.

---

## Current Status

**Status:** Phase 1 MVP Complete - Ready for Deployment
**Completed:**
- Full auth flow (email + Google OAuth)
- 5-step onboarding
- Scenario library with filtering
- Chat interface with Gemini streaming
- Post-conversation analysis with scoring
- Dashboard with conversation history
- Rate limiting (3 free scenarios/month)
- PostHog analytics integration
- Landing page

**Next:** Deploy to Vercel, then Phase 2 (Gamification)

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
GEMINI_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY= (optional)
NEXT_PUBLIC_POSTHOG_HOST= (optional)
```
