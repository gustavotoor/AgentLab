# PRD — AgentLab
**Versão:** 1.1  
**Data:** 2026-03-28  
**Autor:** Fritz 🦞  
**Status:** Draft

---

## 1. Visão Geral

### 1.1 O que é o AgentLab
AgentLab é uma plataforma web onde qualquer pessoa pode criar, configurar e conversar com agentes de IA personalizados. O usuário define o nome, a personalidade e o propósito do agente — o sistema injeta esse contexto no modelo e entrega um assistente único, pronto pra usar.

Pense nisso como uma **loja de agentes**: você entra, escolhe um tipo, personaliza, e já tem um AI funcionando pra você.

### 1.2 Objetivo
- Portfólio técnico de Gustavo Karsten demonstrando domínio de: auth, banco de dados, API de IA, BYOK, Docker, i18n, UX
- Base para um produto real: o AgentLab pode evoluir para um SaaS com planos pagos, agentes especializados por nicho, etc.

### 1.3 Público-alvo (MVP)
- Recrutadores e avaliadores técnicos visualizando o portfólio
- Usuários early adopters que queiram criar seu próprio assistente sem código

---

## 2. Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend + Backend | Next.js 14 (App Router) | Full-stack em um repo, deploy simples |
| UI | Tailwind CSS + shadcn/ui | Rápido, consistente, acessível |
| Banco de dados | PostgreSQL | Robusto, relacional, BYOK para Dokploy |
| ORM | Prisma | Type-safe, migrações automáticas |
| Autenticação | NextAuth.js v5 | Suporte a OAuth + credenciais, integra com Prisma |
| IA | Anthropic SDK (Claude) | Modelo principal; BYOK via chave do usuário |
| i18n | next-intl | PT-BR e EN, detecta idioma do browser |
| Tema | next-themes | Claro/escuro, padrão claro |
| Containerização | Docker + docker-compose | Deploy via Dokploy na VPS |
| Variáveis de ambiente | `.env` + Dokploy env vars | DB_URL, NEXTAUTH_SECRET, etc. |

---

## 3. Funcionalidades do MVP

### 3.1 Autenticação

#### Tela de Login — Design
A tela de login deve ser **bonita e moderna**, não um formulário simples. Referências: Linear, Vercel, Clerk. Elementos obrigatórios:
- Layout split: lado esquerdo com branding (logo, tagline, animação sutil ou gradient), lado direito com o formulário
- Background escuro/gradiente no lado do branding
- Card de formulário com sombra suave, bordas arredondadas
- Campo de senha com **botão olhinho** (toggle show/hide password) — ícone `Eye` / `EyeOff` do Lucide React
- Animação de entrada (fade + slide suave com Framer Motion ou CSS)
- Responsive: em mobile o branding some e fica só o formulário centralizado
- Feedback de erro visual inline (campo fica vermelho, mensagem abaixo)
- Loading state no botão de submit (spinner + desabilita)

#### Fluxo Completo de Autenticação
- **Cadastro:** email + senha + confirmação de senha
  - Validação frontend: senha mínimo 8 chars, confirmação igual
  - Após submit → envia **email de confirmação** → tela "Verifique seu email"
  - Usuário não pode logar sem confirmar o email
  - Link de confirmação expira em 24h
- **Login:** email + senha
  - Verifica se email foi confirmado — se não, exibe erro com opção "Reenviar email de confirmação"
  - Sessão persistente via JWT (NextAuth)
- **Recuperar Senha:**
  - Link "Esqueceu a senha?" na tela de login
  - Tela `/forgot-password`: campo de email → envia email com link de reset
  - Link expira em 1h
  - Tela `/reset-password?token=xxx`: nova senha + confirmação
  - Após reset bem-sucedido → redireciona para login com mensagem de sucesso
- **OAuth Google** (fase 2)
- Proteção de rotas: `/dashboard`, `/agents/*`, `/settings`, `/onboarding`

#### Emails Transacionais
Dois emails automáticos do sistema:

**1. Confirmação de conta:**
```
Assunto: Confirme seu email — AgentLab
Corpo: "Olá [NOME], clique no link para ativar sua conta: [LINK]"
Link válido por: 24 horas
```

**2. Recuperação de senha:**
```
Assunto: Redefinir sua senha — AgentLab
Corpo: "Você solicitou redefinir sua senha. Clique no link: [LINK]"
Link válido por: 1 hora
```

