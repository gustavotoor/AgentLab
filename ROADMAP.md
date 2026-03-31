# Roadmap — AgentLab

Este documento registra as melhorias e funcionalidades planejadas para o AgentLab. As prioridades refletem o estado atual do projeto como portfólio, com visão de evolução para produto.

---

## Fase 1 — Polimento do MVP

Melhorias na base existente que aumentam qualidade e usabilidade sem grandes mudanças arquiteturais.

- [ ] **Exportar conversas** — Download do histórico em Markdown ou PDF
- [ ] **Duplicar agente** — Clonar um agente existente como ponto de partida
- [ ] **Busca nas conversas** — Filtrar histórico por texto dentro de um agente
- [ ] **Upload de arquivo no chat** — Enviar PDFs, imagens ou `.txt` como contexto para o agente
- [ ] **Paginação no histórico** — Suporte a agentes com muitas conversas (cursor-based)
- [ ] **Avatares personalizados** — Upload de imagem ou seleção de avatar além do emoji
- [ ] **Mensagens de erro melhoradas** — Feedback mais claro quando a API key é inválida ou o provider está fora
- [ ] **Rate limiting por usuário** — Proteção contra uso abusivo na mesma conta
- [ ] **Dashboard com métricas reais** — Tokens consumidos por agente, gráfico de uso ao longo do tempo

---

## Fase 2 — Evolução do Produto

Funcionalidades que transformam o AgentLab de portfólio em produto.

### Autenticação e Acesso
- [ ] **OAuth Google / GitHub** — Cadastro e login sem senha
- [ ] **Magic link** — Login por e-mail sem senha
- [ ] **Organizações** — Workspace compartilhado com múltiplos usuários

### Agentes Avançados
- [ ] **Memória vetorial** — Integração com vector DB (pgvector ou Pinecone) para agentes com memória de longo prazo
- [ ] **Agent-to-agent** — Um agente pode invocar outro como ferramenta
- [ ] **Webhooks** — Agente pode chamar endpoints externos como ferramenta
- [ ] **Execução de código** — Sandbox Python para agentes analíticos
- [ ] **RAG sobre documentos** — Agente com contexto de arquivos enviados pelo usuário

### Compartilhamento e Descoberta
- [ ] **Compartilhar agente via link** — Link público para conversar sem criar conta
- [ ] **Marketplace de agentes** — Catálogo público de agentes criados pela comunidade
- [ ] **Templates customizados** — Usuários podem publicar seus próprios templates

### Monetização
- [ ] **Planos pagos** — Free tier com limite de agentes; planos pagos via Stripe
- [ ] **Dashboard de custo** — Estimativa de gasto por agente baseada em tokens consumidos
- [ ] **Billing gerenciado** — Opção sem BYOK, com cobrança feita pelo AgentLab

---

## Fase 3 — Escala e Infraestrutura

- [ ] **Mais providers de IA** — Gemini (Google), Mistral, Cohere, modelos locais via Ollama
- [ ] **App mobile** — React Native ou PWA com suporte a notificações push
- [ ] **API pública** — Acesso aos agentes via REST para integrações externas
- [ ] **Agentes colaborativos** — Múltiplos agentes trabalhando em conjunto em um mesmo fluxo (multi-agent graph)
- [ ] **Análise de conversas** — Resumo automático, detecção de padrões, análise de sentimento
- [ ] **Deploy self-hosted simplificado** — Imagem Docker all-in-one com wizard de configuração

---

## Dívida Técnica

Melhorias técnicas que aumentam qualidade e manutenibilidade sem impacto direto em features.

- [ ] **Testes automatizados** — Vitest para `lib/` e API routes; Playwright para fluxos críticos (auth, chat)
- [ ] **CI/CD** — GitHub Actions com build, lint e testes em PRs
- [ ] **Migrar para NextAuth v5** — API mais limpa e suporte oficial a Edge Runtime
- [ ] **Atualizar next-intl para 4.x** — API de routing melhorada
- [ ] **Monitoramento de erros** — Integrar Sentry para captura de erros em produção
- [ ] **Storybook** — Documentação visual dos componentes UI

---

## Fora do Escopo

Decisões deliberadas sobre o que o AgentLab não será:

- **Fine-tuning de modelos** — Requer infraestrutura de ML dedicada, fora do escopo de portfólio
- **Marketplace de plugins de terceiros** — Complexidade de segurança e sandboxing não justificada no estágio atual
- **Chat em tempo real entre usuários** — Foge do propósito central de conversa usuário–agente

---

_Última atualização: Março 2026_
