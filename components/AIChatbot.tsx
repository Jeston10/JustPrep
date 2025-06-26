'use client';

import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiMail } from 'react-icons/fi';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant. I can help you understand how to use this website, how to give interviews, and answer any questions about the platform. For more guidance or support, contact sjestonsingh@gmail.com.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    if (input.includes('how to use') || input.includes('operate') || input.includes('get started')) {
      return "To use this website: 1) Sign up or log in. 2) Navigate to 'Take Interviews' to start a mock interview. 3) Select your preferred technology. 4) Answer questions and receive feedback. 5) Review your performance and improve.";
    }
    if (input.includes('interview') || input.includes('give interview')) {
      return "To give an interview: Go to 'Take Interviews', choose your tech stack, and start. Answer the questions as you would in a real interview. You'll get instant feedback and can review your answers afterward.";
    }
    if (input.includes('profile') || input.includes('account')) {
      return "You can update your profile, change your email, upload a profile picture, and add a description in the Profile section. Use the settings menu for logout or account deletion.";
    }
    if (input.includes('contact') || input.includes('support') || input.includes('help')) {
      return "For more guidance or support, contact sjestonsingh@gmail.com. I'm here to help you with any questions about the platform!";
    }
    return "I'm here to help you with any aspect of the website: using features, giving interviews, managing your profile, and more. For further support, email sjestonsingh@gmail.com.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-gray-900 rounded-lg shadow-xl border border-gray-700 flex flex-col">
          <div className="bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">JustPrep Assistant</h3>
                <p className="text-xs text-gray-300">How can I help you?</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300 transition"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-700 bg-gray-900">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about the website..."
                className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent text-sm bg-gray-800 text-gray-100 placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="px-3 py-2 bg-primary-100 text-gray-900 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FiSend size={16} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <FiMail size={12} />
              <span>Need more help? Email: sjestonsingh@gmail.com</span>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center hover:scale-110 border border-gray-600"
        aria-label="Open AI Assistant"
      >
        <FiMessageCircle size={24} />
      </button>
    </div>
  );
};

export default AIChatbot; 