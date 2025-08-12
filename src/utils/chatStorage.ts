
export interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    type: 'user' | 'ai';
    timestamp: Date;
    image?: string;
    isTyping?: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'atom_ai_chat_history';

export const saveChatSession = (session: ChatSession): void => {
  try {
    const existingSessions = getChatSessions();
    const updatedSessions = existingSessions.filter(s => s.id !== session.id);
    updatedSessions.unshift(session);
    
    // Keep only the last 50 sessions
    const limitedSessions = updatedSessions.slice(0, 50);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSessions));
  } catch (error) {
    console.error('Error saving chat session:', error);
  }
};

export const getChatSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const sessions = JSON.parse(stored);
    return sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    return [];
  }
};

export const deleteChatSession = (sessionId: string): void => {
  try {
    const sessions = getChatSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
  } catch (error) {
    console.error('Error deleting chat session:', error);
  }
};

export const generateChatTitle = (firstMessage: string): string => {
  if (!firstMessage) return 'নতুন চ্যাট';
  
  // Take first 30 characters and add ellipsis if longer
  const title = firstMessage.slice(0, 30);
  return title.length < firstMessage.length ? `${title}...` : title;
};
