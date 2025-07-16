'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiPaperclip, FiSliders, FiGrid, FiMessageSquare, FiStar,
  FiImage, FiVideo, FiSearch, FiPhone, FiDownload, FiArrowRight,
  FiBox, FiPlus, FiChevronDown, FiLoader, FiLink, FiCheck, FiX, FiEye, FiEyeOff
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SlidePreview from './SlidePreview';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/spotlight-card';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { HyperText } from '@/components/ui/hyper-text';

export interface Slide {
  title: string;
  content: string;
  type: 'title' | 'content' | 'bullet';
  bulletPoints?: string[];
  html?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  slideData?: Slide[];
  hasSlides?: boolean;
}

interface SuperAgentProps {
  className?: string;
  userId: string | null;
}

const agentTools = [
  { id: 'general', name: 'General Assistant', icon: FiMessageSquare },
  { id: 'slides', name: 'Presentation Creator', icon: FiSliders },
  { id: 'search', name: 'Web Search', icon: FiSearch },
  { id: 'images', name: 'Image Generator', icon: FiImage },
  { id: 'videos', name: 'Video Creator', icon: FiVideo },
  { id: 'calls', name: 'Phone Calls', icon: FiPhone },
  { id: 'files', name: 'File Manager', icon: FiPaperclip },
];

