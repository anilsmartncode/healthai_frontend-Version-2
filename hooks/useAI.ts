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
  newSessionId,
  STORAGE_KEYS,
} from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';
import type { ChatMessage } from '@/types';

export function useAI(initialPrefill?: string, prefillContext?: string, openSessionId?: string, forceNewSessionToken?: string) {
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
  const hasAutoSent = useRef(false);
  const [convoLoaded, setConvoLoaded] = useState(false);

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

      // Opening a specific saved session from History
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

      // Resume the last active session for this user
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
      const reply = await askAI(question, updatedWithUser, prefillContext, phone);
      const finalMsgs = [...updatedWithUser, reply];
      setMessages(finalMsgs);
      await persistConversation(finalMsgs);
      // Save memory after every 6+ message conversation
      if (finalMsgs.length >= 6) await saveAIMemory(finalMsgs, phone);
    } catch {
      const errMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        text: "Sorry, I couldn't connect right now. Please check your connection and try again.",
        time: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, prefillContext, persistConversation, phone]);

  // "New chat" — saves the current conversation to History (it's already
  // persisted via saveChatSession on each message), then starts a fresh session
  const clearConversation = useCallback(async () => {
    await saveAIMemory(messages, phone);
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
    send,
    clearConversation,
  };
}
