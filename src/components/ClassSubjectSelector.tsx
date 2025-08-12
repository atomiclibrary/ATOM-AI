import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ClassSubjectSelectorProps {
  selectedClass: string;
  selectedSubject: string;
  onClassChange: (className: string) => void;
  onSubjectChange: (subject: string) => void;
  onClose: () => void;
}

const ClassSubjectSelector = ({
  selectedClass,
  selectedSubject,
  onClassChange,
  onSubjectChange,
  onClose
}: ClassSubjectSelectorProps) => {
  const classes = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ];

  const subjects = [
    'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
    'Bangla', 'English', 'History', 'Geography', 'Civics',
    'Islamic Studies', 'Bangladesh Studies', 'ICT'
  ];

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800/95 border-cyan-500/30 text-cyan-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-hind">
              তোর ক্লাস ও বিষয় নির্বাচন করো
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Class Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-cyan-300 font-hind">
                তুমি কোন ক্লাসে পড়ো?
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {classes.map((className) => (
                  <Button
                    key={className}
                    variant={selectedClass === className ? "default" : "outline"}
                    onClick={() => onClassChange(className)}
                    className={`${
                      selectedClass === className
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                        : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                    } font-hind`}
                  >
                    {className}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subject Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-cyan-300 font-hind">
                কোন বিষয়ে সাহায্য চাও?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subjects.map((subject) => (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    onClick={() => onSubjectChange(subject)}
                    className={`${
                      selectedSubject === subject
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                        : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                    } text-sm ${
                      ['Bangla', 'Islamic Studies', 'Bangladesh Studies', 'ICT'].includes(subject)
                        ? 'font-hind'
                        : ''
                    }`}
                  >
                    {subject === 'Bangla' ? 'বাংলা' :
                     subject === 'Islamic Studies' ? 'ইসলাম শিক্ষা' :
                     subject === 'Bangladesh Studies' ? 'বাংলাদেশ স্টাডিজ' :
                     subject === 'ICT' ? 'আইসিটি' :
                     subject}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear Selection */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onClassChange('');
                  onSubjectChange('');
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-hind"
              >
                সব মুছে দাও
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-hind flex-1"
              >
                সেভ করো
              </Button>
            </div>

            {/* Selected Info */}
            {(selectedClass || selectedSubject) && (
              <div className="p-3 bg-slate-700/50 rounded-lg border border-cyan-500/20">
                <p className="text-sm text-cyan-300 font-hind">
                  নির্বাচিত: {selectedClass} {selectedSubject && `- ${
                    selectedSubject === 'Bangla' ? 'বাংলা' :
                    selectedSubject === 'Islamic Studies' ? 'ইসলাম শিক্ষা' :
                    selectedSubject === 'Bangladesh Studies' ? 'বাংলাদেশ স্টাডিজ' :
                    selectedSubject === 'ICT' ? 'আইসিটি' :
                    selectedSubject
                  }`}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClassSubjectSelector;
