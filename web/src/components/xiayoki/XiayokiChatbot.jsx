// XiayokiChatbot — Floating AI assistant for Roomiee
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Sparkles, ArrowUpRight } from 'lucide-react';
import { xiayokiAPI } from '../../services/endpoints';
import './XiayokiChatbot.css';

const QUICK_ACTIONS = [
  'What is QuikDen?',
  'How do I search?',
  'How to list a property?',
  'How does chat work?',
];

const GREETING = {
  role: 'bot',
  content: "Hey! 👋 I'm Xiayoki, your QuikDen assistant. Ask me anything about finding rentals, listing properties, or using the app!",
  actions: [
    { label: 'Search Listings', to: '/search' },
    { label: 'Add Listing', to: '/dashboard/listings/new' },
  ],
};

export default function XiayokiChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setShowTooltip(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Show tooltip after 3s if chat not opened
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 8000);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, [isOpen]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    const userMsg = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }));

      const { data } = await xiayokiAPI.chat(msg, history);
      const botMsg = {
        role: 'bot',
        content: data.data.reply,
        actions: data.data.actions || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
          actions: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (to) => {
    navigate(to);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="xiayoki-overlay" onClick={() => setIsOpen(false)} />}

      {/* Chat Window */}
      {isOpen && (
        <div className="xiayoki-chat-window">
          {/* Header */}
          <div className="xiayoki-header">
            <div className="xiayoki-header-avatar">
              <Sparkles size={18} />
            </div>
            <div className="xiayoki-header-info">
              <div className="xiayoki-header-name">Xiayoki</div>
              <div className="xiayoki-header-status">
                <span className="xiayoki-online-dot" />
                Online
              </div>
            </div>
            <div className="xiayoki-header-actions">
              <button
                className="xiayoki-header-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="xiayoki-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`xiayoki-msg xiayoki-msg-${msg.role === 'bot' ? 'bot' : 'user'}`}
              >
                <div className="xiayoki-msg-avatar">
                  {msg.role === 'bot' ? <Sparkles size={14} /> : 'You'}
                </div>
                <div>
                  <div className="xiayoki-msg-bubble">{msg.content}</div>
                  {msg.actions?.length > 0 && (
                    <div className="xiayoki-actions">
                      {msg.actions.map((action, j) => (
                        <button
                          key={j}
                          className="xiayoki-action-btn"
                          onClick={() => handleActionClick(action.to)}
                        >
                          {action.label}
                          <ArrowUpRight size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="xiayoki-typing">
                <div className="xiayoki-msg-avatar" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)', color: 'white' }}>
                  <Sparkles size={14} />
                </div>
                <div className="xiayoki-typing-dots">
                  <div className="xiayoki-typing-dot" />
                  <div className="xiayoki-typing-dot" />
                  <div className="xiayoki-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions — show only if few messages */}
          {messages.length <= 2 && (
            <div className="xiayoki-chips">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  className="xiayoki-chip"
                  onClick={() => handleSend(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="xiayoki-input-area">
            <input
              ref={inputRef}
              type="text"
              className="xiayoki-input"
              placeholder="Ask Xiayoki..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
            />
            <button
              className="xiayoki-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="xiayoki-tooltip">Ask me anything about QuikDen !</div>
      )}

      {/* FAB */}
      <button
        className="xiayoki-fab"
        onClick={() => { setIsOpen((v) => !v); setShowTooltip(false); }}
        aria-label={isOpen ? 'Close Xiayoki chat' : 'Open Xiayoki chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
