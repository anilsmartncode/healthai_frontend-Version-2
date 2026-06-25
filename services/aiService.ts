/**
 * services/aiService.ts
 * ─────────────────────────────────────────────────────────
 * AI Assistant service — mock-first, context-aware.
 * Builds a full health context payload from AsyncStorage
 * and sends it as the system prompt to the AI.
 *
 * HOW TO SWITCH TO REAL API:
 *   1. Set USE_MOCK = false
 *   2. Point ENDPOINTS.aiChat to your backend in constants/api.ts
 * ─────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@/types';

// ─── Toggle ────────────────────────────────────────────────
const USE_MOCK = false; // 🟢 MOCK | 🔴 set false when backend ready
// ──────────────────────────────────────────────────────────

// Storage keys — scoped to logged-in user's phone number
// Pass phone from useAuth() so different users never see each other's data
export function STORAGE_KEYS(phone: string | null = null) {
  const user = phone ? phone.replace(/\D/g, '') : 'guest';
  return {
    REPORTS:      `healthai_reports_${user}`,
    MEDICINES:    `healthai_medicines_${user}`,
    FAMILY:       'healthai_family',
    AI_MEMORY:    `healthai_ai_memory_${user}`,
    CONVERSATION: `healthai_ai_conversation_${user}`,
    SESSIONS:     `healthai_ai_sessions_${user}`,
    SESSION_PREFIX: `healthai_ai_session_${user}_`,
  };
}

// ─── Chat history / sessions ──────────────────────────────

/**
 * A saved chat session — one row in the History tab.
 * `messages` holds the full conversation for that session.
 */
export interface ChatSession {
  id: string;
  title: string;       // derived from first user message
  preview: string;      // short preview of last message
  messages: ChatMessage[];
  createdAt: string;    // ISO date
  updatedAt: string;    // ISO date
}

/** Lightweight summary used to render the History list without loading full messages */
export interface ChatSessionSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Types ─────────────────────────────────────────────────

export interface AIContextReport {
  title: string;
  date: string;
  healthScore?: number;
  abnormalCount?: number;
}