#### Provider de Email
Configurável via variável de ambiente `EMAIL_PROVIDER`. Suporte inicial a:
- **SMTP genérico** (padrão) — funciona com Gmail, Zoho, Brevo, Resend, etc.
- Resend (recomendado para produção — SDK simples, free tier generoso)

### 3.2 Onboarding
Fluxo após primeiro login:
1. **Boas-vindas** — explicação do que é o AgentLab (1 tela)
2. **Perfil** — nome, foto (opcional), idioma preferido
3. **API Key** — campo para colar a chave Anthropic (BYOK), com link de onde obter
4. **Criar primeiro agente** — redireciona para o criador de agentes
5. **Pronto** — dashboard com o agente criado

O onboarding é **ignorável** — o usuário pode pular e configurar depois em Settings.

### 3.3 Dashboard
Página principal após login. Contém:
- Resumo: quantos agentes criados, total de conversas
- Grid com os últimos agentes usados (cards com avatar, nome, tipo)
- Botão "Criar novo agente"
- Acesso rápido para Settings

### 3.4 Loja de Agentes (Agent Store)
Catálogo de templates de agentes disponíveis para instanciar:

| Template | Descrição | Personalidade base |
|----------|-----------|-------------------|
| 🤝 Assistente Pessoal | Organização, tarefas, lembretes | Prestativo, direto |
| 💼 Consultor de Negócios | Estratégia, análise, decisões | Analítico, formal |
| 🎓 Professor | Explica qualquer assunto | Didático, paciente |
| ✍️ Redator | Textos, copy, emails | Criativo, persuasivo |
| 💻 Dev Assistant | Código, revisão, debug | Técnico, preciso |
| 🧘 Coach | Metas, motivação, foco | Empático, motivador |
| 🛒 Atendente | FAQ, suporte, vendas | Amigável, objetivo |
| 🎭 Personagem Livre | Sem template — totalmente customizado | Definido pelo usuário |

Cada template tem:
- Nome e descrição
- Tags (ex: `produtividade`, `negócios`, `criatividade`)
- Preview de prompt base
- Botão "Usar este template"

### 3.5 Criar / Editar Agente
Formulário de criação com os campos:

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome do agente | Text | Sim |
| Template base | Select (da loja) | Sim |
| Emoji / Avatar | Emoji picker | Não (padrão: 🤖) |
| Personalidade | Textarea | Sim |
| Tom de voz | Select: Formal / Casual / Técnico / Amigável | Sim |
| Idioma preferido | Select: PT-BR / EN / Bilíngue | Sim |
| Instrução extra (soul) | Textarea | Não |

O sistema monta o system prompt assim:
```
Você é [NOME], um agente de IA do AgentLab.

[PERSONALIDADE BASE DO TEMPLATE]

Tom de voz: [TOM]
Idioma: [IDIOMA]

Informações sobre o usuário:
- Nome: [NOME DO USUÁRIO]
- [INSTRUÇÃO EXTRA SE HOUVER]

Seja sempre fiel à sua personalidade. Responda de forma [TOM].
```

### 3.6 Meus Agentes
Lista de todos os agentes criados pelo usuário:
- Grid / lista com cards
- Nome, tipo, data de criação, número de conversas
- Ações: Conversar, Editar, Duplicar, Excluir

### 3.7 Chat com o Agente
Interface de chat simples e limpa:
- Histórico de mensagens salvo no banco (por sessão)
- Streaming de resposta (efeito digitando)
- Botão "Nova conversa"
- Sidebar com histórico de conversas anteriores
- Indicador do modelo usado
- Botão de copiar resposta

### 3.8 Configurações (Settings)
Tabs:
- **Conta:** nome, email, foto, senha
- **API Key:** adicionar/remover chave Anthropic (BYOK), status (válida/inválida)
- **Aparência:** tema (claro/escuro/sistema), idioma
- **Privacidade:** excluir conta, exportar dados

---

## 4. BYOK — Bring Your Own Key

### 4.1 Fluxo
1. Usuário cola a chave no campo de Settings ou no onboarding
2. Frontend envia via HTTPS para a API route `/api/user/api-key`
3. Backend valida a chave fazendo uma chamada mínima na API da Anthropic
4. Se válida, criptografa com AES-256 e salva no banco no campo `api_key_encrypted`
5. Nunca retorna a chave para o frontend — só retorna `{ valid: true, maskedKey: "sk-ant-...xxxx" }`

