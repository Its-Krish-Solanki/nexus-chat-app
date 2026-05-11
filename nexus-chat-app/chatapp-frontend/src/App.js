import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatRoom from './components/ChatRoom';
import { fetchRooms, createRoom } from './utils/api';
import './App.css';

export default function App() {
  const [username, setUsername] = useState(() => sessionStorage.getItem('chat_username') || '');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');

  useEffect(() => {
    if (!username) return;
    fetchRooms().then(setRooms).catch(() => {});
  }, [username]);

  const handleLogin = (name) => {
    sessionStorage.setItem('chat_username', name);
    setUsername(name);
  };

  const handleJoin = (room) => setCurrentRoom(room);

  const handleCreateRoom = async (name) => {
    await createRoom(name);
    const updated = await fetchRooms();
    setRooms(updated);
    setCurrentRoom(name);
  };

  if (!username) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-layout">
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        username={username}
        onJoin={handleJoin}
        onCreateRoom={handleCreateRoom}
      />
      <ChatRoom room={currentRoom} username={username} />
    </div>
  );
}