export interface AIContextMedicine {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface AIContextFamily {
  name: string;
  relation?: string;
}

export interface AIHealthContext {
  reports: AIContextReport[];
  medicines: AIContextMedicine[];
  family: AIContextFamily[];
  aiMemory?: string;
}

// ─── Build context from AsyncStorage ──────────────────────

export async function buildAIContext(phone: string | null = null): Promise<AIHealthContext> {
  try {
    const keys = STORAGE_KEYS(phone);
    const [reportsRaw, medicinesRaw, familyRaw, aiMemoryRaw] = await Promise.all([
      AsyncStorage.getItem(keys.REPORTS),
      AsyncStorage.getItem(keys.MEDICINES),
      AsyncStorage.getItem(keys.FAMILY),
      AsyncStorage.getItem(keys.AI_MEMORY),
    ]);

    const reports: AIContextReport[]   = reportsRaw   ? JSON.parse(reportsRaw).slice(0, 5)   : [];
    const medicines: AIContextMedicine[] = medicinesRaw ? JSON.parse(medicinesRaw).slice(0, 10) : [];
    const family: AIContextFamily[]    = familyRaw    ? JSON.parse(familyRaw).slice(0, 10)    : [];
    const aiMemory: string | undefined = aiMemoryRaw  ? JSON.parse(aiMemoryRaw)               : undefined;

    return { reports, medicines, family, aiMemory };
  } catch {
    return { reports: [], medicines: [], family: [] };
  }
}

export function buildSystemPrompt(ctx: AIHealthContext, prefillContext?: string): string {
  const reportsText = ctx.reports.length > 0
    ? ctx.reports.map(r =>
        `- ${r.title} (${r.date}): Score ${r.healthScore ?? '?'}/100, ${r.abnormalCount ?? 0} abnormal`
      ).join('\n')
    : 'No reports uploaded yet.';

  const medsText = ctx.medicines.length > 0
    ? ctx.medicines.map(m => `- ${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}`).join('\n')
    : 'No medicines saved yet.';

  const familyText = ctx.family.length > 0
    ? `${ctx.family.length} family member(s): ${ctx.family.map(f => f.name).join(', ')}`
    : 'No family members linked.';

  return `You are HealthAI Assistant — a knowledgeable, friendly health companion integrated into the HealthAI app.

USER'S HEALTH CONTEXT:

RECENT REPORTS (last ${ctx.reports.length}):
${reportsText}

ACTIVE MEDICINES:
${medsText}

FAMILY: ${familyText}

${ctx.aiMemory ? `PREVIOUS SESSION MEMORY:\n${ctx.aiMemory}\n` : ''}
${prefillContext ? `CURRENT CONTEXT:\n${prefillContext}\n` : ''}

INSTRUCTIONS:
- Answer health questions based on the user's actual data above
- Be conversational, warm, and easy to understand
- Never give definitive diagnoses — always recommend consulting a doctor for serious concerns
- If asked about a specific report, refer to the data above
- Keep responses concise (3-5 sentences unless detail is needed)
- For emergencies, always say "Call 108 (India emergency)" or "Seek immediate medical attention"`;
}

// ─── Mock sample responses ─────────────────────────────────

const MOCK_RESPONSES: Record<string, string> = {
  default: "Based on your health data, everything looks fairly stable. I can see you've had some recent reports — would you like me to explain any specific values? Remember, I'm here to help you understand your health better, but always consult your doctor for medical advice.",
  report: "Looking at your recent report, I can see there are some values worth discussing. Abnormal values don't always mean something serious — they can be caused by many factors including diet, hydration, or time of day. Let me know which specific value you'd like me to explain.",
  medicine: "That's a good question about your medicine. Interactions between medications can vary significantly. Based on your current medicines list, I'd recommend discussing any new medicines with your pharmacist or doctor before starting them.",
  diet: "Based on your recent blood reports, a balanced diet rich in leafy greens, whole grains, and lean proteins would be beneficial. Since your reports show some borderline values, avoiding processed foods and sugar for a few weeks could help improve your next results.",
  score: "Your health score reflects the overall picture from your recent reports. Scores above 75 are generally good — focus on the abnormal values, as addressing those will improve your score over time. Would you like tips on improving specific areas?",
  family: "I can see your family member's health data. Their recent reports show some areas to watch. I'd suggest scheduling a follow-up with their doctor, especially regarding the flagged values. Would you like me to explain what those mean?",
  emergency: "⚠️ This sounds urgent. Please seek immediate medical attention. Call 108 for emergency services in India. Do not wait — your health and safety come first.",
};

function pickMockResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('emergency') || q.includes('chest pain') || q.includes('breathe')) return MOCK_RESPONSES.emergency;
  if (q.includes('report') || q.includes('cbc') || q.includes('blood') || q.includes('value') || q.includes('result')) return MOCK_RESPONSES.report;
  if (q.includes('medicine') || q.includes('drug') || q.includes('tablet') || q.includes('interact')) return MOCK_RESPONSES.medicine;
  if (q.includes('diet') || q.includes('food') || q.includes('eat') || q.includes('nutrition')) return MOCK_RESPONSES.diet;
  if (q.includes('score') || q.includes('health score') || q.includes('improve')) return MOCK_RESPONSES.score;
  if (q.includes('family') || q.includes('dad') || q.includes('mom') || q.includes('member')) return MOCK_RESPONSES.family;
  return MOCK_RESPONSES.default;
}

const delay = (ms = 900) => new Promise(r => setTimeout(r, ms));

// ─── Main ask function ─────────────────────────────────────

export async function askAI(
  question: string,
  conversationHistory: ChatMessage[],
  prefillContext?: string,
  phone: string | null = null,
): Promise<ChatMessage> {

  if (USE_MOCK) {
    // 🟢 MOCK
    await delay(800 + Math.random() * 600);
    return {
      id: Date.now().toString(),
      role: 'ai',
      text: pickMockResponse(question),
      time: new Date().toISOString(),
    };
  }

  // 🔴 REAL — uncomment when backend ready
  // const ctx = await buildAIContext(phone);
  // const systemPrompt = buildSystemPrompt(ctx, prefillContext);
  // const res = await fetch(ENDPOINTS.aiChat, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
  //   body: JSON.stringify({
  //     system: systemPrompt,
  //     messages: [
  //       ...conversationHistory.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
  //       { role: 'user', content: question },
  //     ],
  //   }),
  // });
  // const data = await res.json();
  // return { id: Date.now().toString(), role: 'ai', text: data.reply, time: new Date().toISOString() };

  throw new Error('Real AI API not configured yet.');
}

// ─── Generate report narrative (called after upload) ──────

