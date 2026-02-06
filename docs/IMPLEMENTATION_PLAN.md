# Whispie Implementation Plan

> Corporate Oracle - "Flight simulator for difficult workplace conversations"

Generated: 2025-07-18

---

## Executive Summary

Whispie is a SaaS application that helps professionals practice difficult workplace conversations through AI-powered roleplay. Users chat with AI personas (difficult bosses, coworkers, clients) and receive feedback on their communication skills.

**Target Market:** Gen Z and Millennial professionals anxious about workplace conversations
**Business Model:** Freemium with voice add-on as profit center
**MVP Timeline:** 4 weeks
**Full Product:** 12 weeks

---

## Tech Architecture Decisions

### Stack Selection

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 14 (App Router) + Tailwind | SSR, fast iteration, great DX |
| **UI Components** | shadcn/ui | Beautiful defaults, fully customizable |
| **AI Chat** | Gemini 1.5 Flash | Low latency, cost-effective, good at roleplay |
| **Voice Input** | Web Speech API | Free, browser-native, no API costs |
| **Voice Output** | ElevenLabs API | Premium realistic voices for personas |
| **Backend/Auth** | Supabase | Auth, Postgres, Realtime, Row Level Security |
| **Payments** | Stripe | Industry standard, good Next.js integration |
| **Analytics** | PostHog | Open source, self-hostable, product analytics |
| **Hosting** | Vercel | Zero-config Next.js, edge functions |
| **State Management** | Zustand | Simple, minimal boilerplate |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 14 App Router + Tailwind + shadcn/ui               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Landing  │ │ Dashboard│ │ Chat UI  │ │ Analysis │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes (Vercel)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ /chat    │ │ /analyze │ │ /voice   │ │ /webhook │       │
│  │ (stream) │ │          │ │ (tts)    │ │ (stripe) │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│    Supabase      │ │  Gemini API  │ │ ElevenLabs   │
│  ┌────────────┐  │ │              │ │    API       │
│  │ Auth       │  │ │  Chat +      │ │              │
│  │ Database   │  │ │  Analysis    │ │  Voice TTS   │
│  │ Storage    │  │ │              │ │              │
│  └────────────┘  │ └──────────────┘ └──────────────┘
└──────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('ic', 'manager', 'executive')) DEFAULT 'ic',
  industry TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription/Credits
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('free', 'pro', 'lifetime')) DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  voice_credits_remaining INTEGER DEFAULT 0,
  scenarios_used_this_month INTEGER DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personas
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  description TEXT,
  personality_traits JSONB, -- {aggressive: 0.8, dismissive: 0.6, ...}
  voice_id TEXT, -- ElevenLabs voice ID
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  tier TEXT CHECK (tier IN ('free', 'pro')) DEFAULT 'free',
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- negotiation, feedback, conflict, boundaries, career
  persona_id UUID REFERENCES personas(id),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  estimated_minutes INTEGER DEFAULT 10,
  tier TEXT CHECK (tier IN ('free', 'pro')) DEFAULT 'free',
  context_prompt TEXT NOT NULL, -- Sets up the situation
  success_criteria JSONB, -- {empathy: 0.7, assertiveness: 0.6, ...}
  tips TEXT[], -- Pre-scenario tips
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id),
  persona_id UUID REFERENCES personas(id),
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  voice_enabled BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  voice_url TEXT, -- S3/Storage URL if voice was used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis Results
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  empathy_score INTEGER CHECK (empathy_score BETWEEN 0 AND 100),
  assertiveness_score INTEGER CHECK (assertiveness_score BETWEEN 0 AND 100),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 0 AND 100),
  professionalism_score INTEGER CHECK (professionalism_score BETWEEN 0 AND 100),
  key_moments JSONB, -- [{message_id, type: 'positive'|'improvement', feedback}]
  alternative_responses JSONB, -- [{message_id, suggestion}]
  persona_perspective TEXT, -- "What your boss was thinking"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification: User Progress
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  skills JSONB DEFAULT '{"negotiation": 0, "conflict": 0, "boundaries": 0, "eq": 0, "communication": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  criteria JSONB, -- {type: 'scenarios_completed', count: 10, category: 'negotiation'}
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements (join table)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Career Journal Entries (Premium)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id), -- Optional link to practice
  title TEXT,
  content TEXT,
  outcome TEXT, -- What happened in real life
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Personas ("Upload Your Boss" - Premium)
CREATE TABLE custom_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sample_messages TEXT[], -- User-provided examples
  generated_prompt TEXT, -- AI-generated system prompt
  communication_style JSONB, -- Analyzed traits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_scenarios_category ON scenarios(category);
