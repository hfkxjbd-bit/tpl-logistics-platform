import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string; // ISO string format
}

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

function generateSessionId(): string {
  return `chat-session-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem("tpl_chat_sessionId");
    const storedMessages = sessionStorage.getItem("tpl_chat_messages");
    const storedLastActive = sessionStorage.getItem("tpl_chat_last_active");
    const storedCreatedAt = sessionStorage.getItem("tpl_chat_createdAt");

    const now = Date.now();
    const isExpired = storedLastActive ? (now - Number(storedLastActive) > INACTIVITY_TIMEOUT) : true;

    if (storedSessionId && storedMessages && storedCreatedAt && !isExpired) {
      // Restore active session
      setSessionId(storedSessionId);
      setCreatedAt(storedCreatedAt);
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        resetToNewSession();
      }
    } else {
      // Start a fresh session
      resetToNewSession();
    }
  }, []);

  // Set up timer interval to automatically clear chat on 10-minute inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const storedLastActive = sessionStorage.getItem("tpl_chat_last_active");
      if (storedLastActive) {
        const inactiveTime = Date.now() - Number(storedLastActive);
        if (inactiveTime > INACTIVITY_TIMEOUT) {
          console.log("Inactivity timeout reached. Clearing chat session...");
          
          // Mark previous session as inactive in Firestore before resetting
          if (sessionId) {
            persistChatLog(messages, "inactive");
          }
          resetToNewSession();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [sessionId, messages]);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const resetToNewSession = () => {
    const newId = generateSessionId();
    const newCreatedAt = new Date().toISOString();
    const defaultMessages: ChatMessage[] = [
      {
        id: "welcome",
        sender: "bot",
        text: "Salamat! Welcome to Turkmenistanyn Poçtasy Customer Support. How can we assist you with your logistics, tracking, or booking today?",
        timestamp: newCreatedAt
      }
    ];

    setSessionId(newId);
    setCreatedAt(newCreatedAt);
    setMessages(defaultMessages);

    sessionStorage.setItem("tpl_chat_sessionId", newId);
    sessionStorage.setItem("tpl_chat_messages", JSON.stringify(defaultMessages));
    sessionStorage.setItem("tpl_chat_createdAt", newCreatedAt);
    sessionStorage.setItem("tpl_chat_last_active", Date.now().toString());
  };

  // Persist chat logs to Firestore for administrators review
  const persistChatLog = async (currentMessages: ChatMessage[], statusOverride?: "active" | "inactive") => {
    if (!sessionId) return;
    
    const docPath = `chat_logs/${sessionId}`;
    try {
      const payload = {
        sessionId,
        messages: currentMessages.map(m => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp
        })),
        createdAt,
        updatedAt: new Date().toISOString(),
        status: statusOverride || "active"
      };
      
      await setDoc(doc(db, "chat_logs", sessionId), payload);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const timestamp = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    // Save to sessionStorage and update activity timer
    sessionStorage.setItem("tpl_chat_messages", JSON.stringify(updatedMessages));
    sessionStorage.setItem("tpl_chat_last_active", Date.now().toString());

    // Persist user message to Firestore
    await persistChatLog(updatedMessages, "active");

    try {
      // Call our secure Express AI chat endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.sender === "bot" ? "assistant" : "user",
            parts: [{ text: m.text }]
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Chat assistant endpoint responded with an error");
      }

      const data = await response.json();
      const botReplyText = data.reply;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      setIsTyping(false);

      // Save to sessionStorage and update activity timer
      sessionStorage.setItem("tpl_chat_messages", JSON.stringify(finalMessages));
      sessionStorage.setItem("tpl_chat_last_active", Date.now().toString());

      // Persist bot reply to Firestore
      await persistChatLog(finalMessages, "active");

    } catch (err) {
      console.error("Failed to query live assistant chat backend:", err);
      
      // Graceful fallback to guarantee live assistant always replies without failing
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: "bot",
        text: "Thank you for reaching out. A Turkmenistan Post logistics representative has been alerted and will join shortly. For immediate assistance with pricing, quotes, or tracking queries, please contact our support team directly via support@tpl-logistics.gov.tm.",
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, fallbackMsg];
      setMessages(finalMessages);
      setIsTyping(false);

      sessionStorage.setItem("tpl_chat_messages", JSON.stringify(finalMessages));
      sessionStorage.setItem("tpl_chat_last_active", Date.now().toString());
      await persistChatLog(finalMessages, "active");
    }
  };

  const handlePresetClick = (keyword: string) => {
    let text = "";
    if (keyword === "tracking") {
      text = "How can I track my parcel?";
    } else if (keyword === "pricing") {
      text = "Can you give me a price quote or tariff rates?";
    } else if (keyword === "booking") {
      text = "How do online cargo bookings work?";
    } else if (keyword === "branches") {
      text = "Where are your headquarters and branch offices located?";
    } else if (keyword === "customs") {
      text = "What customs clearance services do you offer?";
    } else {
      text = `Tell me about ${keyword}`;
    }
    handleSend(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-80 sm:w-96 h-[500px] bg-white rounded-3xl border border-gray-150 shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-black p-4 flex items-center justify-between border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center border border-gold-400/20">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">TPL Live Assistance</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-neutral-400 font-medium">Logistics Agents Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 max-w-[85%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.sender === "user" ? "bg-neutral-800 text-white" : "bg-gold-500 text-black"
                    }`}
                  >
                    {m.sender === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-black text-white rounded-tr-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-xs whitespace-pre-wrap"
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 text-right font-mono ${
                        m.sender === "user" ? "text-neutral-400" : "text-gray-400"
                      }`}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 max-w-[80%] mr-auto items-center">
                  <div className="w-6 h-6 rounded-full bg-gold-500 text-black flex items-center justify-center">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-3.5 py-2 shadow-xs">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="px-4 py-2 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => handlePresetClick("tracking")}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gold-500 hover:text-black rounded-full text-[10px] text-gray-600 font-bold transition-all cursor-pointer"
              >
                Track Parcel
              </button>
              <button
                onClick={() => handlePresetClick("pricing")}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gold-500 hover:text-black rounded-full text-[10px] text-gray-600 font-bold transition-all cursor-pointer"
              >
                Shipping Pricing
              </button>
              <button
                onClick={() => handlePresetClick("booking")}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gold-500 hover:text-black rounded-full text-[10px] text-gray-600 font-bold transition-all cursor-pointer"
              >
                Book Shipment
              </button>
              <button
                onClick={() => handlePresetClick("branches")}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gold-500 hover:text-black rounded-full text-[10px] text-gray-600 font-bold transition-all cursor-pointer"
              >
                Branches
              </button>
              <button
                onClick={() => handlePresetClick("customs")}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gold-500 hover:text-black rounded-full text-[10px] text-gray-600 font-bold transition-all cursor-pointer"
              >
                Customs Duties
              </button>
            </div>

            {/* Footer Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputText);
              }}
              className="p-3 border-t border-gray-150 bg-gray-50 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about your parcel or rates..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-all text-black font-medium"
              />
              <button
                type="submit"
                className="p-2 bg-black text-gold-500 rounded-xl hover:bg-neutral-900 transition-all cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-black hover:bg-neutral-900 text-gold-500 flex items-center justify-center shadow-2xl border border-neutral-800 cursor-pointer relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              {/* Indicator dot */}
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold-500 border-2 border-black rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