const WelcomeScreen = ({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) => {
  const examplePrompts = [
    'Create a 5-slide presentation about the future of AI',
    'Summarize the latest trends in renewable energy',
    'Write a short story about a robot who discovers music',
    'Generate a logo for a coffee shop named "The Daily Grind"',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">


      <div className="mb-2">
        <HyperText text="Super Agent" className="text-8xl font-bold" />
      </div>
      <p className="text-gray-500 mb-8 max-w-md">Powered by Composio - Your creative partner for generating content, slides, and more.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {examplePrompts.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            onClick={() => onPromptSelect(prompt)}
            className="p-4 bg-white rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 hover:shadow-md"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const MessageBubble = ({ message, activeSlide, setActiveSlide, downloadAsPPT }: {
  message: Message;
  activeSlide: number;
  setActiveSlide: (slide: number) => void;
  downloadAsPPT: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx('flex items-start gap-4 max-w-4xl', message.role === 'user' ? 'justify-end ml-auto' : 'justify-start')}
    >
      {message.role === 'assistant' && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <FiStar className="w-4 h-4 text-white" />
        </div>
      )}
      
      <GlowCard glowColor={message.role === 'user' ? 'blue' : 'purple'} className="min-w-0 w-auto h-auto !aspect-auto !h-auto !min-h-0 !p-2 !py-2 !px-4 !shadow-none">
        {message.role === 'assistant' ? (
          <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                  </a>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{message.content}</p>
        )}
        
        {message.hasSlides && message.slideData && message.slideData.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1h-2a1 1 0 01-1-1V4m0 0H8m8 0v2H8V4" />
              </svg>
              Presentation Preview
            </h3>
            <div 
              className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 h-120"
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' && activeSlide > 0) {
                  setActiveSlide(activeSlide - 1);
                } else if (e.key === 'ArrowRight' && activeSlide < message.slideData!.length - 1) {
                  setActiveSlide(activeSlide + 1);
                }
              }}
              tabIndex={0}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.4, 0.0, 0.2, 1],
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.4 },
                    y: { duration: 0.4 }
                  }}
                  className="w-full max-h-130 bg-white rounded-lg overflow-y-auto overflow-x-hidden"
                  style={{ minHeight: '300px' }}
                >
                  {message.slideData[activeSlide] && message.slideData[activeSlide].html ? (
                    <div 
                      className="w-full h-120 p-4"
                      dangerouslySetInnerHTML={{ __html: message.slideData[activeSlide].html! }}
                    />
                  ) : (
                    <div className="p-4">
                      {message.slideData[activeSlide] ? (
                        <SlidePreview slide={message.slideData[activeSlide]} index={activeSlide} isSelected={true} onClick={()=>{}} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FiLoader className="w-8 h-8 text-gray-400 animate-spin" />
                          <p className="ml-4 text-gray-500">Generating slide content...</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-600">Slide {activeSlide + 1} of {message.slideData.length}</p>
                <div className="flex bg-gray-100 rounded-full p-1">
                  {message.slideData.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`w-2 h-2 rounded-full mx-0.5 transition-all duration-200 ${
                        index === activeSlide ? 'bg-blue-500 w-4' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                  disabled={activeSlide === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => setActiveSlide(Math.min(message.slideData!.length - 1, activeSlide + 1))}
                  disabled={activeSlide === message.slideData.length - 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={downloadAsPPT}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FiDownload className="w-4 h-4" />
                  Download PPT
                </button>
              </div>
            </div>
          </div>
        )}
      </GlowCard>
      
      {message.role === 'user' && (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600">You</span>
        </div>
      )}
    </motion.div>
  );
};

export default function SuperAgent({ className, userId }: SuperAgentProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState(agentTools[0]);
  const [isToolSelectorOpen, setIsToolSelectorOpen] = useState(false);
  const [currentSlides, setCurrentSlides] = useState<Slide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  // Spreadsheet state
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  
  // Google Docs state
  const [docUrl, setDocUrl] = useState('');
  const [docId, setDocId] = useState('');
  const [isDocConnected, setIsDocConnected] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  
  const [sidebarWidth, setSidebarWidth] = useState(500); // Default wider width
  const [isResizing, setIsResizing] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Spreadsheet helper functions
  const validateSheetUrl = (url: string): boolean => {
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    return googleSheetsRegex.test(url);
  };

  const extractSheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    const id = extractSheetId(url);
    return `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing&widget=true&headers=false`;
  };

  const detectSpreadsheetUrl = (text: string): string | null => {
    const googleSheetsRegex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+[^\s]*/g;
    const match = text.match(googleSheetsRegex);
    return match ? match[0] : null;
  };

  // Google Docs helper functions
  const validateDocUrl = (url: string): boolean => {
    const googleDocsRegex = /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/;
    return googleDocsRegex.test(url);
  };

  const extractDocId = (url: string): string => {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const getDocEmbedUrl = (url: string): string => {
    if (!url) return '';
    const id = extractDocId(url);
    return `https://docs.google.com/document/d/${id}/edit?usp=sharing&widget=true&headers=false`;
  };

  const detectDocumentUrl = (text: string): string | null => {
    const googleDocsRegex = /https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+[^\s]*/g;
    const match = text.match(googleDocsRegex);
    return match ? match[0] : null;
  };

  const handleExamplePrompt = (p: string) => {
    setPrompt(p);
    inputRef.current?.focus();
  };

  // Refactor handleSubmit to accept a message argument
  const handleSubmit = async (message?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = (typeof message === 'string' ? message : prompt).trim();
    if (!msg || isLoading) return;

    // Check if the prompt contains a spreadsheet URL
    const detectedSheetUrl = detectSpreadsheetUrl(msg);
    const detectedDocUrl = detectDocumentUrl(msg);

    // Always switch to the correct sidebar if a URL is detected
    if (detectedSheetUrl && validateSheetUrl(detectedSheetUrl)) {
      setSheetUrl(detectedSheetUrl);
      setSheetId(extractSheetId(detectedSheetUrl));
      setIsSheetConnected(true);
      setShowSpreadsheet(true);
      setShowDocument(false); // Always hide doc sidebar if spreadsheet is detected
    } else if (detectedDocUrl && validateDocUrl(detectedDocUrl)) {
      setDocUrl(detectedDocUrl);
      setDocId(extractDocId(detectedDocUrl));
      setIsDocConnected(true);
      setShowDocument(true);
      setShowSpreadsheet(false); // Always hide spreadsheet sidebar if doc is detected
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      // Send to SuperAgent route
      const response = await fetch('/api/superagent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: msg,
          selectedTool: selectedTool.id,
          conversationHistory: messages,
          userId: userId,
          sheetUrl: detectedSheetUrl || (isSheetConnected ? sheetUrl : undefined),
          docUrl: detectedDocUrl || (isDocConnected ? docUrl : undefined),
        }),
      });

      if (!response.ok) throw new Error('API response was not ok.');
      
      let data = await response.json();

      // Check for the [SLIDES] command
      if (data.response && data.response.includes('[SLIDES]')) {
        const cleanedResponse = data.response.replace('[SLIDES]', '').trim();
        
        // Update the message content without the command
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cleanedResponse,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Now, call the dedicated slide generation API
        const slideResponse = await fetch('/api/generate-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: cleanedResponse }),
        });

        if (slideResponse.ok) {
          const slideData = await slideResponse.json();
          if (slideData.slides) {
            // Find the message we just added and update it with the slide data
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, slideData: slideData.slides, hasSlides: true } 
                : msg
            ));
            setCurrentSlides(slideData.slides);
            setActiveSlide(0);
          }
        }
      } else {
        // Normal response without slides
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          slideData: data.slides || [],
          hasSlides: data.hasSlides || false,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        if (data.slides && data.slides.length > 0) {
          setCurrentSlides(data.slides);
          setActiveSlide(0);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsPPT = async () => {
    if (currentSlides.length === 0) return;

    try {
      const response = await fetch('/api/convert-to-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: currentSlides,
          title: 'AI Generated Presentation',
          userId: userId,
          style: 'professional', // Default to professional style
        }),
      });

      if (!response.ok) throw new Error('Failed to convert to PowerPoint');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading presentation:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const disconnectSpreadsheet = () => {
    setIsSheetConnected(false);
    setSheetUrl('');
    setSheetId('');
    setShowSpreadsheet(false);
  };

  const disconnectDocument = () => {
    setIsDocConnected(false);
    setDocUrl('');
    setDocId('');
    setShowDocument(false);
  };

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Constrain width between 300px and 80% of window width
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp); // Also handle mouse leave
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className={clsx('flex h-screen bg-gray-50 relative', className)}>
      {/* Main Chat Interface */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ 
          marginRight: (showSpreadsheet || showDocument) ? `${sidebarWidth}px` : '0px'
        }}
      >

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <WelcomeScreen onPromptSelect={handleExamplePrompt} />
          ) : (
            <ChatMessageList smooth className="px-4 py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  activeSlide={activeSlide}
                  setActiveSlide={setActiveSlide}
                  downloadAsPPT={downloadAsPPT}
                />
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 max-w-4xl"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiLoader className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-bl-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </ChatMessageList>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4 shadow-md">
          <div className="max-w-4xl mx-auto">
            <PromptInputBox
              onSend={(message) => handleSubmit(message)}
              isLoading={isLoading}
              placeholder="Ask Super Agent anything or paste a Google Sheets/Docs URL..."
              className="bg-white rounded-2xl shadow-xl text-black"
            />
            <p className="text-xs text-center text-gray-400 mt-2 font-sans">
              Super Agent can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {/* Spreadsheet Sidebar */}
      <AnimatePresence>
        {showSpreadsheet && isSheetConnected && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 flex z-20"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className={clsx(
                "w-2 h-full bg-gray-100 hover:bg-gray-200 cursor-col-resize flex items-center justify-center group border-r border-gray-200 transition-colors",
                isResizing && "bg-blue-200"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-gray-600 transition-colors"></div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 flex flex-col">
              {/* Spreadsheet Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Connected Spreadsheet</h2>
                  <button
                    onClick={disconnectSpreadsheet}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FiCheck className="w-4 h-4" />
                  <span>Connected to Google Sheets</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {sheetUrl}
                </p>
              </div>

              {/* Spreadsheet View */}
              <div className="flex-1 bg-gray-50">
                <iframe
                  src={getEmbedUrl(sheetUrl)}
                  className="w-full h-full border-0"
                  title="Google Sheets"
                  allow="fullscreen"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Docs Sidebar */}
      <AnimatePresence>
        {showDocument && isDocConnected && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 flex z-20"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className={clsx(
                "w-2 h-full bg-gray-100 hover:bg-gray-200 cursor-col-resize flex items-center justify-center group border-r border-gray-200 transition-colors",
                isResizing && "bg-blue-200"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-gray-600 transition-colors"></div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 flex flex-col">
              {/* Document Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Connected Document</h2>
                  <button
                    onClick={disconnectDocument}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <FiCheck className="w-4 h-4" />
                  <span>Connected to Google Docs</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {docUrl}
                </p>
              </div>

              {/* Document View */}
              <div className="flex-1 bg-gray-50">
                <iframe
                  src={getDocEmbedUrl(docUrl)}
                  className="w-full h-full border-0"
                  title="Google Docs"
                  allow="fullscreen"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 