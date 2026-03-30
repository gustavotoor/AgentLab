# Spec 04 — Agent Store
**Status:** Ready to implement  
**Priority:** P1  
**Estimated effort:** 2h  
**Depends on:** spec/00-architecture.md

---

## Purpose
A catalog of pre-built agent templates. Users browse, filter, and pick a template as the starting point for their own agent. Templates define the base personality and purpose of the agent.

---

## Templates

All 8 templates are static (hardcoded — no DB table needed):

| ID | Emoji | Name | Description | Categories |
|----|-------|------|-------------|-----------|
| `personal-assistant` | 🤝 | Personal Assistant | Organizes your day, tasks, and thoughts | productivity |
| `business-consultant` | 💼 | Business Consultant | Strategy, analysis, and decision support | business |
| `professor` | 🎓 | Professor | Explains any topic clearly and patiently | education |
| `copywriter` | ✍️ | Copywriter | Writes texts, copy, and emails that convert | creative |
| `dev-assistant` | 💻 | Dev Assistant | Code reviews, debug help, and technical questions | technical |
| `coach` | 🧘 | Life Coach | Goal setting, motivation, and focus | wellness |
| `support-agent` | 🛒 | Support Agent | FAQ, customer support, and sales | business |
| `free-agent` | 🎭 | Free Agent | No template — define everything yourself | all |

### Template Personality Bases (used in system prompt generation)

Each template contributes a base personality block to the system prompt:

- **personal-assistant:** "You are a highly organized personal assistant. You help with tasks, scheduling, reminders, and keeping things in order. You are proactive, concise, and always focused on helping the user stay on top of their day."
- **business-consultant:** "You are a seasoned business consultant. You think analytically, ask clarifying questions, and provide structured recommendations backed by reasoning."
- **professor:** "You are a patient and knowledgeable professor. You explain complex topics in simple terms, use examples and analogies, and check for understanding."
- **copywriter:** "You are a skilled copywriter who writes compelling, clear, and conversion-focused content. You adapt your tone to the brand and audience."
- **dev-assistant:** "You are a senior software engineer. You write clean, well-documented code, explain technical concepts clearly, and always consider edge cases and performance."
- **coach:** "You are an empathetic life coach. You ask powerful questions, help the user clarify their goals, and motivate them with a warm, encouraging tone."
- **support-agent:** "You are a friendly customer support agent. You resolve issues efficiently, stay positive under pressure, and always represent the brand well."
- **free-agent:** "You are a flexible AI assistant. Your personality and behavior will be defined entirely by the user's custom instructions."

---

## Behavior

### Browsing
- Page shows all 8 templates by default
- Filter tabs: All | Productivity | Business | Creative | Technical | Wellness
- Search input: filters templates by name or description (client-side, no API call)
- No pagination needed (only 8 templates)

### Using a Template
- Each card has "Use this template" button
- Clicking navigates to `/agents/new?template=[templateId]`
- The create agent form pre-fills with the selected template

---

## UI Specification

**Header:**
- Page title: "Agent Store"
- Subtitle: "Choose a template to start from"
- Search input (right side or below title)

**Filter Tabs:**
- Horizontal tabs: All | Productivity | Business | Creative | Technical | Wellness
- Active tab: accent color underline
- Clicking filters the grid client-side

**Template Cards:**
- Grid: 3 cols desktop, 2 tablet, 1 mobile
- Card contents:
  - Large emoji (top, centered, 48px)
  - Template name (bold)
  - Short description (2 lines max, truncate)
  - Category badge (small, colored)
  - "Use template" button (secondary style)
- Hover: card elevates, button becomes primary style
- Special treatment for "Free Agent": dashed border, slightly different background

**Empty search state:**
- "No templates match your search"
- Clear search button

---

## API Specification
No API calls needed — templates are static and rendered server-side or as a client component. The `/agents/new?template=xxx` route reads the query param.

---

## Acceptance Criteria
- [ ] All 8 templates are displayed
- [ ] Filter tabs work (show/hide templates by category)
- [ ] Search filters by name and description
- [ ] "Use template" navigates to /agents/new with correct templateId
- [ ] Templates display emoji, name, description, category badge
- [ ] Free Agent card has distinct visual treatment
- [ ] Responsive layout works on mobile

## Edge Cases
- User searches for something with no match → empty state
- User navigates directly to /agents/new without a template → form works with empty template (defaults to free-agent)

## Definition of Done
All acceptance criteria checked. All 8 templates visible. Filters and search work. Navigation to create form works correctly.
