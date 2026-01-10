# Design Guidelines: Marketing Simulation Educational Platform

## Design Approach

**Selected Approach:** Hybrid - Material Design foundation with gamified educational elements

**Justification:** This educational productivity tool requires clarity and efficiency (utility-focused) while maintaining student engagement through vibrant, game-like aesthetics. Drawing inspiration from platforms like Duolingo for gamification + productivity tools like Notion for dashboard organization.

**Key Design Principles:**
- Clarity first: Information hierarchy must be immediately scannable
- Engaging but not distracting: Vibrant without overwhelming
- Educational feedback: Visual cues that teach marketing concepts
- Progress visibility: Clear indicators of performance and achievements

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - Clean, modern sans-serif for UI and data
- Accent: Poppins (via Google Fonts) - Bold, friendly for headlines and CTAs

**Hierarchy:**
- Page Titles: Poppins Bold, 2xl-3xl
- Section Headers: Poppins Semibold, xl-2xl
- Card Titles: Inter Semibold, lg
- Body Text: Inter Regular, base
- Metrics/Numbers: Inter Bold, lg-2xl (emphasize data)
- Labels: Inter Medium, sm

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, and 12
- Tight spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, gap-4, m-4 (between elements)
- Section spacing: p-6, py-8 (card padding)
- Major spacing: p-8, gap-8, py-12 (dashboard sections)

**Grid Structure:**
- Dashboard: 12-column grid with 2-column sidebar (navigation) + 10-column main area
- Campaign cards: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Metrics overview: 4-column grid for KPI cards
- Mobile: All stack to single column with sidebar collapsing to hamburger menu

## Component Library

**Navigation:**
- Left sidebar (fixed, w-64): Company logo at top, main sections (Dashboard, Campanhas, Decisões, Análises, Orçamento), progress indicator at bottom
- Top bar: Breadcrumb navigation, student name/team, budget display, notification bell

**Dashboard Cards:**
- Elevated cards with subtle shadow (shadow-md)
- Rounded corners (rounded-lg)
- Header with icon + title + action button
- Content area with clear data presentation
- Footer with timestamp or secondary actions

**KPI Metrics Cards:**
- Compact rectangular cards (aspect ratio 2:1)
- Large number display (3xl, bold) at top
- Metric label below (sm, medium)
- Trend indicator (arrow icon + percentage change)
- Background gradient subtle accent (specific color assignment later)

**Campaign Management:**
- Campaign creation form: Multi-step wizard with progress indicator, each step in its own card
- Campaign cards: Image thumbnail (if added), campaign name, status badge, key metrics preview, action buttons row
- Status badges: Rounded-full pills with icons (Planejando, Ativa, Concluída, Pausada)

**Decision Interfaces:**
- Interactive slider components for budget allocation
- Radio button groups with descriptive cards for strategic choices
- Toggle switches for feature activation
- Preview panels showing decision impact in real-time

**Analysis & Charts:**
- Chart containers with white/neutral background
- Chart legends positioned at top-right
- Use chart.js or recharts for visualizations
- Bar charts for campaign comparison
- Line charts for performance over time
- Pie/donut charts for budget distribution
- Metric cards flanking charts for context

**Forms & Inputs:**
- Consistent input height (h-10 for text inputs, h-12 for buttons)
- Floating labels or top-aligned labels
- Clear validation states with inline error messages
- Helper text in smaller font (text-sm) below inputs
- Primary action buttons: Large (h-12), bold text, prominent
- Secondary actions: Ghost or outline variants

**Gamification Elements:**
- Achievement badges: Circular icons with border, unlocked state has glow effect
- Progress bars: Rounded-full, animated fill, percentage display
- Level indicators: Prominent badge in top bar with current level/XP
- Leaderboard: Ranked list with position number, team name, score, medal icons for top 3

**Modals & Overlays:**
- Centered modal with max-w-2xl
- Backdrop with semi-transparent overlay
- Close button (X) at top-right
- Action buttons at bottom-right (Cancel left, Confirm right)

**Data Tables:**
- Striped rows for readability
- Sortable column headers with sort indicators
- Action column (right-aligned) with icon buttons
- Responsive: Collapse to card layout on mobile

## Images

**Hero Dashboard Banner:**
- Full-width banner (h-48) at top of dashboard
- Abstract marketing-themed illustration (graphs trending up, megaphone icons, target symbols)
- Overlaid welcome message ("Bem-vindo de volta, [Nome]")
- Semi-transparent gradient overlay for text readability

**Campaign Thumbnails:**
- Small square thumbnails (w-16 h-16) in campaign cards
- Placeholder: Icon-based graphics representing campaign type (social media, email, outdoor)
- Use Heroicons for consistency

**Empty States:**
- Centered illustrations for "no campaigns yet" states
- Simple line art style, friendly and encouraging
- Clear CTA button below illustration

**Icons:**
- Use Heroicons throughout for UI consistency
- Larger icons (h-6 w-6) for navigation and card headers
- Standard icons (h-5 w-5) for inline elements
- Small icons (h-4 w-4) for badges and labels

## Animations

Use sparingly:
- Progress bar fills: Smooth transition on load
- Card hover: Subtle lift effect (translate-y-1)
- Button interactions: Built-in component states only
- Chart animations: Brief entrance animation on load (1s duration max)