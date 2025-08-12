'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, ArrowLeft, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onGoBack?: () => void;
  onToggleHistory: () => void;
}

const ChatHeader = ({
  showSidebar,
  onToggleSidebar,
  onGoBack,
  onToggleHistory,
}: ChatHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleHistoryClick = () => {
    onToggleHistory();
    setMenuOpen(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-transparent">
      {/* Left Side */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="bg-transparent text-gray-800 hover:text-white hover:bg-gradient-to-br from-purple-500 to-pink-500 transition-all duration-300 rounded-full hover:shadow-lg transform hover:-translate-y-1"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onGoBack}
          className="bg-transparent text-gray-800 hover:text-white hover:bg-gradient-to-br from-indigo-500 to-sky-500 transition-all duration-300 rounded-full hover:shadow-lg transform hover:-translate-x-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Right Side - Menu */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-transparent text-gray-800 hover:text-white hover:bg-gradient-to-br from-emerald-500 to-teal-500 transition-all duration-300 rounded-full hover:shadow-lg transform hover:rotate-12"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow p-2 text-sm z-50">
            <p
              className="py-1 px-2 hover:bg-gray-100 cursor-pointer rounded"
              onClick={handleHistoryClick}
            >
              Chat History
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
