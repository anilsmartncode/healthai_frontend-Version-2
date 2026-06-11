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
  checkHealthAlerts,
  type HealthAlert,
} from '@/services/aiService';
import type { ChatMessage } from '@/types';

const CONVO_KEY = 'healthai_ai_conversation';

export function useAI(initialPrefill?: string, prefillContext?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'ai',
      text: "Hi! I'm your HealthAI Assistant. I can answer questions about your reports, medicines, and health goals. How can I help you today?",
      time: new Date().toISOString(),
    },
  ]);
  const [input, setInput]             = useState(initialPrefill ?? '');
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [alert, setAlert]             = useState<HealthAlert | null>(null);
  const hasAutoSent = useRef(false);

  // Load persisted conversation
  useEffect(() => {
    AsyncStorage.getItem(CONVO_KEY).then(raw => {
      if (raw) {
        const stored: ChatMessage[] = JSON.parse(raw);
        if (stored.length > 0) setMessages(stored);
      }
    });
    generateSuggestedPrompts().then(setSuggestions);
    checkHealthAlerts().then(setAlert);
  }, []);

  // Auto-send if prefill came from deep link
  useEffect(() => {
    if (initialPrefill && !hasAutoSent.current && messages.length === 1) {
      hasAutoSent.current = true;
      // Small delay so screen is mounted
      setTimeout(() => send(initialPrefill), 300);
    }
  }, [initialPrefill]);

  const persistConversation = useCallback(async (msgs: ChatMessage[]) => {
    // Keep last 40 messages to prevent unbounded growth
    const trimmed = msgs.slice(-40);
    await AsyncStorage.setItem(CONVO_KEY, JSON.stringify(trimmed));
  }, []);

  const send = useCallback(async (overrideText?: string) => {
    const question = (overrideText ?? input).trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: question,
      time: new Date().toISOString(),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAI(question, updatedWithUser, prefillContext);
      const finalMsgs = [...updatedWithUser, reply];
      setMessages(finalMsgs);
      await persistConversation(finalMsgs);
      // Save memory after every 6+ message conversation
      if (finalMsgs.length >= 6) await saveAIMemory(finalMsgs);
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
  }, [input, loading, messages, prefillContext, persistConversation]);

  const clearConversation = useCallback(async () => {
    await saveAIMemory(messages);
    await AsyncStorage.removeItem(CONVO_KEY);
    setMessages([{
      id: Date.now().toString(),
      role: 'ai',
      text: "Conversation cleared. How can I help you today?",
      time: new Date().toISOString(),
    }]);
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    loading,
    suggestions,
    alert,
    send,
    clearConversation,
    dismissAlert: () => setAlert(null),
  };
}
