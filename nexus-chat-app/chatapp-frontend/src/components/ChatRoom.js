import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './ChatRoom.css';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Message({ msg, isMine }) {
  return (
    <div className={`msg ${isMine ? 'msg-mine' : 'msg-other'}`}>
      <div className="msg-meta">
        <span className={`msg-author ${isMine ? 'mine' : ''}`}>
          {isMine ? 'you' : msg.username}
        </span>
        <span className="msg-time">{formatTime(msg.timestamp)}</span>
      </div>
      <div className={`msg-bubble ${isMine ? 'bubble-mine' : 'bubble-other'}`}>
        {msg.text}
      </div>
    </div>
  );
}

export default function ChatRoom({ room, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [online, setOnline] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'history':
        setMessages(data.messages || []);
        break;
      case 'message':
        setMessages(prev => [...prev, data.message]);
        break;
      case 'presence':
        setOnline(data.online || []);
        break;
      case 'typing':
        setTypingUsers(prev => {
          const others = prev.filter(u => u !== data.username);
          return data.is_typing ? [...others, data.username] : others;
        });
        break;
      default: break;
    }
  }, []);

  const { status, sendMessage, sendTyping } = useWebSocket(room, username, handleWsMessage);

  useEffect(() => { setWsStatus(status); }, [status]);
  useEffect(() => {
    setMessages([]);
    setOnline([]);
    setTypingUsers([]);
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput('');
    clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    sendTyping(false);
  };

  const statusColor = wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'connecting' ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="chatroom">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-room-hash">#</span>
          <span className="chat-room-name">{room}</span>
        </div>
        <div className="chat-header-right">
          <span className="online-count">
            <span className="online-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            {wsStatus === 'connected'
              ? `${online.length} online`
              : wsStatus === 'connecting' ? 'connecting…' : 'disconnected'}
          </span>
          <div className="online-avatars">
            {online.slice(0, 5).map(u => (
              <div
                key={u}
                className="online-avatar"
                title={u}
                style={{ background: stringToColor(u) }}
              >
                {u[0].toUpperCase()}
              </div>
            ))}
            {online.length > 5 && (
              <div className="online-avatar online-avatar-more">+{online.length - 5}</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">◈</span>
            <p>No messages yet. Say something!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={msg._id || i} msg={msg} isMine={msg.username === username} />
        ))}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots"><span /><span /><span /></span>
            <span className="typing-text">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="chat-input-wrap">
          <span className="chat-input-prefix">#</span>
          <input
            className="chat-input"
            value={input}
            onChange={handleInput}
            placeholder={`Message #${room}`}
            autoComplete="off"
            spellCheck="false"
            disabled={wsStatus !== 'connected'}
          />
          <button
            className="send-btn"
            type="submit"
            disabled={!input.trim() || wsStatus !== 'connected'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function stringToColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const colors = ['#58a6ff','#3fb950','#bc8cff','#ff7b72','#d29922','#79c0ff'];
  return colors[Math.abs(h) % colors.length];
}
