/**
 * hooks/useAI.ts
 * ─────────────────────────────────────────────────────────
 * Central AI hook — manages conversation state, context,
 * alerts, and persisted memory.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  askAI,
  generateSuggestedPrompts,
  saveAIMemory,
  saveChatSession,
  getChatSession,
  getChatHistory,
  clearChatHistory,
  newSessionId,
  STORAGE_KEYS,
  type HealthAlert,
} from '@/services/aiService';
import { hasAIConsent } from '@/components/ai/AIDataConsentModal';
import { useAuth } from '@/context/AuthContext';
import type { ChatMessage } from '@/types';

export function useAI(initialPrefill?: string, prefillContext?: string, openSessionId?: string, forceNewSessionToken?: string, reportId?: string) {
  const { phone } = useAuth();
  const CONVO_KEY = STORAGE_KEYS(phone).CONVERSATION;
  const CURRENT_SESSION_KEY = `${STORAGE_KEYS(phone).CONVERSATION}_session_id`;
  const [sessionId, setSessionId] = useState<string>(() => openSessionId ?? newSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'ai',
      text: "Hi! I'm your HealthAI Assistant. I can answer questions about your reports, medicines, and health goals. How can I help you today?",
      time: new Date().toISOString(),
    },
  ]);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [alert, setAlert]             = useState<HealthAlert | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const hasAutoSent = useRef(false);
  const [convoLoaded, setConvoLoaded] = useState(false);
  // Stores the last question that failed due to missing consent,
  // so we can auto-retry after the user grants consent.
  const pendingQuestion = useRef<string | null>(null);

  // Load conversation — re-runs whenever the logged-in user changes,
  // or when a specific past session is requested (from the History tab)
  useEffect(() => {
    setConvoLoaded(false);
    (async () => {
      hasAutoSent.current = false;
      if (forceNewSessionToken) {
        await AsyncStorage.removeItem(CONVO_KEY);
        await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
        setMessages([{
          id: '0',
          role: 'ai',
          text: "Hi! I'm your HealthAI Assistant. I can answer questions about your reports, medicines, and health goals. How can I help you today?",
          time: new Date().toISOString(),
        }]);
        setSessionId(newSessionId());
        setConvoLoaded(true);
        return;
      }

      // 1. If this is a report-specific chat, start fresh immediately.
      // We don't want to load global chat history for a specific report context.
      if (reportId) {
        setSessionId(newSessionId());
        setMessages([{
          id: '0',
          role: 'ai',
          text: `Hi! I'm your HealthAI Assistant. I see you want to discuss your report. How can I help?`,
          time: new Date().toISOString(),
        }]);
        setConvoLoaded(true);
        return;
      }

      // 2. Opening a specific saved session from History
      if (openSessionId) {
        const session = await getChatSession(openSessionId, phone);
        if (session) {
          setSessionId(session.id);
          setMessages(session.messages);
          await AsyncStorage.setItem(CONVO_KEY, JSON.stringify(session.messages.slice(-40)));
          await AsyncStorage.setItem(CURRENT_SESSION_KEY, session.id);
          setConvoLoaded(true);
          return;
        }
      }

      // 3. Try fetching recent legacy history from backend
      // If the backend DELETE is not working, this might return deleted chats.
      // We limit to the last 40 messages to mimic local behavior.
      const backendHistory = await getChatHistory(phone);
      if (backendHistory && backendHistory.messages && backendHistory.messages.length > 0) {
        setMessages(backendHistory.messages.slice(-40));
        setSessionId(newSessionId());
        setConvoLoaded(true);
        return;
      }

      // Resume the last active session for this user (local fallback)
      const [raw, savedSessionId] = await Promise.all([
        AsyncStorage.getItem(CONVO_KEY),
        AsyncStorage.getItem(CURRENT_SESSION_KEY),
      ]);

      if (raw) {
        const stored: ChatMessage[] = JSON.parse(raw);
        if (stored.length > 0) {
          setMessages(stored);
          setSessionId(savedSessionId || newSessionId());
          setConvoLoaded(true);
          return;
        }
      }

      // No stored conversation for this user — start fresh with a new session
      setMessages([{
        id: '0',
        role: 'ai',
        text: "Hi! I'm your HealthAI Assistant. I can answer questions about your reports, medicines, and health goals. How can I help you today?",
        time: new Date().toISOString(),
      }]);
      setSessionId(newSessionId());
      setConvoLoaded(true);
    })();

    generateSuggestedPrompts(phone).then(setSuggestions);
  }, [phone, CONVO_KEY, openSessionId, forceNewSessionToken]);

  // Auto-send if prefill came from navigation/deep link — wait until the
  // persisted conversation has finished loading so we don't overwrite it
  useEffect(() => {
    if (initialPrefill && !hasAutoSent.current && convoLoaded) {
      hasAutoSent.current = true;
      // Small delay so screen is mounted
      setTimeout(() => send(initialPrefill), 300);
    }
  }, [initialPrefill, convoLoaded, forceNewSessionToken]);

  const persistConversation = useCallback(async (msgs: ChatMessage[]) => {
    // Keep last 40 messages to prevent unbounded growth
    const trimmed = msgs.slice(-40);
    await AsyncStorage.setItem(CONVO_KEY, JSON.stringify(trimmed));
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    // Save full (untrimmed) conversation to the History tab
    await saveChatSession(sessionId, msgs, phone);
  }, [CONVO_KEY, CURRENT_SESSION_KEY, sessionId, phone]);

  const send = useCallback(async (overrideText?: string) => {
    const question = (overrideText ?? input).trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: question,
      time: new Date().toISOString(),
    };

    const updatedWithUser = [...messagesRef.current, userMsg];
    setMessages(updatedWithUser);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAI(question, updatedWithUser, prefillContext, phone, reportId);
      const finalMsgs = [...updatedWithUser, reply];
      setMessages(finalMsgs);
      await persistConversation(finalMsgs);
      // Save memory after every 6+ message conversation
      if (finalMsgs.length >= 6) await saveAIMemory(finalMsgs, phone);
    } catch (err: any) {
      // If the error is because the user hasn't given AI consent yet,
      // surface it to the UI so the consent modal can be shown.
      if (err?.code === 'AI_CONSENT_REQUIRED') {
        pendingQuestion.current = question;
        setNeedsConsent(true);
        // Remove the user message we just added, since the AI call was blocked
        setMessages(messages);
      } else {
        const errMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          text: "Sorry, I couldn't connect right now. Please check your connection and try again.",
          time: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, prefillContext, persistConversation, phone, reportId]);

  // Called after the user grants consent via the consent modal.
  // Automatically retries the pending question that was blocked.
  const retryAfterConsent = useCallback(() => {
    setNeedsConsent(false);
    if (pendingQuestion.current) {
      const q = pendingQuestion.current;
      pendingQuestion.current = null;
      setTimeout(() => send(q), 200);
    }
  }, [send]);

  // "New chat" — saves the current conversation to History (it's already
  // persisted via saveChatSession on each message), then starts a fresh session
  const clearConversation = useCallback(async () => {
    await saveAIMemory(messages, phone);
    await clearChatHistory(phone);
    const freshId = newSessionId();
    setSessionId(freshId);
    await AsyncStorage.removeItem(CONVO_KEY);
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, freshId);
    setMessages([{
      id: Date.now().toString(),
      role: 'ai',
      text: "Hi! I'm your HealthAI Assistant. I can answer questions about your reports, medicines, and health goals. How can I help you today?",
      time: new Date().toISOString(),
    }]);
  }, [messages, phone, CONVO_KEY, CURRENT_SESSION_KEY]);

  return {
    messages,
    input,
    setInput,
    loading,
    suggestions,
    sessionId,
    alert,
    needsConsent,
    send,
    clearConversation,
    retryAfterConsent,
    dismissAlert: () => setAlert(null),
  };
}
