import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    if (name.length >= 2) onLogin(name);
  };

  return (
    <div className="login-screen">
      <div className="login-bg-grid" />
      <div className="login-card">
        <div className="login-badge">REAL-TIME CHAT</div>
        <h1 className="login-title">
          <span className="login-prompt">$</span> identify yourself
        </h1>
        <p className="login-sub">Choose a handle to enter the network.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-wrap">
            <span className="login-cursor">▋</span>
            <input
              className="login-input"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <button
            className="login-btn"
            type="submit"
            disabled={username.trim().length < 2}
          >
            CONNECT →
          </button>
        </form>
        <p className="login-hint">min 2 chars · no spaces required</p>
      </div>
    </div>
  );
}