export async function generateReportNarrative(
  reportTitle: string,
  abnormalCount: number,
  healthScore: number,
  topFindings: string[],
): Promise<string> {
  if (USE_MOCK) {
    // 🟢 MOCK
    await delay(600);
    if (abnormalCount === 0) {
      return `Your ${reportTitle} results look great overall with a health score of ${healthScore}/100. All values are within normal range, which is excellent. Keep maintaining your current lifestyle and schedule regular checkups.`;
    }
    return `Your ${reportTitle} shows a health score of ${healthScore}/100 with ${abnormalCount} value${abnormalCount > 1 ? 's' : ''} outside the normal range. ${topFindings[0] ? `Notably, ${topFindings[0].toLowerCase()}.` : ''} Consider discussing these findings with your doctor at your next visit.`;
  }

  // 🔴 REAL
  // const res = await fetch(ENDPOINTS.aiNarrative, { ... });
  throw new Error('Real narrative API not configured yet.');
}

// ─── Generate dynamic suggested prompts ───────────────────

export async function generateSuggestedPrompts(phone: string | null = null): Promise<string[]> {
  const ctx = await buildAIContext(phone);
  const prompts: string[] = [];

  const latest = ctx.reports[0];
  if (latest?.abnormalCount && latest.abnormalCount > 0)
    prompts.push(`What do the ${latest.abnormalCount} abnormal values in my ${latest.title} mean?`);

  if (ctx.medicines.length > 1)
    prompts.push(`Do any of my ${ctx.medicines.length} medicines interact with each other?`);

  if (ctx.reports.length > 1)
    prompts.push(`How has my health score changed across my last ${ctx.reports.length} reports?`);

  if (ctx.family.length > 0)
    prompts.push(`Summarise ${ctx.family[0].name}'s recent health status`);

  prompts.push('What foods should I eat based on my reports?');
  prompts.push('Should I see a doctor based on my recent results?');
  prompts.push('Explain my latest blood test in simple words');

  return prompts.slice(0, 6);
}

// ─── Save AI memory after session ─────────────────────────

export async function saveAIMemory(conversationHistory: ChatMessage[], phone: string | null = null): Promise<void> {
  if (conversationHistory.length < 2) return;
  // In real mode this would call AI to summarise; here we store last assistant reply
  const lastAI = [...conversationHistory].reverse().find(m => m.role === 'ai');
  if (lastAI) {
    const summary = `Last session (${new Date().toLocaleDateString()}): ${lastAI.text.slice(0, 200)}`;
    await AsyncStorage.setItem(STORAGE_KEYS(phone).AI_MEMORY, JSON.stringify(summary));
  }
}

// ─── Proactive health alerts check ────────────────────────

export interface HealthAlert {
  title: string;
  message: string;
  prefill: string;
  severity: 'warning' | 'info';
}

