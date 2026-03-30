# AgentLab — Spec-Driven Development

This project follows **Spec-Driven Development (SDD)** methodology.

## What is SDD?

Spec-Driven Development means writing a "spec" before writing code with AI ("documentation first"). The spec becomes the source of truth for both the human and the AI agent building the software.

### Our SDD Workflow
1. **Write spec** — Define purpose, behavior, acceptance criteria, edge cases
2. **Review spec** — Human approves the spec
3. **Implement from spec** — AI or human builds exactly what's specified
4. **Validate** — Check against acceptance criteria
5. **Mark done** — Update spec status when complete

### SDD Levels

| Level | Description | AgentLab Status |
|-------|-------------|-----------------|
| **Spec-first** | Write spec before coding | ✅ All 9 specs written |
| **Spec-anchored** | Keep spec alive, evolve with product | 📋 Specs updated as needed |
| **Spec-as-source** | Human never touches code, only specs | ⏳ Phase 2 (optional) |

---

## Spec Index

| # | Spec | Priority | Status | Est. Effort | Dependencies |
|---|------|----------|--------|-------------|--------------|
| 00 | [Architecture & Foundation](./00-architecture.md) | P0 | Ready | 2–3h | — |
| 01 | [Authentication](./01-auth.md) | P0 | Ready | 4–6h | 00 |
| 02 | [Onboarding](./02-onboarding.md) | P1 | Ready | 2–3h | 01 |
| 03 | [Dashboard](./03-dashboard.md) | P1 | Ready | 2h | 00, 01 |
| 04 | [Agent Store](./04-agent-store.md) | P1 | Ready | 2h | 00 |
| 05 | [Agent CRUD](./05-agent-crud.md) | P1 | Ready | 3–4h | 00, 04 |
| 06 | [Chat Interface](./06-chat.md) | P1 | Ready | 4–5h | 00, 05 |
| 07 | [Settings](./07-settings.md) | P2 | Ready | 2–3h | 00, 01 |
| 08 | [Landing Page](./08-landing.md) | P2 | Ready | 3h | 00 |
| 09 | [Deployment & Documentation](./09-deployment.md) | P2 | Ready | 2h | All |

**Total estimated effort:** ~26–32 hours

---

## How to Read

1. Start with [PRD.md](../PRD.md) for high-level vision
2. Read specs in order (00 → 01 → 02 → ...)
3. Each spec contains:
   - **Purpose** — Why this feature exists
   - **Behavior** — How it works
   - **UI/API Specification** — Exact implementation details
   - **Acceptance Criteria** — Checklist for "done"
   - **Edge Cases** — What to handle
   - **Definition of Done** — Final validation

---

## For Portfolio Reviewers

This project demonstrates:
- ✅ Modern SDD methodology
- ✅ Full-stack TypeScript/Next.js
- ✅ Secure auth with email verification
- ✅ BYOK (Bring Your Own Key) architecture
- ✅ Production-ready deployment (Docker + Dokploy)
- ✅ Comprehensive documentation

Each spec is a complete blueprint — you can verify the implementation matches the spec exactly.

---

_Built by Gustavo Karsten · 2026_