CREATE INDEX idx_scenarios_tier ON scenarios(tier);
```

### Row Level Security (RLS)

```sql
-- Users can only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Similar policies for all user-scoped tables...
```

---

## API Design

### Endpoints

#### Authentication (Supabase handles)
- `POST /auth/signup` - Email/password signup
- `POST /auth/signin` - Email/password signin  
- `POST /auth/oauth` - Google OAuth
- `POST /auth/signout` - Sign out

#### User Profile
```
GET    /api/profile              # Get current user profile
PATCH  /api/profile              # Update profile
POST   /api/profile/onboarding   # Complete onboarding quiz
```

#### Scenarios
```
GET    /api/scenarios                    # List all scenarios (filtered by tier)
GET    /api/scenarios/:slug              # Get scenario details
GET    /api/scenarios/categories         # List categories with counts
GET    /api/scenarios/recommended        # Get personalized recommendations
```

#### Conversations
```
POST   /api/conversations                # Start new conversation
GET    /api/conversations                # List user's conversations
GET    /api/conversations/:id            # Get conversation with messages
POST   /api/conversations/:id/messages   # Send message (streaming response)
PATCH  /api/conversations/:id            # Update status (complete/abandon)
DELETE /api/conversations/:id            # Delete conversation
```

#### Analysis
```
POST   /api/conversations/:id/analyze    # Generate analysis for completed conv
GET    /api/conversations/:id/analysis   # Get existing analysis
```

#### Voice (Premium)
```
POST   /api/voice/synthesize             # Generate TTS for message
GET    /api/voice/credits                # Check remaining credits
```

#### Gamification
```
GET    /api/progress                     # Get user's XP, level, skills, streak
GET    /api/achievements                 # Get all achievements with unlock status
GET    /api/leaderboard                  # Get leaderboard (opt-in users)
```

#### Journal (Premium)
```
GET    /api/journal                      # List journal entries
POST   /api/journal                      # Create entry
PATCH  /api/journal/:id                  # Update entry
DELETE /api/journal/:id                  # Delete entry
```

#### Custom Personas (Premium)
```
POST   /api/personas/custom              # Create "Upload Your Boss" persona
GET    /api/personas/custom              # List user's custom personas
DELETE /api/personas/custom/:id          # Delete custom persona
```

#### Billing
```
POST   /api/billing/checkout             # Create Stripe checkout session
POST   /api/billing/portal               # Create billing portal session
POST   /api/webhooks/stripe              # Handle Stripe webhooks
```

### Chat Streaming

The main chat endpoint uses Server-Sent Events (SSE) for real-time streaming:

```typescript
// POST /api/conversations/:id/messages
// Request body: { content: string, useVoice?: boolean }
// Response: SSE stream

