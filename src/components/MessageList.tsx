import React, { useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import TypingAnimation from './TypingAnimation';
import TypewriterText from './TypewriterText';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  image?: string;
  isTyping?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onTypingComplete: (messageId: string) => void;
  reservedBottomSpace?: number;
}

const MessageList = ({ messages, isLoading, onTypingComplete, reservedBottomSpace }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4 mt-8">
      <div className="space-y-4 max-w-4xl mx-auto" style={{ paddingBottom: reservedBottomSpace ?? 128 }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              } items-start space-x-2`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 ml-2'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 mr-2'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <Card
                className={`p-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30'
                    : 'bg-slate-800/80 text-cyan-100 border-slate-700/50'
                } backdrop-blur-sm`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Uploaded"
                    className="max-w-sm max-h-64 rounded-lg mb-2 object-cover"
                  />
                )}
                <div className="text-sm leading-relaxed">
                  {message.type === 'ai' && message.isTyping ? (
                    <TypewriterText 
                      text={message.content} 
                      speed={20}
                      onComplete={() => onTypingComplete(message.id)}
                    />
                  ) : (
                    <p className="whitespace-pre-line">{message.content}</p>
                  )}
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </Card>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center mr-2">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <Card className="p-3 bg-slate-800/80 border-slate-700/50 backdrop-blur-sm">
                <TypingAnimation />
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
