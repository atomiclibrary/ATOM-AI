import React, { useRef, useState } from 'react';
import { Send, Upload, Image, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface MessageInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  selectedClass?: string;
  selectedSubject?: string;
  onClassChange: (className: string) => void;
  onSubjectChange: (subject: string) => void;
}

const MessageInput = ({ 
  inputMessage, 
  setInputMessage, 
  uploadedImage, 
  setUploadedImage, 
  onSendMessage, 
  isLoading,
  selectedClass,
  selectedSubject,
  onClassChange,
  onSubjectChange
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  const classes = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ];

  const subjects = [
    'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
    'Bangla', 'English', 'History', 'Geography', 'Civics',
    'Islamic Studies', 'Bangladesh Studies', 'ICT'
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const getPlaceholder = () => {
    if (selectedClass && selectedSubject) {
      return `${selectedClass} ${selectedSubject} এর প্রশ্ন করো বা বইয়ের ছবি আপলোড করো...`;
    } else if (selectedClass) {
      return `${selectedClass} এর যেকোনো বিষয়ের প্রশ্ন করো...`;
    }
    return "Message ATOM AI";
  };

  const getSubjectDisplayName = (subject: string) => {
    const translations: { [key: string]: string } = {
      'Bangla': 'বাংলা',
      'Islamic Studies': 'ইসলাম শিক্ষা',
      'Bangladesh Studies': 'বাংলাদেশ স্টাডিজ',
      'ICT': 'আইসিটি',
      'Arts': 'কলা',
      'Commerce': 'বাণিজ্য',
      'General Knowledge': 'সাধারণ জ্ঞান'
    };
    return translations[subject] || subject;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50">
      {/* Image Preview */}
      {uploadedImage && (
        <div className="px-4 py-3 border-b border-gray-800/30">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300 font-hind">ছবি আপলোড হয়েছে</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedImage(null)}
                className="text-gray-400 hover:text-white h-6 px-2 text-xs"
              >
                Remove
              </Button>
            </div>
            <img
              src={uploadedImage}
              alt="Preview"
              className="max-h-32 rounded-lg object-cover border border-gray-700"
            />
          </div>
        </div>
      )}

      {/* Main Chat Input */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Selected Class/Subject Tags */}
          {(selectedClass || selectedSubject) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedClass && (
                <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700/50">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {selectedClass}
                </Badge>
              )}
              {selectedSubject && (
                <Badge variant="secondary" className="bg-green-900/50 text-green-300 border-green-700/50">
                  {getSubjectDisplayName(selectedSubject)}
                </Badge>
              )}
            </div>
          )}

          {/* Input Container */}
          <div className="relative">
            {/* Hidden file input for uploads */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Gradient chat box with input on top and actions below */}
            <div
              className="relative rounded-3xl px-5 md:px-6 py-4 md:py-5 shadow-glow border"
              style={{
                background: "linear-gradient(135deg, hsl(var(--mi-from, 203 95% 48%)), hsl(var(--mi-to, 212 93% 38%)))"
              }}
            >
              <div className="space-y-3">
                {/* Top row: message input */}
                <div className="relative">
                  {/* Left accent bar */}
                  <span aria-hidden className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-px bg-foreground/60" />

                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getPlaceholder()}
                    className="border-0 bg-transparent text-white placeholder-white/70 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-lg min-h-[56px] pl-6 pr-16 md:pr-20 py-3 resize-none font-hind leading-relaxed"
                    disabled={isLoading}
                  />

                  {/* Send button (aligned to input row) */}
                  <Button
                    onClick={onSendMessage}
                    disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground shadow-soft"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>

                {/* Bottom row: small space for upload and subject */}
                <div className="flex items-center gap-2 pl-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 rounded-full bg-background/80 text-foreground border border-foreground/10 hover:bg-background"
                    aria-label="Upload image"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-full px-3 bg-background/80 text-foreground border border-foreground/10 hover:bg-background"
                        aria-label="Select subject"
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        {selectedSubject ? getSubjectDisplayName(selectedSubject) : 'Subject'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-50 w-80 p-6 rounded-2xl shadow-ai bg-popover text-popover-foreground border" side="top" align="start">
                      <div className="space-y-6">
                        <h3 className="font-semibold font-hind text-lg tracking-wide">ক্লাস ও বিষয় নির্বাচন</h3>

                        {/* Class Selection */}
                        <div>
                          <label className="text-sm font-hind font-medium mb-3 block">ক্লাস</label>
                          <div className="grid grid-cols-3 gap-3">
                            {classes.map((className) => (
                              <Button
                                key={className}
                                variant="ghost"
                                size="sm"
                                onClick={() => onClassChange(className)}
                                className={`text-sm h-10 rounded-2xl font-medium transition-all duration-300 border ${
                                  selectedClass === className
                                    ? 'bg-primary text-primary-foreground border-primary/50 shadow-ai'
                                    : 'bg-secondary text-secondary-foreground border-border hover:bg-primary/80 hover:text-primary-foreground'
                                }`}
                              >
                                {className}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Subject Selection */}
                        <div>
                          <label className="text-sm font-hind font-medium mb-3 block">বিষয়</label>
                          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                            {subjects.map((subject) => (
                              <Button
                                key={subject}
                                variant="ghost"
                                size="sm"
                                onClick={() => onSubjectChange(subject)}
                                className={`text-sm h-10 text-left justify-start rounded-2xl font-medium transition-all duration-300 border ${
                                  selectedSubject === subject
                                    ? 'bg-primary text-primary-foreground border-primary/50 shadow-ai'
                                    : 'bg-secondary text-secondary-foreground border-border hover:bg-primary/80 hover:text-primary-foreground'
                                }`}
                              >
                                {getSubjectDisplayName(subject)}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Clear Selection */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            onClassChange('');
                            onSubjectChange('');
                          }}
                          className="w-full h-10 rounded-2xl font-hind font-medium"
                        >
                          সব মুছে দাও
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
