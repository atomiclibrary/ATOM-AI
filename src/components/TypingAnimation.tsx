
import React from 'react';

const TypingAnimation = () => {
  return (
    <div className="flex space-x-1 items-center">
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div 
          className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div 
          className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
      <span className="text-cyan-300/70 text-xs ml-2">টাইপ করছে...</span>
    </div>
  );
};

export default TypingAnimation;
