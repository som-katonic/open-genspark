'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiLink, FiMessageSquare, FiLoader, FiCheck, FiX } from 'react-icons/fi';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GoogleSheetsAgentProps {
  className?: string;
  userId?: string | null;
}

export default function GoogleSheetsAgent({ className, userId }: GoogleSheetsAgentProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const validateSheetUrl = (url: string): boolean => {
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    return googleSheetsRegex.test(url);
  };

  const extractSheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const connectToSheet = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a valid Google Sheets URL');
      return;
    }

    if (!validateSheetUrl(sheetUrl)) {
      setError('Please enter a valid Google Sheets URL');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const id = extractSheetId(sheetUrl);
      setSheetId(id);
      setIsConnected(true);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Great! I'm now connected to your Google Sheets. I can help you analyze data, answer questions about your spreadsheet, and perform various operations. What would you like to know about your data?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    } catch (err) {
      setError('Failed to connect to the spreadsheet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/google-sheets-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sheetUrl,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isConnected) {
        sendMessage();
      } else {
        connectToSheet();
      }
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    const id = extractSheetId(url);
    return `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing&widget=true&headers=false`;
  };

  return (
    <div className={clsx('flex h-screen bg-gray-50', className)}>
      {/* Premium White Sidebar */}
      <div className="w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <FiMessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Sheets Agent</h1>
              <p className="text-sm text-gray-500">AI-powered spreadsheet assistant</p>
            </div>
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <FiLink className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Connect your Google Sheet</span>
              </div>
              
              <div className="space-y-2">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Paste Google Sheets URL here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                
                <button
                  onClick={connectToSheet}
                  disabled={isConnecting || !sheetUrl.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  {isConnecting ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <FiCheck className="w-4 h-4" />
                <span>Connected to spreadsheet</span>
              </div>
              <button
                onClick={() => {
                  setIsConnected(false);
                  setSheetUrl('');
                  setSheetId('');
                  setMessages([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <FiX className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLink className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Sheet</h3>
              <p className="text-sm text-gray-500 px-4">
                Paste your Google Sheets URL above to start chatting with your data
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clsx(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={clsx(
                        'text-xs mt-1',
                        message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center space-x-2">
                    <FiLoader className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {isConnected && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your spreadsheet..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet View */}
      <div className="flex-1 flex flex-col">
        {isConnected && sheetUrl ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your Spreadsheet</h2>
              <p className="text-sm text-gray-500">
                Connected to: {sheetUrl.substring(0, 60)}...
              </p>
            </div>
            <div className="flex-1">
              <iframe
                src={getEmbedUrl(sheetUrl)}
                className="w-full h-full border-0"
                title="Google Sheets"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Connect Your Google Sheet
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Paste your Google Sheets URL in the sidebar to view and interact with your spreadsheet data using AI
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 