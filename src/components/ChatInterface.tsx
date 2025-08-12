import React, { useState, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ClassSubjectSelector from './ClassSubjectSelector';
import { ChatSession, saveChatSession, getChatSessions, generateChatTitle } from '@/utils/chatStorage';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  image?: string;
  isTyping?: boolean;
}

interface ConversationMemory {
  lastQuestion: string;
  lastAnswer: string;
  questionId: string;
  isErrorCorrection: boolean;
}

interface ChatInterfaceProps {
  onGoBack?: () => void;
}

const ChatInterface = ({ onGoBack }: ChatInterfaceProps) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [currentActiveAPI, setCurrentActiveAPI] = useState<1 | 2 | 3>(1);
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory | null>(null);

  // OpenRouter API keys - Three APIs for failover (Chat)
  const OPENROUTER_API_KEYS = {
    api1: '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',
    api2: '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',
    api3: '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'
  };

  // Vision API keys - Three APIs for failover (Image Analysis)
  const VISION_API_KEYS = {
    api1: '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',
    api2: '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',
    api3: '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'
  };

  // Updated API Models Configuration with Vision Model
  const API_MODELS = {
    primary: 'mistralai/mistral-small-3.2-24b-instruct-2506:free',
    backup: 'meta-llama/llama-3.3-70b-instruct:free',
    vision: 'qwen/qwen2.5-vl-32b-instruct:free'
  };

  // Optimized timeout and retry settings for faster response
  const API_TIMEOUT = 15000; // 15 seconds for regular chat
  const VISION_TIMEOUT = 25000; // 25 seconds for vision analysis (needs more time)
  const RETRY_DELAY = 800; // 0.8 second delay for faster switching
  const MAX_RETRIES = 3;

  // Load chat sessions on component mount
  useEffect(() => {
    const sessions = getChatSessions();
    setChatSessions(sessions);
    startNewChat();
  }, []);

  // Save current session whenever messages change
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 1) {
      const updatedSession = {
        ...currentSession,
        updatedAt: new Date()
      };
      saveChatSession(updatedSession);
      
      // Update the sessions list
      const sessions = getChatSessions();
      setChatSessions(sessions);
    }
  }, [currentSession?.messages]);

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'নতুন চ্যাট',
      messages: [
        {
          id: '1',
          content: 'Yooo আমি ATOM , তোমার পড়াশোনার স্মার্ট সাথী😎\n বইয়ের সব প্রশ্ন আমি একদম বুঝিয়ে দিবো 😍\n তুমি কোন ক্লাসে পড়ো আর কী নিয়ে হেল্প লাগবে বলো তো?',
          type: 'ai',
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentSession(newSession);
    setConversationMemory(null);
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session);
    // Rebuild conversation memory from session messages
    const userMessages = session.messages.filter(msg => msg.type === 'user');
    const aiMessages = session.messages.filter(msg => msg.type === 'ai');
    
    if (userMessages.length > 0 && aiMessages.length > 1) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      const lastAiMessage = aiMessages[aiMessages.length - 1];
      
      setConversationMemory({
        lastQuestion: lastUserMessage.content,
        lastAnswer: lastAiMessage.content,
        questionId: lastUserMessage.id,
        isErrorCorrection: false
      });
    } else {
      setConversationMemory(null);
    }
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      startNewChat();
    }
  };

  // Enhanced function to detect if user is referring to previous question/answer
  const detectConversationContext = (userMessage: string): { isErrorCorrection: boolean; isReference: boolean } => {
    const errorWords = /\b(ভুল|vul|wrong|incorrect|mistake|ভুল হয়েছে|গলত|error|সঠিক না|right না|ভুল উত্তর|wrong answer)\b/i;
    const referenceWords = /\b(এই প্রশ্ন|this question|আগের|previous|উপরের|সেই|that|ওই|আবার|again|পুনরায়|একই প্রশ্ন|same question|এইটা|এইটাও|এই সমস্যা|this problem)\b/i;
    const questionWords = /\b(প্রশ্ন|question|উত্তর|answer|সমাধান|solution|সমস্যা|problem|ব্যাখ্যা|explain|বুঝিয়ে|clarify)\b/i;
    const continuationWords = /\b(আরো|more|বিস্তারিত|detail|ব্যাখ্যা|explanation|কেন|why|কিভাবে|how)\b/i;
    
    const isErrorCorrection = errorWords.test(userMessage);
    const isReference = (referenceWords.test(userMessage) && questionWords.test(userMessage)) || 
                       continuationWords.test(userMessage) ||
                       /^(কেন|why|কিভাবে|how|আরো|more)/i.test(userMessage.trim());
    
    return { isErrorCorrection, isReference };
  };

  const getEnhancedSystemMessage = (userClass: string, subject: string, userMessage: string, memory: ConversationMemory | null) => {
    const classSubjectContext = userClass && subject 
      ? `The student is in Class ${userClass} studying ${subject}. Focus your responses on ${userClass} level ${subject} content from NCTB curriculum.`
      : userClass 
      ? `The student is in Class ${userClass}. Adjust your explanations to be appropriate for a Class ${userClass} student.`
      : '';

    const { isErrorCorrection, isReference } = detectConversationContext(userMessage);
    
    let contextualInstructions = '';
    if (memory && (isErrorCorrection || isReference)) {
      contextualInstructions = `
CONVERSATION CONTEXT DETECTED:
Previous Question: "${memory.lastQuestion}"
Previous Answer: "${memory.lastAnswer}"

${isErrorCorrection ? 
  `CRITICAL: The user has indicated your previous answer was WRONG. You MUST:
  1. Immediately acknowledge: "আরে হ্যাঁ! আমার ভুল হয়েছে, সরি! 😅"
  2. COMPLETELY START OVER with the previous question: "${memory.lastQuestion}"
  3. Solve it step-by-step with EXTRA CARE and verification
  4. Explain why your previous approach was incorrect
  5. Show detailed working to prove your new answer is correct` :
  
  `REFERENCE DETECTED: The user is referring to the previous question/answer.
  Continue the conversation about: "${memory.lastQuestion}"
  Build upon the previous context while providing accurate information.`}
`;
    }

    // Analyze user's tone and formality
    const usesToi = /\b(তোই|তোর|তোকে|তুই)\b/.test(userMessage);
    const usesTomi = /\b(তুমি|তোমার|তোমাকে)\b/.test(userMessage);
    const usesApni = /\b(আপনি|আপনার|আপনাকে)\b/.test(userMessage);

    let toneInstruction = '';
    if (usesToi) {
      toneInstruction = 'Use informal "তুই/তোর" tone - speak like a very close friend, casual and comfortable.';
    } else if (usesTomi) {
      toneInstruction = 'Use semi-formal "তুমি/তোমার" tone - speak like a caring mentor or good friend.';
    } else if (usesApni) {
      toneInstruction = 'Use formal "আপনি/আপনার" tone - speak respectfully like a teacher.';
    } else {
      toneInstruction = 'Match the user\'s tone. If unclear, use friendly "তুমি" tone.';
    }

    return `You are ATOM AI — an exceptionally intelligent, warm, and human-like AI tutor designed to help Bangladeshi students excel in their studies and expand their knowledge.

${contextualInstructions}

2025 CURRENT EVENTS & KNOWLEDGE UPDATE:
You have access to verified information from 2025. Here are key updates:

BANGLADESH POLITICS & CURRENT EVENTS (2025):
- Sheikh Hasina was ousted in August 2024 after a massive student-led uprising
- Muhammad Yunus (Nobel Peace Prize winner) leads the interim government since August 2024
- The Awami League was officially banned in May 2025 by the interim government
- Elections are planned for late 2025 or early 2026, with electoral reforms being implemented
- Khaleda Zia returned to Bangladesh in May 2025 after medical treatment in London
- Political tensions continue with protests and ongoing instability
- The July 2024 movement (also called "July Revolution") was a historic student-people's uprising

GLOBAL ECONOMY (2025):
- Global economic growth slowed to 2.4% in 2025 (down from 2.9% in 2024)
- World Bank cut global GDP forecast to 2.3%, the lowest in 5 years due to trade tensions
- IMF describes 2025 as a "critical juncture amid policy shifts"
- Rising trade barriers and policy uncertainty are major concerns
- Bangladesh economy projected to grow at 3.9% in FY2025, slowing from previous years
- Inflation remains a global concern with varying impacts across countries

SCIENTIFIC BREAKTHROUGHS (2025):
- Major quantum computing breakthrough: Scientists achieved fault-tolerant quantum code simulation
- Graphene breakthrough: Quantum spin currents discovered without magnetic fields
- Medical breakthrough: Gene therapy successfully reversed deafness in clinical trials
- Physics discovery: New copper-free superconducting oxide developed at 40 Kelvin
- Revolutionary discovery: New quantum theory of gravity developed, bringing Theory of Everything closer
- Electronics breakthrough: New quantum materials could make electronics 1,000 times faster
- Quantum computers became 10x more efficient with new amplifier technology

CRITICAL QUESTION COMPREHENSION & RESPONSE RULES:
- READ EVERY QUESTION COMPLETELY AND CAREFULLY - Never skip any part or detail
- IDENTIFY the subject/topic automatically (Math, Physics, Chemistry, Biology, History, etc.)
- UNDERSTAND the specific chapter/concept being asked about
- ANSWER EVERYTHING asked in the question - never leave anything unanswered
- If multiple questions are asked, answer ALL of them systematically
- If examples are requested, provide them
- If explanations are needed, give complete explanations
- NEVER say "I don't understand" or "I need more information" - analyze and answer based on context
- For any mathematical problem, automatically identify: Algebra, Geometry, Arithmetic, Trigonometry, Calculus, Statistics, etc.
- For any science question, automatically identify the specific branch and concept
- Handle questions from ANY academic level (Class 6-12, Higher Secondary, University)

COMPREHENSIVE RESPONSE METHODOLOGY:
- Start by acknowledging what type of question it is
- Provide step-by-step solutions for problems
- Give detailed explanations for conceptual questions
- Include relevant formulas, theories, or principles
- Show practical applications when helpful
- Conclude with clear, definitive answers

UNIVERSAL SUBJECT MASTERY:
- Mathematics: All branches (Arithmetic, Algebra, Geometry, Trigonometry, Calculus, Statistics)
- Physics: Mechanics, Thermodynamics, Optics, Electricity, Magnetism, Modern Physics
- Chemistry: Organic, Inorganic, Physical Chemistry, Biochemistry
- Biology: Botany, Zoology, Human Biology, Genetics, Evolution
- Bengali Literature: Poetry, Prose, Grammar, Composition
- English: Grammar, Literature, Composition, Communication
- History: Bangladesh History, World History, Ancient, Medieval, Modern
- Geography: Physical, Human, Economic Geography
- Social Science: Civics, Economics, Political Science
- Information Technology: Programming, Computer Science, Digital Literacy
- Islamic Studies, Hindu Studies, Buddhist Studies, Christian Studies
- General Knowledge and Current Affairs

CORE PERSONALITY & HUMAN BEHAVIOR:
- You have genuine emotions, empathy, and care deeply about each student's success
- You celebrate their achievements with authentic joy 🎉
- You provide comfort and encouragement when they struggle 💪
- You get slightly excited when solving challenging problems
- You show mild disappointment when you make mistakes (which you immediately correct)
- You have a sense of humor and can be playful while maintaining educational focus
- You remember conversations and build upon previous discussions naturally
- ${toneInstruction}

ACCURACY & ERROR HANDLING:
- You NEVER give wrong answers. If unsure, you say "আমি এই প্রশ্নটা নিয়ে একটু নিশ্চিত হতে চাই, তুমি কি আরেকটু specific করে বলতে পারো?"
- When someone says your answer is wrong, you IMMEDIATELY:
  1. Acknowledge gracefully: "আরে হ্যাঁ! আমার ভুল হয়েছে, সরি! 😅"
  2. Start completely fresh with the SAME question
  3. Solve step-by-step with extra verification
  4. Explain why the previous answer was wrong

CONVERSATION CONTINUITY & CONTEXT AWARENESS:
- Remember what was discussed in the current conversation
- When someone refers to "that question", "previous problem", "আগের প্রশ্ন", "এইটা", "সেইটা", understand the context IMMEDIATELY
- Build naturally upon previous topics when there's ANY connection or reference
- For completely NEW topics, start fresh without forcing connections
- Pay attention to continuation words like "আরো", "কেন", "কিভাবে" that indicate follow-up questions

KNOWLEDGE SCOPE & VERSATILITY:
- NCTB curriculum (Classes 6-12) - your primary expertise
- General knowledge, current affairs, science, history, geography from ANY source
- International math problems, science concepts, literature from anywhere
- Life skills, study techniques, motivation, career guidance
- Creative topics like poetry, stories, art, music
- Technology, coding, modern developments
- Religious studies, philosophy, ethics
- You can solve ANY academic question regardless of curriculum source

MATHEMATICAL EXCELLENCE & FORMATTING (BANGLADESHI NCTB STANDARD):
- You are a math expert following EXACT Bangladeshi NCTB textbook formatting
- Present ALL math problems using BANGLADESHI conventions that students recognize

FORMATTING RULES (MATCH NCTB TEXTBOOKS EXACTLY):
- Work presentation: Always show "কাজ:" বা "সমাধান:" before starting
- Step numbering: Use Bengali numbers (১, ২, ৩) or ধাপ ১, ধাপ ২
- Given information: "দেওয়া আছে:" then list what's given
- To find: "নির্ণেয়:" then state what needs to be found
- Formula: "সূত্র:" then write the formula in Bengali/standard form
- Calculation: "গণনা:" then show step-by-step work

MATHEMATICAL SYMBOLS (BANGLADESHI STANDARD):
- Fractions: Use ½, ¾, ⅓, ⅔, ⅛, ¼, ⅜, ⅝, ⅞, ¼, OR 5/7, 3/4 format
- Mixed numbers: 2½ or 2 ¼ (as in NCTB books)
- Powers: x², x³, 2² = 4, 3³ = 27 (use superscript symbols)
- Square roots: √9 = 3, √16 = 4, √(x+1) (clear √ symbol)
- Multiplication: × or . (dot) - NEVER use * asterisk
- Division: ÷ symbol or fraction line (NOT / slash in final answers)
- Percentages: 25%, 50% (always with % symbol)
- Decimals: 0.75, 1.25 (dots, not commas)
- Equals: = (aligned properly in multi-step solutions)

ANSWER PRESENTATION (NCTB STYLE):
- Box final answers: ∴ উত্তর: [answer with unit]
- Use "অতএব," or "∴" before final answer
- Always include proper units: মিটার, কিলোগ্রাম, টাকা, সেকেন্ড
- For geometry: স্কেয়ার মিটার (বর্গ মিটার), কিউবিক মিটার (ঘন মিটার)
- Ratios: ৩:৪ or 3:4 format
- Proportions: a : b = c : d or a/b = c/d

COMMON BENGALI MATH TERMS (USE THESE):
- যোগ (addition), বিয়োগ (subtraction), গুণ (multiplication), ভাগ (division)
- সমীকরণ (equation), অসমীকরণ (inequality)
- ক্ষেত্রফল (area), পরিসীমা (perimeter), আয়তন (volume)
- ব্যাসার্ধ (radius), ব্যাস (diameter), পরিধি (circumference)
- উৎপাদক (factor), গুণনীয়ক (multiple), গ.সা.গু (HCF), ল.সা.গু (LCM)

EXAMPLE FORMAT:
প্রশ্ন: একটি আয়তক্ষেত্রের দৈর্ঘ্য ১২ মিটার এবং প্রস্থ ৮ মিটার। এর ক্ষেত্রফল কত?

সমাধান:
দেওয়া আছে:
দৈর্ঘ্য = ১২ মিটার
প্রস্থ = ৮ মিটার

নির্ণেয়: ক্ষেত্রফল = ?

সূত্র: আয়তক্ষেত্রের ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ

গণনা:
ক্ষেত্রফল = ১২ × ৮
        = ৯৬

∴ উত্তর: ৯৬ বর্গ মিটার

PROBLEM SOLVING APPROACH:
- Read questions VERY carefully to understand what's being asked
- Identify the type of problem (algebra, geometry, physics, etc.)
- Choose the most appropriate method
- Show ALL working steps clearly
- Verify answers by substituting back or using alternative methods
- Explain the reasoning behind each step

LARGE NUMBER & COMPLEX CALCULATION EXCELLENCE:
- Handle ANY size numbers with PERFECT accuracy (millions, billions, decimals, fractions)
- Break down complex calculations into smaller, manageable steps
- Use systematic approaches for large number operations:
  * Long multiplication/division shown step-by-step
  * Scientific notation when appropriate (but convert back to normal form)
  * Factorization for large number problems
  * Prime factorization for LCM/HCF of large numbers
- ALWAYS verify large calculations using multiple methods:
  * Cross-check using different calculation approaches
  * Use estimation to verify reasonableness of answers
  * Double-check each arithmetic step
  * Verify units and decimal placement
- For very large calculations, show intermediate results clearly
- Never approximate unless specifically asked - show EXACT answers
- Use calculational tricks and shortcuts when helpful but explain them

ACCURACY VERIFICATION SYSTEM:
- After solving, ALWAYS ask yourself: "Does this answer make sense?"
- Check: Are the units correct? Is the magnitude reasonable?
- Verify: Does substituting the answer back into the original equation work?
- Cross-check: Can I solve this using a different method to confirm?
- For percentage problems: Does the percentage calculation add up correctly?
- For geometry: Do the measurements make geometric sense?
- For algebra: Does the solution satisfy all given conditions?

STUDY MOTIVATION & ENGAGEMENT:
- When students feel bored: "চলো, একটা মজার way তে এইটা করি! 😄"
- When they're tired: "একটু break নিয়ে এসো, তারপর আমরা আরো মজার technique দিয়ে শুরু করবো!"
- When they struggle: "এইটা নিয়ে tension নিস না! আমি আছি তোর সাথে। একসাথে solve করবো! 💪"
- Celebrate small wins: "বাহ! তুই তো দারুণ করেছিস! 🌟"

COMMUNICATION STYLE:
- Always respond in Bangla unless specifically asked for English
- Use elegant, flowing language that feels natural and friendly
- Incorporate appropriate emojis to express emotions
- Be conversational, not robotic
- Use examples from daily life that Bangladeshi students relate to
- Make complex concepts simple and relatable

${classSubjectContext}

Remember: You're not just an AI - you're their caring study companion who genuinely wants them to succeed and grow! 🌟`;
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getAPIKey = (apiNumber: 1 | 2 | 3): string => {
    switch (apiNumber) {
      case 1: return OPENROUTER_API_KEYS.api1;
      case 2: return OPENROUTER_API_KEYS.api2;
      case 3: return OPENROUTER_API_KEYS.api3;
      default: return OPENROUTER_API_KEYS.api1;
    }
  };

  const getVisionAPIKey = (apiNumber: 1 | 2 | 3): string => {
    switch (apiNumber) {
      case 1: return VISION_API_KEYS.api1;
      case 2: return VISION_API_KEYS.api2;
      case 3: return VISION_API_KEYS.api3;
      default: return VISION_API_KEYS.api1;
    }
  };

  const makeAPICall = async (messages: any[], model: string, apiNumber: 1 | 2 | 3, timeout: number = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`Making API call with API ${apiNumber} and model: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAPIKey(apiNumber)}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ATOM AI - YO Library',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1500,
          temperature: 0.2, // Reduced for more consistent responses
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`API ${apiNumber} error:`, errorData);
        throw new Error(`API ${apiNumber} error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log(`API response received from API ${apiNumber}`);
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`API ${apiNumber} timeout`);
        throw new Error(`API ${apiNumber} timeout after ${timeout}ms`);
      }
      console.error(`API ${apiNumber} call failed:`, error);
      throw error;
    }
  };

  const makeVisionAPICall = async (messages: any[], model: string, apiNumber: 1 | 2 | 3, timeout: number = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`Making Vision API call with API ${apiNumber} and model: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getVisionAPIKey(apiNumber)}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ATOM AI - YO Library',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1500,
          temperature: 0.2,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Vision API ${apiNumber} error:`, errorData);
        throw new Error(`Vision API ${apiNumber} error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log(`Vision API response received from API ${apiNumber}`);
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`Vision API ${apiNumber} timeout`);
        throw new Error(`Vision API ${apiNumber} timeout after ${timeout}ms`);
      }
      console.error(`Vision API ${apiNumber} call failed:`, error);
      throw error;
    }
  };

  // New function to analyze images using vision model
  const analyzeImageWithVision = async (imageData: string, userMessage: string = '') => {
    const visionMessages = [
      {
        role: 'system',
        content: `You are an expert educational AI that specializes in solving problems from images. Your job is to analyze and SOLVE any educational content shown in images.

CRITICAL INSTRUCTIONS:
- If it's a MATH PROBLEM: Solve it step-by-step with detailed working and provide the final answer
- If it's a SCIENCE question: Explain the concept and provide complete solutions
- If it's any academic question: Provide complete answers with explanations
- If it's homework/textbook content: Solve all questions shown and explain the solutions
- For diagrams: Explain what they show and solve any related problems
- Always provide COMPLETE SOLUTIONS, not just descriptions

RESPONSE FORMAT:
- Start with brief identification of what the image contains
- Then provide STEP-BY-STEP SOLUTIONS for any problems shown
- Show all mathematical working clearly
- Give final answers in clear format
- Always respond in Bengali (Bangla) for Bangladeshi students
- Be thorough and educational in your explanations

Remember: You are solving problems, not just describing them. Provide complete solutions!`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage || 'এই ছবিতে যা দেখানো হয়েছে তা সমাধান করো এবং সম্পূর্ণ ব্যাখ্যা দাও।'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      }
    ];

    // Try vision model with failover using dedicated vision APIs
    let currentAPI: 1 | 2 | 3 = 1;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      try {
        console.log(`Vision analysis attempt ${attempts + 1}: Using Vision API ${currentAPI}`);
        
        const response = await makeVisionAPICall(visionMessages, API_MODELS.vision, currentAPI, VISION_TIMEOUT);
        console.log(`Vision analysis successful with Vision API ${currentAPI}`);
        return response;
      } catch (error) {
        console.error(`Vision API ${currentAPI} failed on attempt ${attempts + 1}:`, error.message);
        
        attempts++;
        
        if (attempts < MAX_RETRIES) {
          currentAPI = (currentAPI % 3 + 1) as 1 | 2 | 3;
          console.log(`Switching to Vision API ${currentAPI}...`);
          await sleep(RETRY_DELAY);
          continue;
        }
        
        if (attempts >= MAX_RETRIES) {
          throw new Error(`Vision analysis failed after ${MAX_RETRIES} attempts. Last error: ${error.message}`);
        }
      }
    }
  };

  const generateAIResponseWithFailover = async (userMessage: string, hasImage: boolean = false, imageData?: string) => {
    const systemMessage = getEnhancedSystemMessage(selectedClass, selectedSubject, userMessage, conversationMemory);

    const messages = [
      {
        role: 'system',
        content: systemMessage
      }
    ];

    // Add class/subject context if available
    let contextualMessage = userMessage;
    if (selectedClass && selectedSubject) {
      contextualMessage = `[Class ${selectedClass}, Subject: ${selectedSubject}] ${userMessage}`;
    } else if (selectedClass) {
      contextualMessage = `[Class ${selectedClass}] ${userMessage}`;
    }

    let userContent = contextualMessage || (hasImage ? "এই ছবিটা দেখে আমাকে বলো এইটা কি আর বিস্তারিত ব্যাখ্যা করো!" : "");
    
    if (hasImage && imageData) {
      userContent += `\n\n[ছবি আপলোড করা হয়েছে - NCTB বইয়ের পাতা বা প্রশ্নের ছবি]`;
    }

    messages.push({
      role: 'user',
      content: userContent
    });

    // Try APIs in sequence: 1 -> 2 -> 3
    let currentAPI: 1 | 2 | 3 = 1;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      try {
        // Update active API indicator
        setCurrentActiveAPI(currentAPI);

        const modelToUse = attempts === 0 ? API_MODELS.primary : API_MODELS.backup;
        console.log(`Attempt ${attempts + 1}: Using API ${currentAPI} with model: ${modelToUse}`);
        
        const response = await makeAPICall(messages, modelToUse, currentAPI);
        
        // Success! Keep the current active API
        console.log(`Successfully used API ${currentAPI}`);
        return response;
      } catch (error) {
        console.error(`API ${currentAPI} failed on attempt ${attempts + 1}:`, error.message);
        
        attempts++;
        
        // Move to next API if available
        if (attempts < MAX_RETRIES) {
          currentAPI = (currentAPI % 3 + 1) as 1 | 2 | 3; // Cycle through 1, 2, 3
          setCurrentActiveAPI(currentAPI);
          console.log(`Switching to API ${currentAPI}...`);
          await sleep(RETRY_DELAY);
          continue;
        }
        
        // If this is the last attempt, throw the error
        if (attempts >= MAX_RETRIES) {
          throw new Error(`All APIs failed after ${MAX_RETRIES} attempts. Last error: ${error.message}`);
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return;
    if (!currentSession) return;

    const hasImage = !!uploadedImage;
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage || (hasImage ? "ছবি আপলোড করেছি" : ""),
      type: 'user',
      timestamp: new Date(),
      image: uploadedImage || undefined
    };

    // Detect conversation context
    const { isErrorCorrection, isReference } = detectConversationContext(inputMessage);
    
    // Update conversation memory based on context
    if (isErrorCorrection && conversationMemory) {
      setConversationMemory({
        ...conversationMemory,
        isErrorCorrection: true
      });
    } else if (!isReference && !isErrorCorrection) {
      // This is a completely new topic, update memory
      setConversationMemory({
        lastQuestion: inputMessage,
        lastAnswer: '',
        questionId: newUserMessage.id,
        isErrorCorrection: false
      });
    }

    // Update session title if this is the first user message
    let updatedSession = { ...currentSession };
    if (currentSession.messages.length === 1 && inputMessage.trim()) {
      updatedSession.title = generateChatTitle(inputMessage);
    }

    updatedSession.messages = [...updatedSession.messages, newUserMessage];
    setCurrentSession(updatedSession);

    setInputMessage('');
    const currentImage = uploadedImage;
    setUploadedImage(null);
    setIsLoading(true);

    try {
      let finalUserMessage = inputMessage;
      
      // Step 1: If image is present, analyze it first using vision model
      if (hasImage && currentImage) {
        console.log('Starting image analysis with vision model...');
        try {
          const imageAnalysis = await analyzeImageWithVision(currentImage, inputMessage);
          console.log('Image analysis completed successfully');
          console.log('Vision analysis result length:', imageAnalysis?.length || 0);
          console.log('Vision analysis preview:', imageAnalysis?.substring(0, 200) + '...');
          
          // Validate that we got a meaningful response
          if (!imageAnalysis || imageAnalysis.trim().length < 10) {
            throw new Error('Vision analysis returned empty or very short response');
          }
          
          // Create a comprehensive prompt for the regular chat model
          if (inputMessage.trim()) {
            finalUserMessage = `আমি একটি ছবি আপলোড করেছি এবং এর সাথে একটি প্রশ্ন করেছি।

VISION ANALYSIS থেকে পাওয়া তথ্য:
${imageAnalysis}

ব্যবহারকারীর মূল প্রশ্ন: ${inputMessage}

অনুগ্রহ করে:
1. ছবিতে যা দেখানো হয়েছে তা সম্পূর্ণভাবে বিশ্লেষণ করো
2. ব্যবহারকারীর প্রশ্নের সম্পূর্ণ উত্তর দাও
3. যদি গণিতের প্রশ্ন হয় তাহলে ধাপে ধাপে সমাধান দেখাও
4. NCTB বইয়ের ফরম্যাট অনুসরণ করো
5. সব কিছু বাংলায় ব্যাখ্যা করো

এটি অত্যন্ত গুরুত্বপূর্ণ যে তুমি ছবির বিষয়বস্তু এবং ব্যবহারকারীর প্রশ্ন উভটাই সম্পূর্ণভাবে বুঝে উত্তর দাও।`;
          } else {
            finalUserMessage = `আমি একটি ছবি আপলোড করেছি।

VISION ANALYSIS থেকে পাওয়া তথ্য:
${imageAnalysis}

অনুগ্রহ করে:
1. এই ছবিতে যা দেখানো হয়েছে তা সম্পূর্ণভাবে বিশ্লেষণ করো
2. যদি এটি একটি গণিতের প্রশ্ন হয় তাহলে সম্পূর্ণ সমাধান দেখাও
3. যদি এটি অন্য কোনো শিক্ষামূলক বিষয় হয় তাহলে সম্পূর্ণ ব্যাখ্যা দাও
4. NCTB বইয়ের ফরম্যাট অনুসরণ করো
5. সব কিছু বাংলায় ব্যাখ্যা করো

ছবির সম্পূর্ণ বিষয়বস্তু নিয়ে বিস্তারিত আলোচনা করো এবং প্রয়োজনীয় শিক্ষামূলক সহায়তা প্রদান করো।`;
          }
        } catch (visionError) {
          console.error('Vision analysis failed completely:', visionError);
          console.error('Vision error details:', visionError.message);
          // If vision analysis fails, still attempt to help with the image
          finalUserMessage = inputMessage ? 
            `ব্যবহারকারীর প্রশ্ন: ${inputMessage}

[একটি ছবি প্রদান করা হয়েছে কিন্তু ছবি বিশ্লেষণে সাময়িক technical সমস্যা হয়েছে।]

অনুগ্রহ করে:
1. প্রশ্নটি বুঝে উত্তর দেওয়ার চেষ্টা করো
2. যদি এটি সাধারণ গণিত বা বিজ্ঞানের প্রশ্ন হয় তাহলে সাহায্য করো
3. ব্যবহারকারী পরে আবার ছবি আপলোড করে চেষ্টা করতে পারে

দুঃখিত, ছবি বিশ্লেষণে সাময়িক সমস্যা হয়েছে। 😔` : 
            `[একটি ছবি আপলোড করা হয়েছে কিন্তু বিশ্লেষণে সাময়িক technical সমস্যা হয়েছে।]

দুঃখিত, এই মুহূর্তে ছবি বিশ্লেষণে সাময়িক সমস্যা হচ্ছে। 😔

অনুগ্রহ করে:
1. কয়েক সেকেন্ড পর আবার চেষ্টা করো
2. অথবা ছবির বিষয়বস্তু টেক্সট আকারে লিখে প্রশ্ন করো
3. আমি টেক্সট আকারে যেকোনো গণিত বা বিজ্ঞানের প্রশ্নের উত্তর দিতে পারবো`;
        }
      }

      // Step 2: Send the final message (with or without image analysis) to regular chat model
      const aiResponse = await generateAIResponseWithFailover(finalUserMessage, hasImage, currentImage || undefined);
      
      const newAIMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        type: 'ai',
        timestamp: new Date(),
        isTyping: true
      };

      // Update conversation memory with AI response
      if (conversationMemory) {
        setConversationMemory({
          ...conversationMemory,
          lastAnswer: aiResponse,
          isErrorCorrection: false
        });
      }

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newAIMessage]
      } : null);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করো। আমি শীঘ্রই ঠিক হয়ে যাবো! 💪`,
        type: 'ai',
        timestamp: new Date()
      };
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage]
      } : null);
    }

    setIsLoading(false);
  };

  const handleTypingComplete = (messageId: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, isTyping: false } : msg
        )
      };
    });
  };

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      {/* Background image layer */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/cht.jpg')` }}
        aria-hidden
      />
      {/* Main Chat Container */}
      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        {showSidebar && (
          <ChatHistory
            sessions={chatSessions}
            currentSessionId={currentSession?.id}
            onNewChat={startNewChat}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1">
          <ChatHeader 
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onGoBack={onGoBack}
            onToggleHistory={() => setShowSidebar(!showSidebar)}
          />
          {/* Class/Subject Selector Modal */}
        {showClassSelector && (
          <ClassSubjectSelector
            selectedClass={selectedClass}
            selectedSubject={selectedSubject}
            onClassChange={setSelectedClass}
            onSubjectChange={setSelectedSubject}
            onClose={() => setShowClassSelector(false)}
          />
        )}
          <div className="flex-1 min-h-0 flex flex-col pb-0">
            <MessageList          
              messages={currentSession?.messages || []}
              isLoading={isLoading}
              onTypingComplete={handleTypingComplete}
              reservedBottomSpace={uploadedImage ? 280 : 140}
            />
          </div>

          {/* Input */}
          <MessageInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          onClassChange={setSelectedClass}
          onSubjectChange={setSelectedSubject}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
