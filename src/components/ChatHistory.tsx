
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { ChatSession, deleteChatSession } from '@/utils/chatStorage';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatHistory = ({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession 
}: ChatHistoryProps) => {
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(sessionId);
    deleteChatSession(sessionId);
  };

  return (
    <div className="w-64 bg-slate-800/90 backdrop-blur-sm border-r border-cyan-500/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center gap-2 font-bangla font-semibold"
        >
          <Plus className="w-4 h-4" />
          নতুন চ্যাট
        </Button>
      </div>

      {/* Chat Sessions */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessions.length === 0 ? (
            <p className="text-cyan-300/50 text-sm text-center py-8 font-bangla font-medium">
              কোনো চ্যাট ইতিহাস নেই
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-700/50 ${
                  currentSessionId === session.id 
                    ? 'bg-slate-700/80 border border-cyan-500/30' 
                    : 'bg-slate-800/40'
                }`}
                onClick={() => onSelectSession(session)}
              >
                <MessageSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-100 text-sm truncate font-medium font-bangla font-semibold">
                    {session.title}
                  </p>
                  <p className="text-cyan-400/60 text-xs">
                    {session.updatedAt.toLocaleDateString('bn-BD')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 h-6 w-6 p-0"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
