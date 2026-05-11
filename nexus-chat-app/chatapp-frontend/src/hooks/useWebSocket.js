import { useEffect, useRef, useCallback, useState } from 'react';

const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export function useWebSocket(room, username, onMessage) {
  const ws = useRef(null);
  const [status, setStatus] = useState('disconnected'); // connecting | connected | disconnected
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!room || !username) return;

    setStatus('connecting');
    const url = `${WS_BASE}/ws/chat/${room}/?username=${encodeURIComponent(username)}`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => setStatus('connected');
    ws.current.onclose = () => setStatus('disconnected');
    ws.current.onerror = () => setStatus('disconnected');
    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessageRef.current(data);
      } catch {}
    };

    return () => {
      ws.current?.close();
    };
  }, [room, username]);

  const send = useCallback((payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendMessage = useCallback((text) => {
    send({ type: 'message', text });
  }, [send]);

  const sendTyping = useCallback((is_typing) => {
    send({ type: 'typing', is_typing });
  }, [send]);

  return { status, sendMessage, sendTyping };
}
