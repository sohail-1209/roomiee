// XiayokiChatbot — Floating AI assistant for Quikden
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Send, ArrowUpRight, Minimize2 } from 'lucide-react';
import { xiayokiAPI } from '../../services/endpoints';
import './XiayokiChatbot.css';

const QUICK_ACTION_KEYS = [
  'whatIsQuikden',
  'howToSearch',
  'howToList',
  'howChatWork',
];

const GREETING_KEY = 'xiayokiGreeting';

export default function XiayokiChatbot() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dragging functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false
  });

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragInfo.current.isDragging = true;
    dragInfo.current.startX = clientX - dragInfo.current.offsetX;
    dragInfo.current.startY = clientY - dragInfo.current.offsetY;
    dragInfo.current.moved = false;
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragInfo.current.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragInfo.current.startX;
      const dy = clientY - dragInfo.current.startY;

      const dist = Math.sqrt(
        Math.pow(dx - dragInfo.current.offsetX, 2) +
        Math.pow(dy - dragInfo.current.offsetY, 2)
      );
      if (dist > 5) {
        dragInfo.current.moved = true;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const minX = -viewportWidth + 80;
      const maxX = 20;
      const minY = -viewportHeight + 80;
      const maxY = 20;

      const constrainedX = Math.max(minX, Math.min(maxX, dx));
      const constrainedY = Math.max(minY, Math.min(maxY, dy));

      dragInfo.current.offsetX = constrainedX;
      dragInfo.current.offsetY = constrainedY;
      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handlePointerUp = () => {
      dragInfo.current.isDragging = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    setMessages([{
      role: 'bot',
      content: t(GREETING_KEY),
      actions: QUICK_ACTION_KEYS.map((key) => ({
        label: t(key),
        to: null,
        sendKey: key,
      })),
    }]);
  }, [t]);

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
          content: t('xiayokiError'),
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

  const handleActionClick = (action) => {
    if (action.sendKey) {
      handleSend(t(action.sendKey));
    } else if (action.to) {
      navigate(action.to);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="xiayoki-overlay" onClick={() => setIsOpen(false)} />}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="xiayoki-chat-window"
          style={{
            '--drag-x': `${position.x}px`,
            '--drag-y': `${position.y}px`
          }}
        >
          {/* Header */}
          <div className="xiayoki-header">
            <div className="xiayoki-header-avatar">
              <img src="/xiayoki-bot.svg" alt="Xiayoki" className="w-full h-full" />
            </div>
            <div className="xiayoki-header-info">
              <div className="xiayoki-header-name">{t('xiayoki')}</div>
              <div className="xiayoki-header-status">
                <span className="xiayoki-online-dot" />
                {t('online')}
              </div>
            </div>
            <div className="xiayoki-header-actions">
              <button
                className="xiayoki-header-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <Minimize2 size={15} />
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
                <div className="xiayoki-msg-bubble">{msg.content}</div>
                {msg.actions?.length > 0 && (
                  <div className="xiayoki-actions">
                    {msg.actions.map((action, j) => (
                      <button
                        key={j}
                        className="xiayoki-action-btn"
                        onClick={() => handleActionClick(action)}
                      >
                        {action.label}
                        {action.to && <ArrowUpRight size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="xiayoki-typing">
                <div className="xiayoki-typing-dots">
                  <div className="xiayoki-typing-dot" />
                  <div className="xiayoki-typing-dot" />
                  <div className="xiayoki-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="xiayoki-input-area">
            <input
              ref={inputRef}
              type="text"
              className="xiayoki-input"
              placeholder={t('askXiayoki')}
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
        <div
          className="xiayoki-tooltip"
          style={{
            '--drag-x': `${position.x}px`,
            '--drag-y': `${position.y}px`
          }}
        >
          {t('askAnything')}
        </div>
      )}

      {/* FAB */}
      <button
        className="xiayoki-fab"
        style={{
          '--drag-x': `${position.x}px`,
          '--drag-y': `${position.y}px`,
          cursor: dragInfo.current.isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onClick={(e) => {
          if (dragInfo.current.moved) return;
          setIsOpen((v) => !v);
          setShowTooltip(false);
        }}
        aria-label={isOpen ? 'Close Xiayoki chat' : 'Open Xiayoki chat'}
      >
        {isOpen ? <X size={20} /> : <img src="/xiayoki-bot.svg" alt="Xiayoki" className="w-7 h-7" />}
      </button>
    </>
  );
}