### 4.2 Uso na conversa
Quando o usuário inicia uma mensagem:
1. API route `/api/chat` é chamada
2. Busca o agente no banco (verifica ownership)
3. Descriptografa a `api_key_encrypted` do usuário
4. Faz a chamada para Anthropic com a chave do usuário
5. Stream da resposta de volta para o frontend
6. Salva a mensagem no banco

### 4.3 Segurança
- Chave nunca trafega em plain text após o POST inicial
- Criptografia: AES-256-GCM com `ENCRYPTION_KEY` via env var
- Rate limiting por usuário (futuro)
- A chave do sistema (fallback demo) fica em env var separada

---

## 5. Schema do Banco de Dados (Prisma)

```prisma
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  password         String?   // hash bcrypt
  image            String?
  emailVerified    DateTime? // null = ainda não confirmou
  apiKeyEncrypted  String?   // AES-256 encrypted
  apiKeyMasked     String?   // "sk-ant-...xxxx"
  apiKeyValid      Boolean   @default(false)
  onboardingDone   Boolean   @default(false)
  locale           String    @default("pt-BR")
  theme            String    @default("light")
  createdAt        DateTime  @default(now())
  agents           Agent[]
  sessions         Session[]
  verificationTokens VerificationToken[]
}

model VerificationToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique  // hash SHA-256
  type      String   // "email-verification" | "password-reset"
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

model Agent {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  name         String
  emoji        String    @default("🤖")
  templateId   String    // ex: "personal-assistant"
  personality  String    // textarea do usuário
  tone         String    // formal | casual | technical | friendly
  locale       String    @default("pt-BR")
  extraSoul    String?   // instrução extra
  systemPrompt String    // prompt montado final (gerado pelo sistema)
  totalChats   Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  conversations Conversation[]
}

model Conversation {
  id        String    @id @default(cuid())
  agentId   String
  agent     Agent     @relation(fields: [agentId], references: [id])
  title     String?   // gerado automaticamente da 1ª mensagem
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String       // user | assistant
  content        String
  createdAt      DateTime     @default(now())
}
```

---

## 6. Rotas da Aplicação

### Páginas (Next.js App Router)
| Rota | Descrição | Auth |
|------|-----------|------|
| `/` | Landing page | Público |
| `/login` | Login (design moderno, split layout) | Público |
| `/register` | Cadastro com confirmação de email | Público |
| `/verify-email` | Tela "verifique seu email" pós-cadastro | Público |
| `/verify-email?token=xxx` | Ativa a conta via token | Público |
| `/forgot-password` | Solicitar reset de senha | Público |
| `/reset-password?token=xxx` | Redefinir senha com token | Público |
| `/onboarding` | Fluxo de onboarding | Autenticado |
| `/dashboard` | Dashboard principal | Autenticado |
| `/store` | Loja de agentes (templates) | Autenticado |
| `/agents` | Meus agentes | Autenticado |
| `/agents/new` | Criar agente | Autenticado |
| `/agents/[id]` | Chat com agente | Autenticado |
| `/agents/[id]/edit` | Editar agente | Autenticado |
| `/settings` | Configurações | Autenticado |

### API Routes
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/auth/verify-email` | POST | Valida token de confirmação de email |
| `/api/auth/resend-verification` | POST | Reenvia email de confirmação |
| `/api/auth/forgot-password` | POST | Envia email de reset de senha |
| `/api/auth/reset-password` | POST | Redefine senha com token |
| `/api/user/profile` | PATCH | Atualiza perfil |
| `/api/user/api-key` | POST/DELETE | Salva/remove API key |
| `/api/agents` | GET/POST | Lista/cria agentes |
| `/api/agents/[id]` | GET/PATCH/DELETE | CRUD de agente |
| `/api/chat` | POST | Envia mensagem (streaming) |
| `/api/conversations/[agentId]` | GET | Lista conversas do agente |

---

## 7. Estrutura de Pastas

```
AgentLab/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── store/
│   │   ├── agents/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   ├── onboarding/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── agents/
│   │   ├── chat/
│   │   └── conversations/
│   └── layout.tsx
├── components/
│   ├── ui/          # shadcn components
│   ├── chat/        # ChatWindow, MessageBubble, etc.
│   ├── agents/      # AgentCard, AgentForm, etc.
│   └── layout/      # Sidebar, Navbar, etc.
├── lib/
│   ├── auth.ts      # NextAuth config
│   ├── db.ts        # Prisma client
│   ├── crypto.ts    # AES encrypt/decrypt
│   ├── ai.ts        # Anthropic SDK wrapper
│   └── prompts.ts   # Montagem do system prompt
├── messages/
│   ├── pt-BR.json   # Traduções PT
│   └── en.json      # Traduções EN
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
└── README.md
```

---

## 8. Docker e Deploy

### Dockerfile
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

### Variáveis de Ambiente (.env.example)
```env
# ── Banco de dados
DATABASE_URL="postgresql://user:password@host:5432/agentlab"

