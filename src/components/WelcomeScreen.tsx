import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface WelcomeScreenProps {
  onStartChat: () => void;
}

const WelcomeScreen = ({ onStartChat }: WelcomeScreenProps) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleStartChat = () => {
    onStartChat();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate('/chat');
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative px-4"
      style={{ backgroundImage: 'url(/bghm.png)' }}
    >
      {/* Top Left Logo */}
      <div className="absolute top-0 left-0 z-20">
        <a href="https://www.facebook.com/shifat.fi" target="_blank" rel="noopener noreferrer">
          <img
            src="/atomic cover copy.png"
            alt="Atomic Library Logo"
            className="h-32 md:h-36 w-auto transition-all duration-300 hover:scale-110"
          />
        </a>
      </div>

      {/* Glass Panel */}
      <div className="max-w-5xl w-full text-center flex flex-col items-center justify-center mt-[-30px] scale-100">
        {/* Atom Icon */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/pngegg white.png"
            alt="Atom AI Logo"
            className="w-28 h-28 object-contain mb-3"
          />
          
          <h1 className="text-5xl font-bold text-white mb-10">Atom AI</h1>
        </div>

        {/* Input box */}
        <div className="relative mb-4 -mt-50">
         <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl px-12 py-14 shadow-2xl w-[90vw] max-w-[900px] mx-auto flex items-center justify-center">
          <input
            ref={inputRef}
            type="text"
            placeholder="learn the future"
            className="w-full bg-transparent text-white placeholder-white/80 border-none outline-none text-1xl font-medium text-left"
            onFocus={handleStartChat}
            onClick={handleStartChat}
            onKeyDown={handleKeyDown}
            />
        </div>
     </div>

        {/* Icon Buttons Row */}
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <button className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-5 py-2 text-sm hover:bg-white/20 transition-all">
            📓 <span>Notes</span>
          </button>
          <button className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-5 py-2 text-sm hover:bg-white/20 transition-all">
            📺 <span>Class</span>
          </button>
          <button
            disabled
            className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white/50 rounded-full px-5 py-2 text-sm cursor-not-allowed"
          >
            🔒 <span>locked</span>
          </button>
          <button
            disabled
            className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white/50 rounded-full px-5 py-2 text-sm cursor-not-allowed"
          >
            🔒 <span>locked</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
