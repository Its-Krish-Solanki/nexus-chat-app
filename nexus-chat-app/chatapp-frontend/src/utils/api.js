const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export async function fetchRooms() {
  const res = await fetch(`${BASE}/rooms/`);
  const data = await res.json();
  return data.rooms || [];
}

export async function createRoom(name) {
  const res = await fetch(`${BASE}/rooms/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function fetchMessages(room) {
  const res = await fetch(`${BASE}/rooms/${room}/messages/`);
  const data = await res.json();
  return data.messages || [];
}
