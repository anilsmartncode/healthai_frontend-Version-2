import type { ChatMessage } from '@/types';

export const aiService = {
  async ask(question: string): Promise<ChatMessage> {
    // TODO: integrate AI backend
    return {
      id: Date.now().toString(),
      role: 'ai',
      text: `Here is some guidance about: "${question}". Always consult your doctor.`,
      time: new Date().toISOString(),
    };
  },
};
