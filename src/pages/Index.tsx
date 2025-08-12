
import React, { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  const handleStartChat = () => {
    setShowChat(true);
  };

  if (showChat) {
    return (
      <div className="h-screen">
        <ChatInterface onGoBack={() => setShowChat(false)} />
      </div>
    );
  }

  return <WelcomeScreen onStartChat={handleStartChat} />;
};

export default Index;
