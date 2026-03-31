# Spec 08 — Landing Page
**Status:** Implemented
**Priority:** P2  
**Estimated effort:** 3h  
**Depends on:** spec/00-architecture.md  
**Design:** Use frontend-design skill extensively — make it SPECTACULAR

---

## Purpose
Public homepage that showcases AgentLab, explains the value proposition, and converts visitors into users.

---

## Behavior

### Public Access
- No auth required
- If user is logged in: show "Go to Dashboard" CTA instead of "Get Started"

---

## Sections

### Hero
**Visual:**
- Full-viewport height
- Animated gradient background (deep blue to purple, slow shift)
- Floating agent emoji bubbles (CSS animation, parallax)
- Centered content

**Content:**
- Headline: "Build your AI agent in minutes" (animated entrance, word by word or fade-in)
- Subline: "Create agents with unique personalities. Your rules. Your API key. Your privacy."
- CTA buttons:
  - "Get Started" (primary, large)
  - "Watch Demo" (secondary, with play icon)
- If logged in: "Go to Dashboard" replaces "Get Started"

---

### Features (3 cards)
**Layout:**
- 3 columns (stacks on mobile)
- Icon + title + description per card

**Features:**
1. **Custom Personalities** — "Define how your agent thinks, talks, and helps. From formal to friendly, you choose."
2. **BYOK Privacy** — "Your API key stays yours. We encrypt it. You control it. No middleman."
3. **Instant Chat** — "Start chatting immediately. Streaming responses, conversation history, and multi-language support."

**Visual:**
- Card hover: lift + shadow
- Icons: Lucide (Brain, Lock, MessageSquare)

---

### Live Demo (Static mock)
**Visual:**
- Split: left = agent card preview, right = mock chat
- Agent card: emoji, name, "Personal Assistant"
- Chat: 2 user messages, 2 assistant responses (fake but realistic)
- Animated typing effect on last assistant message

**Copy:**
- Caption: "This is what using AgentLab looks like."

---

### Testimonials (Optional, 3)
- If real testimonials don't exist: use placeholder "quotes from beta users" (mark as placeholder in comment)
- Card: quote, name, role, avatar

---

### CTA Section (Bottom)
**Visual:**
- Dark background
- Centered text

**Content:**
- Headline: "Ready to build your agent?"
- Subline: "Free to start. No credit card required."
- CTA: "Get Started Now" (large button)

---

### Footer
- Links: GitHub, Twitter/X, Terms, Privacy
- Copyright: "© 2026 AgentLab. Built by Gustavo Karsten."

---

## UI Specification (Apply frontend-design skill)

**Typography:**
- Headline: Bold display font (not Inter/Roboto — choose distinctive like `Instrument Serif`, `Playfair Display`, `Outfit`, or `Space Grotesk`)
- Body: Clean sans-serif, highly readable

**Color:**
- Dark theme for landing (can contrast with light app theme)
- Accent: vivid blue or purple gradient
- Use CSS variables for consistency

**Motion:**
- Hero entrance: staggered fade + slide
- Feature cards: scroll-triggered fade-in
- Floating bubbles: slow CSS animation
- CTA button: subtle glow or pulse

**Accessibility:**
- All text contrast ≥ 4.5:1
- Focus states visible
- CTA buttons keyboard accessible
- Alt text on any decorative images

---

## Acceptance Criteria
- [ ] Hero displays headline, subline, CTA
- [ ] "Get Started" navigates to /register
- [ ] "Watch Demo" scrolls to demo section (or opens modal)
- [ ] Logged-in user sees "Go to Dashboard" instead of "Get Started"
- [ ] Features section shows 3 cards with icons
- [ ] Live demo shows agent card + mock chat
- [ ] Typing animation on mock chat message
- [ ] CTA section at bottom
- [ ] Footer with links
- [ ] Responsive: mobile stacks correctly
- [ ] Animations play on scroll/load
- [ ] No CLS (content layout shift)
- [ ] Lighthouse performance ≥ 90

## Edge Cases
- User scrolls fast → animations don't lag
- Mobile screen → hero adapts, bubbles removed or simplified
- No JavaScript → hero still readable (graceful degradation)

## Definition of Done
All acceptance criteria checked. Page is visually striking. Animations smooth. Mobile responsive. Lighthouse score good.