data: {"type": "start", "messageId": "xxx"}
data: {"type": "delta", "content": "I "}
data: {"type": "delta", "content": "understand "}
data: {"type": "delta", "content": "your concern..."}
data: {"type": "voice", "url": "https://..."} // If voice enabled
data: {"type": "done", "fullContent": "I understand your concern..."}
```

---

## Component Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Authenticated area
│   │   ├── dashboard/page.tsx
│   │   ├── scenarios/
│   │   │   ├── page.tsx          # Browse scenarios
│   │   │   └── [slug]/page.tsx   # Scenario detail
│   │   ├── chat/
│   │   │   └── [id]/page.tsx     # Active conversation
│   │   ├── analysis/
│   │   │   └── [id]/page.tsx     # Post-conversation analysis
│   │   ├── progress/page.tsx     # Gamification dashboard
│   │   ├── journal/page.tsx      # Career journal (premium)
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── (marketing)/              # Public pages
│   │   ├── page.tsx              # Landing page
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── conversations/
│   │   ├── scenarios/
│   │   ├── voice/
│   │   ├── billing/
│   │   └── webhooks/
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── chat/
│   │   ├── ChatContainer.tsx     # Main chat wrapper
│   │   ├── ChatMessage.tsx       # Individual message
│   │   ├── ChatInput.tsx         # Input with voice toggle
│   │   ├── PersonaAvatar.tsx     # Animated persona display
│   │   ├── TypingIndicator.tsx
│   │   └── VoiceButton.tsx       # Push-to-talk
│   ├── scenarios/
│   │   ├── ScenarioCard.tsx
│   │   ├── ScenarioGrid.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── DifficultyBadge.tsx
│   ├── analysis/
│   │   ├── ScoreRadar.tsx        # Radar chart for skills
│   │   ├── ScoreBreakdown.tsx
│   │   ├── KeyMoments.tsx
│   │   └── Suggestions.tsx
│   ├── gamification/
│   │   ├── XPBar.tsx
│   │   ├── LevelBadge.tsx
│   │   ├── StreakCounter.tsx
│   │   ├── AchievementCard.tsx
│   │   └── SkillTree.tsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx
│   │   ├── RoleSelector.tsx
│   │   └── FearQuiz.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   └── common/
│       ├── Logo.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── gemini/
│   │   ├── client.ts
│   │   ├── prompts.ts            # System prompts
│   │   └── analysis.ts           # Analysis prompt
│   ├── elevenlabs/
│   │   └── client.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── config.ts
│   └── utils/
│       ├── cn.ts                 # Tailwind merge
│       └── constants.ts
│
├── hooks/
│   ├── useChat.ts                # Chat state + streaming
│   ├── useVoice.ts               # Web Speech API
│   ├── useSubscription.ts        # Tier checks
│   └── useProgress.ts            # Gamification state
│
├── stores/
│   ├── chatStore.ts              # Zustand chat state
│   └── userStore.ts              # User preferences
│
└── types/
    ├── database.ts               # Supabase generated types
    ├── api.ts                    # API request/response types
    └── index.ts
```

---

## Build Phases

### Phase 1: MVP Foundation (4 weeks)

**Week 1: Setup + Auth**
- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up Supabase project + database schema
- [ ] Implement auth (email + Google OAuth)
- [ ] Create onboarding flow
- [ ] Basic profile management
- **Deliverable:** Users can sign up, complete onboarding, see dashboard

**Week 2: Scenarios + Chat Core**
- [ ] Seed 5 scenarios + 3 personas
- [ ] Build scenario browsing UI
- [ ] Implement Gemini integration
- [ ] Build chat interface (text-only)
- [ ] Message streaming via SSE
- [ ] Conversation persistence
- **Deliverable:** Users can browse scenarios and have AI conversations

**Week 3: Analysis + Polish**
- [ ] Implement post-conversation analysis
- [ ] Build analysis display UI
- [ ] Score breakdown + suggestions
- [ ] Conversation history view
- [ ] Error handling + loading states
- [ ] Mobile responsiveness pass
- **Deliverable:** Complete conversation loop with feedback

**Week 4: Launch Prep**
- [ ] Landing page
- [ ] Basic analytics (PostHog)
- [ ] Rate limiting (free tier: 3/month)
- [ ] Bug fixes + QA
- [ ] Deploy to Vercel
- [ ] Domain setup
- **Deliverable:** Live MVP for beta users

### Phase 2: Gamification (2 weeks)

**Week 5:**
- [ ] XP + leveling system
- [ ] Streak tracking
- [ ] Achievement framework
- [ ] 10 core achievements

**Week 6:**
- [ ] Progress dashboard
- [ ] Skill radar chart
- [ ] Level-up animations
- [ ] Daily challenges (basic)
- **Deliverable:** Engaging progression system

### Phase 3: Premium Features (2 weeks)

**Week 7:**
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Billing portal
- [ ] Tier gating (scenarios, features)

**Week 8:**
- [ ] "Upload Your Boss" feature
- [ ] Career journal
- [ ] Additional personas (10 more)
- [ ] Additional scenarios (15 more)
- **Deliverable:** Full premium tier live

### Phase 4: Social Features (2 weeks)

**Week 9:**
- [ ] Share to social (Twitter, LinkedIn)
- [ ] Leaderboard (opt-in)
- [ ] Friend challenges

**Week 10:**
- [ ] Community scenario submission
- [ ] Scenario ratings/comments
- [ ] Social proof widgets
- **Deliverable:** Viral mechanics in place

