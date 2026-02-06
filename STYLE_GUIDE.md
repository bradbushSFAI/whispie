# Whispie Style Guide

> Extracted from Google_design reference files
> Created: 2026-02-05

---

## Typography

**Primary Font:** Manrope (Google Fonts)
```css
font-family: 'Manrope', sans-serif;
```

**Weights Used:**
- 400 (Regular) - Body text
- 500 (Medium) - Labels, secondary text
- 700 (Bold) - Headings, emphasis
- 800 (Extra Bold) - Hero text

**Font Sizes (Reference):**
- Page title: text-3xl (1.875rem)
- Section heading: text-lg (1.125rem)
- Card title: text-base (1rem)
- Body/description: text-sm (0.875rem)
- Labels: text-xs (0.75rem)
- Tiny labels: text-[10px]

---

## Color Palette

### Core Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Primary** | `#38e07b` | `primary` | CTAs, accents, active states |
| **Background Light** | `#f6f8f7` | `background-light` | Light mode background |
| **Background Dark** | `#122017` | `background-dark` | Dark mode background |
| **Surface Dark** | `#1a2c22` | `surface-dark` | Cards on dark background |

### Semantic Colors
| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary text | `slate-900` | `white` |
| Secondary text | `slate-500` | `slate-400` |
| Muted text | `slate-400` | `slate-500` |
| Borders | `slate-200` | `white/10` or `primary/20` |

### Accent Colors (for categories/icons)
| Name | Hex | Usage |
|------|-----|-------|
| Blue | `blue-600` / `blue-400` | Currency, finance scenarios |
| Purple | `purple-600` / `purple-400` | Psychology, manipulation topics |
| Pink | `pink-600` / `pink-400` | Boundaries, saying no |
| Orange | `orange-500` | Streaks, fire/urgency |
| Yellow | `yellow-500` | Ratings, stars |

---

## Tailwind Config Extension

```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#38e07b",
        "background-light": "#f6f8f7",
        "background-dark": "#122017",
        "surface-dark": "#1a2c22",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      },
    },
  },
}
```

---

## Component Patterns

### Cards
```css
/* Light mode card */
rounded-2xl bg-white border border-slate-200 p-4 shadow-sm

/* Dark mode card */
rounded-2xl bg-white/5 border border-white/10 p-4

/* Hover state */
hover:border-primary/50 transition-colors
```

### Buttons

**Primary CTA:**
```css
rounded-xl bg-primary text-background-dark h-14 px-6
font-bold text-lg
shadow-[0_0_20px_rgba(56,224,123,0.3)]
hover:shadow-[0_0_30px_rgba(56,224,123,0.5)]
hover:scale-[1.02] active:scale-[0.98]
```

**Icon Button:**
```css
size-10 rounded-full
bg-slate-200 dark:bg-white/5
text-slate-600 dark:text-slate-300
hover:bg-primary/20 hover:text-primary
```

### Status Badges
```css
/* Hard */
bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase

/* Medium/Easy */
bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300
```

### Progress Bar
```css
/* Container */
h-3 w-full rounded-full bg-slate-700 dark:bg-black/40 overflow-hidden

/* Fill */
h-full bg-primary rounded-full
```

---

## Icons

**System:** Material Symbols Outlined (Google)
```css
font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
```

**Icon Sizes:**
- Navigation: text-[24px]
- Card icons: text-[28px]
- Inline: text-[16px] or text-[20px]
- Decorative: text-[80px]

**Common Icons Used:**
- `dashboard` - Home
- `school` - Practice
- `bar_chart` - Stats
- `person` - Profile
- `notifications` - Alerts
- `bolt` - Quick action
- `military_tech` - Rank
- `whatshot` / `local_fire_department` - Streak
- `schedule` - Duration
- `star` - Rating
- `arrow_forward` - Navigation

---

## Layout

### Spacing
- Page padding: `px-5`
- Section gaps: `gap-6`
- Card internal padding: `p-4` or `p-5`
- Card gaps: `gap-3`

### Navigation
- Fixed bottom nav with `safe-area-bottom`
- Sticky top header
- Content padding: `pb-24` (for bottom nav clearance)

---

## Dark Mode

**Default:** Dark mode (`class="dark"` on html element)

**Switching:**
- Use `dark:` prefix for dark mode variants
- Primary background shifts from light gray to deep green-black
- Text inverts from slate-900 to white
- Borders use alpha transparency (`white/10`, `primary/20`)

---

## Design References

Located in `/Google_design/`:
| Screen | Folder | Files |
|--------|--------|-------|
| Dashboard | `whispie_dashboard/` | code.html, screen.png |
| Scenario Library | `scenario_library/` | code.html, screen.png |
| Conversation Simulator | `conversation_simulator/` | code.html, screen.png |
| Post-Chat Analysis | `post-chat_analysis/` | code.html, screen.png |

**Usage:** When building screens, reference the corresponding `code.html` for exact implementation and `screen.png` for visual verification.
