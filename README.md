# AgentLab

> Plataforma BYOK para criar e conversar com agentes de IA personalizados — usando sua própria chave da Anthropic ou OpenAI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)

---

## O que é o AgentLab

AgentLab é uma aplicação web onde você cria **agentes de IA personalizados** a partir de templates — cada um com nome, personalidade, tom de voz e modelo próprios. Os agentes são alimentados pela sua própria chave da Anthropic ou OpenAI (modelo BYOK — _Bring Your Own Key_): você paga diretamente ao provedor, sem intermediários.

O projeto nasceu como portfólio técnico, mas foi construído com a arquitetura e os cuidados de um produto real: auth completo com verificação de e-mail, criptografia AES-256-GCM para as chaves, i18n PT-BR/EN, suporte a múltiplos providers, seleção dinâmica de modelos e um modo laboratório com observabilidade em tempo real via LangGraph + Langfuse.

---

## Funcionalidades

### Agentes e Chat
- **8 templates de agentes** — Assistente Pessoal, Consultor, Professor, Redator, Dev Assistant, Coach, Atendente e Personagem Livre
- **Personalização completa** — nome, emoji, personalidade, tom (formal/casual/técnico/amigável) e idioma por agente
- **Seleção de modelo** — escolha o modelo (Claude Sonnet, Opus, GPT-5, o3-mini…) individualmente por agente, com lista atualizada diretamente da API do provider
- **Chat com streaming** — resposta em tempo real, token por token
- **Histórico persistente** — conversas salvas por agente com título gerado automaticamente

### Multi-Provider BYOK
- **Anthropic** e **OpenAI** suportados simultaneamente
- Chaves criptografadas com AES-256-GCM antes de serem salvas — nunca trafegam em plaintext após o POST inicial
- Lista de modelos disponíveis buscada em tempo real da API do provider — sempre atualizada

### Modo Laboratório (LangGraph)
- Ative o **Lab Mode** em qualquer agente para ver o raciocínio em tempo real
- Pipeline LangGraph com 5 nós: `classify_intent → retrieve_context → execute_tools → generate_response → validate_response`
- **ExecutionLog** — painel terminal ao vivo com timestamp e duração de cada nó
- **GraphDiagram** — diagrama SVG do pipeline com destaque dinâmico dos nós em execução
- **ObservabilityPanel** — link para o trace completo no Langfuse
- Ferramentas disponíveis: `web_search` (SearXNG), `calculator`, `datetime`

### Autenticação
- Cadastro com verificação de e-mail (token SHA-256, expira em 24h)
- Login com JWT via NextAuth.js, sessão persistente
- Recuperação de senha com token (expira em 1h)
- Onboarding guiado para novos usuários

### UX
- **Multilingual** — PT-BR (padrão) e Inglês, sem roteamento por URL
- **Temas** — claro, escuro e sistema (next-themes)
- **Containerizado** — `docker compose up` sobe o stack completo

---

## Arquitetura

O AgentLab tem dois serviços principais:

```
Browser
  │
  ├── Next.js 15 (App Router)           ← porta 3000
  │     ├── React Server Components
  │     ├── API Routes (auth, agents, chat, models)
  │     └── Prisma ORM → PostgreSQL
  │
  └── Python FastAPI (LangGraph)        ← porta 8000
        ├── LangGraph pipeline (5 nós)
        ├── SSE streaming → Next.js → Browser
        └── Langfuse observability (opcional)
```

O Next.js atua como orquestrador: descriptografa a chave BYOK do usuário, encaminha a requisição para o backend Python (somente no Lab Mode), e faz proxy dos eventos SSE de volta ao browser. **A chave de API do usuário nunca chega ao frontend.**

Para o chat padrão (sem Lab Mode), o Next.js chama Anthropic ou OpenAI diretamente via Vercel AI SDK — sem passar pelo backend Python.

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Framework** | Next.js (App Router) | 15.x |
| **Linguagem** | TypeScript (strict mode) | 5.x |
| **Estilização** | Tailwind CSS + shadcn/ui | 3.x |
| **Animações** | Framer Motion | 11.x |
| **ORM** | Prisma | 6.x |
| **Banco de dados** | PostgreSQL | 16 |
| **Autenticação** | NextAuth.js | 4.x |
| **AI (streaming)** | Vercel AI SDK | 4.x |
| **Provider Anthropic** | @ai-sdk/anthropic | 1.x |
| **Provider OpenAI** | @ai-sdk/openai | 1.x |
| **i18n** | next-intl | 3.x |
| **Criptografia** | Node.js crypto (built-in) | — |
| **Hashing** | bcryptjs | 2.x |
| **E-mail** | Nodemailer (SMTP) | 6.x |
| **Validação** | Zod | 3.x |
| **Backend AI** | Python FastAPI | 0.115.x |
| **Orquestração de agente** | LangGraph | 0.2.x |
| **LLM (backend)** | langchain-anthropic / openai | 0.3.x |
| **Observabilidade** | Langfuse | 2.x |
| **Busca web** | SearXNG (self-hosted) | — |
| **Containerização** | Docker + docker-compose | — |