export async function checkHealthAlerts(phone: string | null = null): Promise<HealthAlert | null> {
  try {
    const reportsRaw = await AsyncStorage.getItem(STORAGE_KEYS(phone).REPORTS);
    if (!reportsRaw) return null;
    const reports: AIContextReport[] = JSON.parse(reportsRaw);
    if (reports.length === 0) return null;

    const hasHighRisk   = reports.some(r => (r.healthScore ?? 100) < 50);
    const hasManyAbnorm = reports.some(r => (r.abnormalCount ?? 0) >= 4);

    if (hasHighRisk) {
      return {
        title: 'Health Score Alert',
        message: 'One of your recent reports has a low health score. AI has some suggestions.',
        prefill: `My latest report has a low health score. What should I do?`,
        severity: 'warning',
      };
    }
    if (hasManyAbnorm) {
      return {
        title: 'Abnormal Values Detected',
        message: 'AI noticed several values need attention in your recent report.',
        prefill: `My recent report has several abnormal values. Can you explain what I should do?`,
        severity: 'warning',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Chat History API ──────────────────────────────────────
// All functions below are scoped per-user via `phone`.
// HOW TO SWITCH TO REAL API:
//   1. Set USE_MOCK = false
//   2. Implement the corresponding ENDPOINTS.* calls in constants/api.ts
//      GET    /ai/sessions               -> list session summaries
//      GET    /ai/sessions/:id           -> get one session (full messages)
//      PUT    /ai/sessions/:id           -> upsert session (title + messages)
//      DELETE /ai/sessions/:id           -> delete a session
//      DELETE /ai/sessions               -> clear all sessions
// ─────────────────────────────────────────────────────────

function deriveSessionTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New conversation';
  const text = firstUser.text.trim();
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

function deriveSessionPreview(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last) return '';
  const text = last.text.trim().replace(/\s+/g, ' ');
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

/** List all saved chat sessions for this user, most recently updated first */
export async function listChatSessions(phone: string | null = null): Promise<ChatSessionSummary[]> {
  if (USE_MOCK) {
    // 🟢 MOCK
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS(phone).SESSIONS);
      const list: ChatSessionSummary[] = raw ? JSON.parse(raw) : [];
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch {
      return [];
    }
  }

  // 🔴 REAL
  // const res = await fetch(ENDPOINTS.aiSessions, {
  //   headers: { Authorization: `Bearer ${await getToken()}` },
  // });
  // const data = await res.json();
  // return data.sessions;
  throw new Error('Real chat history API not configured yet.');
}

/** Load the full message list for a saved session */
export async function getChatSession(sessionId: string, phone: string | null = null): Promise<ChatSession | null> {
  if (USE_MOCK) {
    // 🟢 MOCK
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS(phone).SESSION_PREFIX}${sessionId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // 🔴 REAL
  // const res = await fetch(`${ENDPOINTS.aiSessions}/${sessionId}`, {
  //   headers: { Authorization: `Bearer ${await getToken()}` },
  // });
  // const data = await res.json();
  // return data.session;
  throw new Error('Real chat history API not configured yet.');
}

/**
 * Save (create or update) a chat session.
 * Called whenever a conversation has at least one user message —
 * keeps the session row + its messages in sync as the chat grows.
 */
export async function saveChatSession(
  sessionId: string,
  messages: ChatMessage[],
  phone: string | null = null,
): Promise<void> {
  // Don't save empty/greeting-only sessions
  if (!messages.some(m => m.role === 'user')) return;

  const now = new Date().toISOString();

  if (USE_MOCK) {
    // 🟢 MOCK
    const keys = STORAGE_KEYS(phone);
    const existingRaw = await AsyncStorage.getItem(`${keys.SESSION_PREFIX}${sessionId}`);
    const existing: ChatSession | null = existingRaw ? JSON.parse(existingRaw) : null;

    const session: ChatSession = {
      id: sessionId,
      title: existing?.title ?? deriveSessionTitle(messages),
      preview: deriveSessionPreview(messages),
      messages,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await AsyncStorage.setItem(`${keys.SESSION_PREFIX}${sessionId}`, JSON.stringify(session));

    // Update the lightweight summary index
    const listRaw = await AsyncStorage.getItem(keys.SESSIONS);
    const list: ChatSessionSummary[] = listRaw ? JSON.parse(listRaw) : [];
    const summary: ChatSessionSummary = {
      id: session.id,
      title: session.title,
      preview: session.preview,
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
    const idx = list.findIndex(s => s.id === sessionId);
    if (idx >= 0) list[idx] = summary; else list.unshift(summary);
    await AsyncStorage.setItem(keys.SESSIONS, JSON.stringify(list));
    return;
  }

  // 🔴 REAL
  // await fetch(`${ENDPOINTS.aiSessions}/${sessionId}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
  //   body: JSON.stringify({ messages }),
  // });
  throw new Error('Real chat history API not configured yet.');
}

/** Delete a single saved session */
export async function deleteChatSession(sessionId: string, phone: string | null = null): Promise<void> {
  if (USE_MOCK) {
    // 🟢 MOCK
    const keys = STORAGE_KEYS(phone);
    await AsyncStorage.removeItem(`${keys.SESSION_PREFIX}${sessionId}`);
    const listRaw = await AsyncStorage.getItem(keys.SESSIONS);
    const list: ChatSessionSummary[] = listRaw ? JSON.parse(listRaw) : [];
    await AsyncStorage.setItem(keys.SESSIONS, JSON.stringify(list.filter(s => s.id !== sessionId)));
    return;
  }

  // 🔴 REAL
  // await fetch(`${ENDPOINTS.aiSessions}/${sessionId}`, {
  //   method: 'DELETE',
  //   headers: { Authorization: `Bearer ${await getToken()}` },
  // });
  throw new Error('Real chat history API not configured yet.');
}

/** Delete all saved sessions for this user */
export async function clearAllChatSessions(phone: string | null = null): Promise<void> {
  if (USE_MOCK) {
    // 🟢 MOCK
    const keys = STORAGE_KEYS(phone);
    const listRaw = await AsyncStorage.getItem(keys.SESSIONS);
    const list: ChatSessionSummary[] = listRaw ? JSON.parse(listRaw) : [];
    await Promise.all(list.map(s => AsyncStorage.removeItem(`${keys.SESSION_PREFIX}${s.id}`)));
    await AsyncStorage.removeItem(keys.SESSIONS);
    return;
  }

  // 🔴 REAL
  // await fetch(ENDPOINTS.aiSessions, {
  //   method: 'DELETE',
  //   headers: { Authorization: `Bearer ${await getToken()}` },
  // });
  throw new Error('Real chat history API not configured yet.');
}

/** Generate a fresh session id for a new conversation */
export function newSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
