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
| 00 | [Architecture & Foundation](./00-architecture.md) | P0 | ✅ Implemented | 2–3h | — |
| 01 | [Authentication](./01-auth.md) | P0 | ✅ Implemented | 4–6h | 00 |
| 02 | [Onboarding](./02-onboarding.md) | P1 | ✅ Implemented | 2–3h | 01 |
| 03 | [Dashboard](./03-dashboard.md) | P1 | ✅ Implemented | 2h | 00, 01 |
| 04 | [Agent Store](./04-agent-store.md) | P1 | ✅ Implemented | 2h | 00 |
| 05 | [Agent CRUD](./05-agent-crud.md) | P1 | ✅ Implemented | 3–4h | 00, 04 |
| 06 | [Chat Interface](./06-chat.md) | P1 | ✅ Implemented | 4–5h | 00, 05 |
| 07 | [Settings](./07-settings.md) | P2 | ✅ Implemented | 2–3h | 00, 01 |
| 08 | [Landing Page](./08-landing.md) | P2 | ✅ Implemented | 3h | 00 |
| 09 | [Deployment & Documentation](./09-deployment.md) | P2 | ✅ Implemented | 2h | All |
| 10 | [Multi-Provider BYOK](./10-multi-provider.md) | P1 | ⚡ Post-build | — | 00, 02, 07 |
| 11 | [LangGraph Lab Mode](./11-langgraph-lab.md) | P1 | ⚡ Post-build | — | 00, 05, 06, 10 |

**Total estimated effort:** ~26–32 hours

**Post-build features:** 2 features implemented after the initial spec-driven build (see specs 10–11).

---

## Post-Build Features

After the initial 10 specs were implemented, two major features were added that were **not in the original design**. These are documented in dedicated specs with `⚡ Post-build` status so they are clearly distinguishable from the original spec-driven work.

| Feature | Spec | What Was Added |
|---------|------|---------------|
| Multi-Provider BYOK | [Spec 10](./10-multi-provider.md) | OpenAI support, dynamic model selection per agent, `provider` + `model` fields |
| LangGraph Lab Mode | [Spec 11](./11-langgraph-lab.md) | Python FastAPI backend, 5-node LangGraph pipeline, real-time ExecutionLog + GraphDiagram |

> Existing specs (00–09) that were affected by these features have a `## ⚡ Post-Build Additions` section appended to their original spec content.

---

## How to Read

1. Start with [PRD.md](../docs/PRD.md) for high-level vision
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
- ✅ BYOK (Bring Your Own Key) architecture — Anthropic **and** OpenAI
- ✅ Dynamic model selection per agent (fetched from provider API)
- ✅ Python microservice (FastAPI + LangGraph) with SSE streaming
- ✅ Real-time agent observability (ExecutionLog, GraphDiagram, Langfuse)
- ✅ Production-ready deployment (Docker + Dokploy)
- ✅ Comprehensive documentation

Specs 00–09 represent the original spec-driven design. Specs 10–11 document features added post-build — clearly separated to show the evolution of the project.

Each spec is a complete blueprint — you can verify the implementation matches the spec exactly.

---

_Built by Gustavo Karsten · 2026_
