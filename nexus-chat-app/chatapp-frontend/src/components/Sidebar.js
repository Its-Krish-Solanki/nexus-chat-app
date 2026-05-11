import React, { useState } from 'react';
import './Sidebar.css';

const PRESET_ROOMS = ['general', 'random', 'tech', 'design', 'announcements'];

export default function Sidebar({ rooms, currentRoom, username, onJoin, onCreateRoom }) {
  const [newRoom, setNewRoom] = useState('');
  const [creating, setCreating] = useState(false);

  const allRooms = [...new Set([...PRESET_ROOMS, ...rooms.map(r => r.name)])];

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newRoom.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    setCreating(true);
    await onCreateRoom(name);
    setNewRoom('');
    setCreating(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">◈</span>
          <span className="sidebar-logo-text">NEXUS</span>
        </div>
        <div className="sidebar-user">
          <span className="sidebar-user-dot" />
          <span className="sidebar-username">{username}</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">CHANNELS</div>
        <ul className="room-list">
          {allRooms.map(name => (
            <li
              key={name}
              className={`room-item ${currentRoom === name ? 'active' : ''}`}
              onClick={() => onJoin(name)}
            >
              <span className="room-hash">#</span>
              <span className="room-name">{name}</span>
              {currentRoom === name && <span className="room-active-dot" />}
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-create">
        <form onSubmit={handleCreate} className="create-form">
          <input
            className="create-input"
            type="text"
            placeholder="+ new channel"
            value={newRoom}
            onChange={e => setNewRoom(e.target.value)}
            maxLength={30}
            autoComplete="off"
            spellCheck="false"
          />
          {newRoom.trim() && (
            <button className="create-btn" type="submit" disabled={creating}>
              {creating ? '…' : '↵'}
            </button>
          )}
        </form>
      </div>
    </aside>
  );
}