---

## Pré-requisitos

- **Node.js** 20+
- **Python** 3.11+ (apenas se quiser o Lab Mode fora do Docker)
- **PostgreSQL** 16+ (ou Docker)
- Chave da [Anthropic](https://console.anthropic.com) e/ou [OpenAI](https://platform.openai.com) — os usuários trazem a própria

---

## Configuração Rápida

### Opção A — Docker (recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/gustavotoor/agentlab.git
cd agentlab

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores (veja seção abaixo)

# 3. Suba todos os serviços (Next.js + Python backend + PostgreSQL)
docker compose up -d

# 4. Rode as migrações do banco
docker compose exec app npx prisma migrate deploy

# 5. Acesse em http://localhost:3000
```

### Opção B — Desenvolvimento local

```bash
# 1. Clone e instale as dependências Node
git clone https://github.com/gustavotoor/agentlab.git
cd agentlab
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local (PostgreSQL deve estar rodando localmente)

# 3. Rode as migrações
npx prisma migrate dev

# 4. Inicie o Next.js
npm run dev

# (Opcional) Backend Python para o Modo Lab
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` (Docker) ou `.env.local` (dev local) e preencha:

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `DATABASE_URL` | Sim | String de conexão PostgreSQL |
| `NEXTAUTH_SECRET` | Sim | Secret aleatório — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Sim | URL completa do app (ex: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Sim | URL pública do app |
| `ENCRYPTION_KEY` | Sim | Chave hex 64 chars — `openssl rand -hex 32` |
| `SMTP_HOST` | Para e-mail | Hostname do servidor SMTP |
| `SMTP_PORT` | Para e-mail | Porta SMTP (padrão: `587`) |
| `SMTP_USER` | Para e-mail | Usuário SMTP |
| `SMTP_PASS` | Para e-mail | Senha SMTP |
| `SMTP_FROM` | Para e-mail | Endereço remetente |
| `BACKEND_INTERNAL_URL` | Lab Mode | URL do backend Python (padrão: `http://localhost:8000`) |
| `INTERNAL_SECRET` | Lab Mode | Secret compartilhado entre Next.js e backend — `openssl rand -hex 32` |
| `LANGFUSE_PUBLIC_KEY` | Observabilidade | Chave pública do Langfuse (opcional) |
| `LANGFUSE_SECRET_KEY` | Observabilidade | Chave secreta do Langfuse (opcional) |
| `LANGFUSE_HOST` | Observabilidade | URL da instância Langfuse |
| `SEARXNG_URL` | Lab Mode | URL de uma instância SearXNG para a ferramenta `web_search` |

Gere os secrets necessários:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY
openssl rand -hex 32      # INTERNAL_SECRET
```

---

## Como Usar

1. **Crie uma conta** em `/register` e confirme o e-mail recebido
2. **Onboarding**: adicione sua chave da Anthropic ou OpenAI em _Settings → API Keys_
3. **Explore os templates** na _Agent Store_ (`/store`) e escolha um ponto de partida
4. **Configure o agente** — nome, personalidade, tom, modelo e idioma no wizard de 3 etapas
5. **(Opcional)** Na etapa avançada, ative o **Lab Mode** para ver o pipeline LangGraph em ação
6. **Converse** — abra o agente e inicie um chat; cada agente mantém seu próprio histórico

---

## Estrutura do Projeto

```
AgentLab/
├── app/
│   ├── (public)/              # Rotas públicas (landing, auth)
│   │   ├── page.tsx           # Landing page /
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (app)/                 # Rotas protegidas (requer auth)
│   │   ├── layout.tsx         # Shell com sidebar + topbar
│   │   ├── dashboard/
│   │   ├── store/             # Catálogo de templates
│   │   ├── agents/            # Lista e chat com agentes
│   │   ├── onboarding/
│   │   └── settings/
│   └── api/                   # API Routes
│       ├── auth/              # NextAuth + tokens de verificação
│       ├── user/              # Perfil, API keys (Anthropic + OpenAI), senha
│       ├── agents/            # CRUD de agentes
│       ├── chat/              # Chat streaming (padrão e LangGraph)
│       ├── conversations/     # Histórico de conversas
│       └── models/            # Lista de modelos por provider
│
├── components/
│   ├── ui/                    # Componentes base (shadcn/ui + Radix UI)
│   ├── auth/                  # Formulários de login/cadastro
│   ├── agents/                # AgentCard, AgentForm, TemplateCard
│   ├── chat/                  # ChatWindow, MessageBubble, ChatInput
│   ├── lab/                   # LabPanel, ExecutionLog, GraphDiagram
│   ├── layout/                # Sidebar, TopBar, MobileNav
│   └── shared/                # EmptyState, LoadingSpinner, etc.
│
├── lib/
│   ├── auth.ts                # Configuração NextAuth
│   ├── db.ts                  # Singleton Prisma
│   ├── crypto.ts              # AES-256-GCM encrypt/decrypt
│   ├── email.ts               # Envio de e-mail (Nodemailer)
│   ├── tokens.ts              # Geração e verificação de tokens
│   ├── prompts.ts             # Builder do system prompt dos agentes
│   ├── ai.ts                  # Factory do cliente Anthropic/OpenAI (BYOK)
│   ├── validations.ts         # Schemas Zod
│   └── sanitizer.ts           # Sanitização de HTML nas mensagens
│
├── backend/                   # Microserviço Python (Lab Mode)
│   ├── main.py                # FastAPI app
│   ├── requirements.txt
│   ├── agent/
│   │   ├── graph.py           # LangGraph StateGraph (5 nós)
│   │   ├── nodes.py           # Funções de cada nó
│   │   ├── state.py           # AgentState TypedDict
│   │   ├── tools.py           # web_search, calculator, datetime
│   │   └── personality.py     # Injeção de personalidade no prompt
│   ├── observability/         # Cliente Langfuse + NodeEmitter
│   ├── security/              # Auth por shared secret
│   └── streaming/             # SSE event builder
│
├── prisma/
│   └── schema.prisma          # Schema do banco (User, Agent, Conversation, Message)
│
├── messages/
│   ├── pt-BR.json             # Traduções PT-BR
│   └── en.json                # Traduções EN
│
├── specs/                     # Especificações SDD (12 specs, 00–11)
├── docs/                      # Documentação técnica (API, auth, BYOK, deploy…)
├── hooks/                     # React hooks customizados
├── types/                     # Tipos TypeScript compartilhados
├── .env.example               # Todas as variáveis documentadas
├── Dockerfile                 # Multi-stage build Next.js
├── Dockerfile.backend         # Build Python FastAPI
├── docker-compose.yml         # Stack completa (app + backend + postgres)
└── docker-compose.langfuse.yml  # Langfuse self-hosted (opcional)
```

---

## Especificações e Documentação

Este projeto foi construído com **Spec-Driven Development (SDD)** — cada funcionalidade tem uma especificação escrita e aprovada antes de qualquer linha de código ser implementada.

### Specs (`specs/`)

| # | Especificação | Status |
|---|--------------|--------|
| 00 | [Arquitetura & Fundação](specs/00-architecture.md) | ✅ Implementado |
| 01 | [Autenticação](specs/01-auth.md) | ✅ Implementado |
| 02 | [Onboarding](specs/02-onboarding.md) | ✅ Implementado |
| 03 | [Dashboard](specs/03-dashboard.md) | ✅ Implementado |
| 04 | [Agent Store](specs/04-agent-store.md) | ✅ Implementado |
| 05 | [Agent CRUD](specs/05-agent-crud.md) | ✅ Implementado |
| 06 | [Chat Interface](specs/06-chat.md) | ✅ Implementado |
| 07 | [Settings](specs/07-settings.md) | ✅ Implementado |
| 08 | [Landing Page](specs/08-landing.md) | ✅ Implementado |
| 09 | [Deploy & Documentação](specs/09-deployment.md) | ✅ Implementado |
| 10 | [Multi-Provider BYOK](specs/10-multi-provider.md) | ⚡ Pós-build |
| 11 | [LangGraph Lab Mode](specs/11-langgraph-lab.md) | ⚡ Pós-build |

As specs 00–09 representam o design original. As specs 10–11 documentam funcionalidades adicionadas após o build inicial — separadas intencionalmente para mostrar a evolução do projeto.

### Docs (`docs/`)

| Arquivo | Conteúdo |
|---------|---------|
| [API.md](docs/API.md) | Referência completa de todos os endpoints |
| [AUTH.md](docs/AUTH.md) | Fluxo de autenticação e tokens |
| [BYOK.md](docs/BYOK.md) | Arquitetura de criptografia das API keys |
| [DATABASE.md](docs/DATABASE.md) | Schema Prisma e modelos |
| [COMPONENTS.md](docs/COMPONENTS.md) | Biblioteca de componentes |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy com Docker e Vercel |
| [SDD.md](docs/SDD.md) | Software Design Document |

---

## Roadmap

Veja o [ROADMAP.md](ROADMAP.md) para as próximas melhorias planejadas — da fase de polimento do MVP até escala e infraestrutura.

---

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

## Autor

Feito por **Gustavo Karsten**

[GitHub](https://github.com/gustavotoor) · [LinkedIn](https://www.linkedin.com/in/gustavo-karsten-88a04383/) · [Site](https://gustavokarsten.com)
