"use client";

import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiX, FiSend, FiMail } from "react-icons/fi";

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
      id: "1",
      text: "Hi! I'm your AI assistant. I can help you understand how to use this website, how to give interviews, and answer any questions about the platform. For more guidance or support, contact sjestonsingh@gmail.com.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    if (
      input.includes("how to use") ||
      input.includes("operate") ||
      input.includes("get started")
    ) {
      return "To use this website: 1) Sign up or log in. 2) Navigate to 'Take Interviews' to start a mock interview. 3) Select your preferred technology. 4) Answer questions and receive feedback. 5) Review your performance and improve.";
    }
    if (input.includes("interview") || input.includes("give interview")) {
      return "To give an interview: Go to 'Take Interviews', choose your tech stack, and start. Answer the questions as you would in a real interview. You'll get instant feedback and can review your answers afterward.";
    }
    if (input.includes("profile") || input.includes("account")) {
      return "You can update your profile, change your email, upload a profile picture, and add a description in the Profile section. Use the settings menu for logout or account deletion.";
    }
    if (input.includes("contact") || input.includes("support") || input.includes("help")) {
      return "For more guidance or support, contact sjestonsingh@gmail.com. I'm here to help you with any questions about the platform!";
    }
    return "I'm here to help you with any aspect of the website: using features, giving interviews, managing your profile, and more. For further support, email sjestonsingh@gmail.com.";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {isOpen && (
        <div className="mb-4 flex h-96 w-80 flex-col rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
          <div className="flex items-center justify-between rounded-t-lg bg-gray-800 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">JustPrep Assistant</h3>
                <p className="text-xs text-gray-300">How can I help you?</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="text-white transition hover:text-gray-300"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-900 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser
                      ? "bg-gray-700 text-white"
                      : "border border-gray-700 bg-gray-800 text-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-100">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-700 bg-gray-900 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about the website..."
                className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary-100 focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="rounded-lg bg-primary-100 px-3 py-2 text-gray-900 transition hover:bg-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSend size={16} />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <FiMail size={12} />
              <span>Need more help? Email: sjestonsingh@gmail.com</span>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-gray-700"
        aria-label="Open AI Assistant"
      >
        <FiMessageCircle size={24} />
      </button>
    </div>
  );
};

export default AIChatbot;
