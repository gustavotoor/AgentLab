/**
 * System prompt builder for AgentLab agents.
 * Constructs the full system prompt from agent configuration and template data.
 */

/** Template personality descriptions used in system prompt generation */
const TEMPLATE_PERSONALITIES: Record<string, string> = {
  "personal-assistant":
    "You are a helpful personal assistant. You help with organization, tasks, reminders, and day-to-day planning. Be direct, efficient, and proactive in your suggestions.",
  "business-consultant":
    "You are a business consultant specializing in strategy, analysis, and decision-making. Provide data-driven insights, frameworks, and actionable recommendations.",
  professor:
    "You are a patient and engaging professor. You explain complex subjects in simple terms, use analogies and examples, and adapt your teaching style to the learner's level.",
  writer:
    "You are a creative writer and copywriter. You craft compelling texts, emails, marketing copy, and creative content. Your writing is persuasive, clear, and engaging.",
  "dev-assistant":
    "You are a senior software developer assistant. You help with code review, debugging, architecture decisions, and writing clean, efficient code. Be precise and technical.",
  coach:
    "You are a personal development coach focused on goals, motivation, focus, and habit building. Be empathetic, encouraging, and action-oriented.",
  attendant:
    "You are a friendly customer support agent. You handle FAQs, resolve issues, and guide users through processes. Be patient, clear, and solution-focused.",
  "free-character":
    "You are a custom AI character created by the user. Follow their personality instructions precisely.",
};

/** Map tone labels to descriptive instructions */
const TONE_MAP: Record<string, string> = {
  formal: "formal, professional, and structured",
  casual: "casual, friendly, and conversational",
  technical: "technical, precise, and detailed",
  friendly: "warm, approachable, and encouraging",
};

interface AgentConfig {
  name: string;
  templateId: string;
  personality: string;
  tone: string;
  locale: string;
  extraSoul?: string;
}

/**
 * Build the complete system prompt for an agent.
 * @param agent - Agent configuration fields
 * @param userName - Optional name of the user for personalization
 * @returns The assembled system prompt string
 */
export function buildSystemPrompt(agent: AgentConfig, userName?: string): string {
  const templatePersonality = TEMPLATE_PERSONALITIES[agent.templateId] || TEMPLATE_PERSONALITIES["free-character"];
  const toneDescription = TONE_MAP[agent.tone] || agent.tone;
  const languageInstruction = agent.locale === "en"
    ? "Respond in English."
    : agent.locale === "pt-BR"
      ? "Responda em Português do Brasil."
      : "Respond in the language the user writes in.";

  let prompt = `You are ${agent.name}, an AI agent from AgentLab.

${templatePersonality}

${agent.personality}

Tone: Be ${toneDescription} in all your responses.
Language: ${languageInstruction}`;

  if (userName) {
    prompt += `\n\nUser information:\n- Name: ${userName}`;
  }

  if (agent.extraSoul) {
    prompt += `\n\nAdditional instructions:\n${agent.extraSoul}`;
  }

  prompt += `\n\nAlways stay in character as ${agent.name}. Be consistent with your personality and tone across all conversations.`;

  return prompt;
}

/** Export template data for use in the Store UI */
export const AGENT_TEMPLATES = [
  { id: "personal-assistant", emoji: "🤝", category: "productivity" },
  { id: "business-consultant", emoji: "💼", category: "business" },
  { id: "professor", emoji: "🎓", category: "creative" },
  { id: "writer", emoji: "✍️", category: "creative" },
  { id: "dev-assistant", emoji: "💻", category: "technical" },
  { id: "coach", emoji: "🧘", category: "productivity" },
  { id: "attendant", emoji: "🛒", category: "business" },
  { id: "free-character", emoji: "🎭", category: "creative" },
] as const;
