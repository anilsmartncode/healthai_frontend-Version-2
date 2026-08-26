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

import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import type { ChatMessage } from '@/types';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { reportsApi } from '@/services/reportsApi';
import { hasAIConsent } from '@/components/ai/AIDataConsentModal';

// ─── Toggle ────────────────────────────────────────────────
const USE_MOCK = false; // 🟢 MOCK | 🔴 set false when backend ready
// ──────────────────────────────────────────────────────────

// Storage keys — scoped to logged-in user's phone number
// Pass phone from useAuth() so different users never see each other's data
export function STORAGE_KEYS(phone: string | null = null) {
  const user = phone ? phone.replace(/\D/g, '') : 'guest';
  return {
    REPORTS:      `healthai_reports_${user}`,
    REPORT_DETAILS: `healthai_report_details_${user}`,
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
  id?: string;
  title: string;
  date: string;
  healthScore?: number;
  abnormalCount?: number;
  aiSummary?: string;
  labValues?: string;
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
  const keys = STORAGE_KEYS(phone);
  let aiMemoryRaw: string | null = null;
  let medicinesRaw: string | null = null;
  let familyRaw: string | null = null;
  
  try {
    aiMemoryRaw = await AsyncStorage.getItem(keys.AI_MEMORY);
    medicinesRaw = await AsyncStorage.getItem(keys.MEDICINES);
    familyRaw = await AsyncStorage.getItem(keys.FAMILY);
  } catch {}

  const parseSafe = <T>(raw: string | null, limit: number): T[] => {
    try { return raw ? JSON.parse(raw).slice(0, limit) : []; } catch { return []; }
  };

  const reports: AIContextReport[] = [];

  if (USE_MOCK) {
    try {
      const reportsRaw = await AsyncStorage.getItem(keys.REPORTS);
      const reportDetailsRaw = await AsyncStorage.getItem(keys.REPORT_DETAILS);
      const reportsList: any[] = parseSafe(reportsRaw, 5);
      let reportDetails: Record<string, any> = {};
      try { reportDetails = reportDetailsRaw ? JSON.parse(reportDetailsRaw) : {}; } catch {}

      for (const r of reportsList) {
        const detail = reportDetails[r.id];
        let labValues = '';
        let aiSummary = '';
        if (detail) {
          if (detail.summary) {
            try {
              const s = typeof detail.summary === 'string' ? JSON.parse(detail.summary) : detail.summary;
              aiSummary = `Summary: ${s.ai_summary || ''}. Recommendations: ${s.recommendations?.join(', ') || ''}`;
            } catch { aiSummary = detail.summary; }
          }
          if (detail.values) {
            labValues = detail.values.map((v: any) => `${v.name}: ${v.value} (${v.status})`).join(', ');
          }
        }
        reports.push({
          id: r.id, title: r.title, date: r.date,
          healthScore: r.healthScore, abnormalCount: r.abnormalCount,
          aiSummary, labValues
        });
      }
    } catch {}
  } else {
    // REAL BACKEND
    try {
      const allReports = await reportsApi.list(phone);
      const recent = allReports.slice(0, 3); // Top 3 to keep prompt size reasonable
      
      for (const r of recent) {
        const detailed = await reportsApi.getById(r.id, phone);
        let labValues = '';
        let aiSummary = '';
        
        if (detailed) {
          if (detailed.summary) {
            try {
              const s = typeof detailed.summary === 'string' ? JSON.parse(detailed.summary) : detailed.summary;
              aiSummary = `Summary: ${s.ai_summary || ''}. Recommendations: ${s.recommendations?.join(', ') || ''}`;
            } catch { aiSummary = detailed.summary; }
          }
          if (detailed.values) {
            labValues = detailed.values.map(v => `${v.name}: ${v.value} (${v.status})`).join(', ');
          }
        }
        
        reports.push({
          id: r.id, title: r.title, date: r.date,
          healthScore: r.healthScore, abnormalCount: r.abnormalCount,
          aiSummary, labValues
        });
      }
    } catch (e) {
      console.warn('[buildAIContext] Failed to fetch real reports for context', e);
    }
  }

  const medicines: AIContextMedicine[] = parseSafe(medicinesRaw, 10);
  const family: AIContextFamily[] = parseSafe(familyRaw, 10);
  const aiMemory: string | undefined = aiMemoryRaw ? (() => { try { return JSON.parse(aiMemoryRaw); } catch { return undefined; } })() : undefined;

  return { reports, medicines, family, aiMemory };
}

export function buildSystemPrompt(ctx: AIHealthContext, prefillContext?: string): string {
  const reportsText = ctx.reports.length > 0
    ? ctx.reports.map(r =>
        `- ${r.title} (${r.date}): Score ${r.healthScore ?? '?'}/100, ${r.abnormalCount ?? 0} abnormal.\n  Lab Values: ${r.labValues || 'N/A'}\n  Insights: ${r.aiSummary || 'N/A'}`
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
  reportId?: string,
): Promise<ChatMessage> {

  // Apple Guideline 5.1.2(i): Verify user has consented to AI data processing
  // before transmitting any personal health data to the AI service.
  const consented = await hasAIConsent();
  if (!consented) {
    const err = new Error('AI data consent is required before using AI features.');
    (err as any).code = 'AI_CONSENT_REQUIRED';
    throw err;
  }

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

  // 🔴 REAL
  const ctx = await buildAIContext(phone);
  const systemPrompt = buildSystemPrompt(ctx, prefillContext);
  
  console.log('[askAI] System Prompt sent to AI:', systemPrompt);

  try {
    const endpoint = reportId ? ENDPOINTS.aiAskWithReportPath : ENDPOINTS.aiChatPath;
    const body = reportId 
      ? JSON.stringify({
          question,
          report_id: reportId,
          prefill_context: prefillContext,
        })
      : JSON.stringify({
          system_prompt: systemPrompt,
          question,
          conversation_history: conversationHistory.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text
          })),
        });

    const data = await api.request<any>(endpoint, {
      method: 'POST',
      body,
    });
    
    console.log('[askAI] AI Response:', JSON.stringify(data, null, 2));

    return {
      id: data.id || Date.now().toString(),
      role: 'ai',
      text: data.text || data.reply || '',
      time: data.time || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[askAI] real API failed:', error);
    throw error;
  }
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
  if (!USE_MOCK) {
    try {
      const data = await api.request<any>(ENDPOINTS.aiSuggestedPromptsPath);
      if (data && data.prompts && Array.isArray(data.prompts) && data.prompts.length > 0) {
        return data.prompts;
      }
    } catch (e) {
      console.log('[generateSuggestedPrompts] API failed, falling back to local context generation', e);
    }
  }

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
  const lastAI = [...conversationHistory].reverse().find(m => m.role === 'ai');
  if (!lastAI) return;
  
  const summary = `Last session (${new Date().toLocaleDateString()}): ${lastAI.text.slice(0, 200)}`;

  if (USE_MOCK) {
    await AsyncStorage.setItem(STORAGE_KEYS(phone).AI_MEMORY, JSON.stringify(summary));
    return;
  }

  try {
    await api.request(ENDPOINTS.aiMemoryPath, {
      method: 'POST',
      body: JSON.stringify({ summary })
    });
  } catch (e) {
    console.error('[saveAIMemory] API failed:', e);
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
  if (!USE_MOCK) {
    try {
      const data = await api.request<any>(ENDPOINTS.aiHealthAlertsPath);
      if (data && data.alert) {
        return data.alert as HealthAlert;
      }
      return null;
    } catch (e) {
      console.log('[checkHealthAlerts] API failed, falling back to local check', e);
    }
  }

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

export async function getChatHistory(phone: string | null = null): Promise<{ messages: ChatMessage[], total: number } | null> {
  if (USE_MOCK) {
    // 🟢 MOCK - we don't return anything here so useAI falls back to AsyncStorage
    return null;
  }
  
  // 🔴 REAL
  try {
    const data = await api.request<any>(ENDPOINTS.aiHistoryPath);
    return data;
  } catch (error) {
    console.error('[getChatHistory] real API failed:', error);
    return null;
  }
}

export async function clearChatHistory(phone: string | null = null): Promise<void> {
  if (USE_MOCK) {
    // 🟢 MOCK - handled by AsyncStorage in useAI
    return;
  }
  
  // 🔴 REAL
  try {
    await api.request(ENDPOINTS.aiHistoryPath, { method: 'DELETE' });
  } catch (error) {
    console.error('[clearChatHistory] real API failed:', error);
  }
}

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
  try {
    const data = await api.request<any>(ENDPOINTS.aiSessionsPath);
    return data.sessions || [];
  } catch (error) {
    console.error('[listChatSessions] real API failed:', error);
    throw error;
  }
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
  try {
    const data = await api.request<any>(ENDPOINTS.aiSessionPath(sessionId));
    return data.session || null;
  } catch (error) {
    console.error('[getChatSession] real API failed:', error);
    throw error;
  }
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
  try {
    await api.request(ENDPOINTS.aiSessionPath(sessionId), {
      method: 'PUT',
      body: JSON.stringify({ messages }),
    });
  } catch (error) {
    console.error('[saveChatSession] real API failed:', error);
    throw error;
  }
}

/** Delete a single saved session */
export async function deleteChatSession(sessionId: string, phone: string | null = null): Promise<void> {
  const keys = STORAGE_KEYS(phone);

  const activeSessionId = await AsyncStorage.getItem(`${keys.CONVERSATION}_session_id`);
  if (activeSessionId === sessionId) {
    await AsyncStorage.removeItem(keys.CONVERSATION);
    await AsyncStorage.removeItem(`${keys.CONVERSATION}_session_id`);
  }

  if (USE_MOCK) {
    // 🟢 MOCK
    await AsyncStorage.removeItem(`${keys.SESSION_PREFIX}${sessionId}`);
    const listRaw = await AsyncStorage.getItem(keys.SESSIONS);
    const list: ChatSessionSummary[] = listRaw ? JSON.parse(listRaw) : [];
    await AsyncStorage.setItem(keys.SESSIONS, JSON.stringify(list.filter(s => s.id !== sessionId)));
  } else {
    // 🔴 REAL
    try {
      await api.request(ENDPOINTS.aiSessionPath(sessionId), {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('[deleteChatSession] real API failed:', error);
      throw error;
    }
  }
}

/** Delete all saved sessions for this user */
export async function clearAllChatSessions(phone: string | null = null): Promise<void> {
  const keys = STORAGE_KEYS(phone);

  await AsyncStorage.removeItem(keys.CONVERSATION);
  await AsyncStorage.removeItem(`${keys.CONVERSATION}_session_id`);

  if (USE_MOCK) {
    // 🟢 MOCK
    const listRaw = await AsyncStorage.getItem(keys.SESSIONS);
    const list: ChatSessionSummary[] = listRaw ? JSON.parse(listRaw) : [];
    await Promise.all(list.map(s => AsyncStorage.removeItem(`${keys.SESSION_PREFIX}${s.id}`)));
    await AsyncStorage.removeItem(keys.SESSIONS);
  } else {
    // 🔴 REAL
    try {
      await api.request(ENDPOINTS.aiSessionsPath, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('[clearAllChatSessions] real API failed:', error);
      throw error;
    }
  }

  // Always clear active local cache
  await AsyncStorage.removeItem(keys.CONVERSATION);
  await AsyncStorage.removeItem(`${keys.CONVERSATION}_session_id`);
}

/** Generate a fresh session id for a new conversation */
export function newSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