### Phase 5: Voice + Polish (2 weeks)

**Week 11:**
- [ ] ElevenLabs integration
- [ ] Voice credit system
- [ ] TTS for persona responses
- [ ] Push-to-talk input (Web Speech API)

**Week 12:**
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] PWA setup (optional)
- [ ] Final polish + QA
- **Deliverable:** Full product launch ready

---

## Cost Projections

### Development Costs (One-time)
| Item | Cost |
|------|------|
| Domain (whispie.ai) | ~$50/year |
| Supabase Pro (during dev) | Free tier sufficient |
| ElevenLabs (testing) | ~$50 |
| **Total Dev Setup** | **~$100** |

### Monthly Operating Costs (at scale)

#### Infrastructure
| Service | Free Tier | At 1K Users | At 10K Users |
|---------|-----------|-------------|--------------|
| Vercel | $0 | $20/mo | $40/mo |
| Supabase | $0 | $25/mo | $75/mo |
| PostHog | $0 | $0 | $450/mo |
| **Subtotal** | $0 | $45/mo | $565/mo |

#### API Costs (Variable)

**Gemini 1.5 Flash:**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- Avg conversation: ~2K tokens = ~$0.0007
- 1K users × 10 convos/mo = $7/mo
- 10K users × 10 convos/mo = $70/mo

**ElevenLabs (Voice):**
- ~$0.30 per 1K characters
- Avg response: 500 chars = $0.15
- If 20% of Pro users use 4 chats = minimal
- Estimate: $100/mo at 10K users

#### Cost Summary

| Scale | Monthly Cost | Per-User Cost |
|-------|--------------|---------------|
| MVP (100 users) | ~$20 | $0.20 |
| 1K users | ~$150 | $0.15 |
| 10K users | ~$750 | $0.075 |

### Revenue Projections

| Metric | Conservative | Optimistic |
|--------|--------------|------------|
| Free users | 80% | 70% |
| Pro conversion | 15% | 25% |
| Lifetime conversion | 5% | 5% |
| ARPU | ~$1.80 | ~$3.00 |

**At 10K users:**
- Conservative: $18,000/mo revenue
- Optimistic: $30,000/mo revenue
- Costs: ~$750/mo
- **Gross margin: 95%+**

### Break-even Analysis

With ~$750/mo costs at 10K users:
- Need ~63 Pro subscribers ($12/mo) to break even
- Or ~8 Lifetime purchases/month ($99)
- **Break-even point: ~400 total users (at 15% conversion)**

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Gemini latency | Stream responses, show typing indicator |
| ElevenLabs costs spike | Strict credit system, usage caps |
| Supabase limits | Monitor usage, optimize queries |

### Product Risks
| Risk | Mitigation |
|------|------------|
| Low engagement | Gamification, streaks, daily challenges |
| Users outgrow quickly | Expand scenario library, community content |
| AI feels robotic | Tune personas carefully, use quality prompts |

### Business Risks
| Risk | Mitigation |
|------|------------|
| Low conversion | Voice as compelling upgrade, strong free experience |
| High churn | Career journal creates lock-in, progress loss aversion |
| Competition | Fast iteration, strong brand, community moat |

---

## Next Steps

1. **Validate assumptions** - Share with 5-10 target users for feedback
2. **Set up dev environment** - Initialize repo, configure Supabase
3. **Design first** - Create Figma mockups for core flows
4. **Build MVP** - Execute Phase 1 (4 weeks)
5. **Beta launch** - Get 50-100 beta users for feedback
6. **Iterate** - Refine based on usage data

---

## Open Questions for Brad

1. **Persona voices:** Should we use different ElevenLabs voices for each persona, or start with 2-3 voice types?

2. **Analytics depth:** PostHog can get expensive at scale. Should we self-host or use a simpler alternative like Plausible for MVP?

3. **Mobile priority:** Is mobile-first important, or can we optimize desktop first and treat mobile as "good enough"?

4. **Community moderation:** For user-submitted scenarios, do we need manual review or can AI moderation suffice?

5. **Expert partnership:** Should we delay launch until we have Adele Stickland (or similar) on board for credibility, or launch MVP first?

6. **Naming:** Is "Whispie" the final name? Domain availability?

---

*Plan created by Claude based on FEATURES.md and GTM.md specifications*
