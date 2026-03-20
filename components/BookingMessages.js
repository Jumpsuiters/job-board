'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

export default function BookingMessages({ bookingId }) {
  const { user, supabase } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [bookingId]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(name)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);

    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: user.id,
      body: body.trim(),
    });

    setBody('');
    setSending(false);
    fetchMessages();
  }

  return (
    <div className="messages-section">
      <h3>Messages</h3>
      <div className="message-thread">
        {messages.length === 0 && (
          <p className="description" style={{ marginTop: '0.5rem' }}>No messages yet. Start the conversation.</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`message-bubble ${m.sender_id === user?.id ? 'message-mine' : ''}`}>
            <div className="message-meta">
              <strong>{m.profiles?.name || 'Someone'}</strong>
              <span>{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            <p>{m.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="message-form">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !body.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