# ── NextAuth
NEXTAUTH_URL="https://agentlab.yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ── Criptografia das API Keys dos usuários
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"

# ── Chave da Anthropic (fallback demo — opcional)
ANTHROPIC_API_KEY=""

# ── Email do sistema (para confirmação de conta e recuperação de senha)
EMAIL_PROVIDER="smtp"           # smtp | resend
EMAIL_FROM="AgentLab <no-reply@agentlab.com>"

# SMTP genérico (Gmail, Zoho, Brevo, etc.)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"             # true para porta 465
SMTP_USER="seu@email.com"
SMTP_PASS="sua-senha-de-app"

# Resend (alternativa recomendada)
RESEND_API_KEY=""

# ── App
NEXT_PUBLIC_APP_URL="https://agentlab.yourdomain.com"
NEXT_PUBLIC_APP_NAME="AgentLab"
```

---

## 9. i18n

### Idiomas suportados
- `pt-BR` — Padrão
- `en` — Inglês

### Detecção automática
next-intl detecta o idioma do browser e redireciona. Usuário pode sobrescrever em Settings.

### O que é traduzido
- Toda a UI (labels, botões, mensagens de erro)
- Templates de agentes (nome + descrição)
- Emails de boas-vindas (futuro)
- **Não traduzido:** conversas com o agente (cada agente tem seu próprio idioma configurado)

---

## 10. Tema Claro / Escuro

- Padrão: **claro**
- Opções: Claro | Escuro | Sistema (segue SO)
- Implementação: `next-themes` + variáveis CSS Tailwind
- Persistência: salvo no banco + cookie (para SSR correto)

---

## 11. Landing Page

Página pública (`/`) com:
- Hero: "Crie seu agente de IA em minutos"
- 3 features principais
- Preview do chat (estático/animado)
- CTA: "Criar conta grátis"
- Footer com links

---

## 12. Fases de Implementação

### Fase 1 — MVP (este PRD)
- [ ] Setup Next.js + Tailwind + shadcn + Prisma + PostgreSQL
- [ ] Docker + docker-compose
- [ ] Auth completo:
  - [ ] Login com design moderno (split layout, olhinho, animação)
  - [ ] Cadastro com confirmação de email
  - [ ] Recuperação de senha (forgot + reset)
  - [ ] Proteção de rotas (middleware)
  - [ ] Configuração de email via SMTP/Resend
- [ ] Onboarding (3 passos)
- [ ] CRUD de agentes
- [ ] Loja de templates (8 templates)
- [ ] Chat com streaming
- [ ] BYOK (API key do usuário)
- [ ] i18n PT-BR + EN
- [ ] Tema claro/escuro
- [ ] Dashboard + Meus Agentes + Settings
- [ ] README completo

### Fase 2 — Produto
- [ ] OAuth Google
- [ ] Rate limiting por usuário
- [ ] Export de conversas (PDF/markdown)
- [ ] Planos pagos (Stripe)
- [ ] Integração com OpenClaw (cada agente em container isolado)
- [ ] Modelos múltiplos (GPT-4o, Gemini, etc.)
- [ ] Compartilhar agente via link público

---

## 13. README (estrutura)

O README vai documentar:
1. O que é o projeto
2. Tech stack com links
3. Como rodar localmente (5 comandos)
4. Como fazer deploy com Dokploy
5. Variáveis de ambiente explicadas
6. Schema do banco explicado
7. Como funciona o BYOK
8. Como funciona a injeção do system prompt
9. Decisões de arquitetura (por que X e não Y)

---

## 14. Versões das Dependências

```json
{
  "next": "16.2.1",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "prisma": "7.6.0",
  "@prisma/client": "7.6.0",
  "next-auth": "4.24.13",
  "tailwindcss": "4.2.2",
  "@ai-sdk/anthropic": "3.0.64",
  "ai": "6.0.141",
  "next-intl": "4.8.3",
  "next-themes": "0.4.6",
  "@radix-ui/react-*": "1.1.x",
  "bcryptjs": "3.0.3",
  "typescript": "6.0.2"
}
```

> Versões verificadas via npm registry em 2026-03-28.

---

*PRD criado por Fritz 🦞 | AgentLab | Março 2026*
