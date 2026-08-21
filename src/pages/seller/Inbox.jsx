import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function SellerInbox() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/seller/inbox')
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const open = async (conversation) => {
    try {
      const data = await api.get(`/seller/inbox/${conversation._id}`);
      setActive(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async (event) => {
    event.preventDefault();
    if (!active || !reply.trim()) return;
    try {
      const data = await api.post(`/seller/inbox/${active._id}/reply`, { body: reply });
      setMessages((current) => [...current, data.message]);
      setReply('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <PageState loading loadingLabel="Loading inbox..." />;

  return (
    <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-black">Inbox</h1>
        <p className="mt-1 text-xs font-semibold text-slate-500">Website, order and return conversations. Instagram and WhatsApp messaging are not simulated.</p>
        {error && <p className="mt-3 text-sm font-bold text-rose">{error}</p>}
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <button key={item._id} type="button" onClick={() => open(item)} className={`rounded-xl px-3 py-3 text-left text-sm font-bold ${active?._id === item._id ? 'bg-wine text-white' : 'bg-[#fbf8f4]'}`}>
              {item.subject || item.customerName || 'Conversation'}
              <span className="mt-1 block text-xs opacity-70">{item.status} · {item.channel}</span>
            </button>
          ))}
          {!items.length && <p className="text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {!active ? <p className="text-sm font-semibold text-slate-500">Select a conversation.</p> : (
          <>
            <h2 className="font-black">{active.subject}</h2>
            <div className="mt-4 grid max-h-[50vh] gap-3 overflow-y-auto">
              {messages.map((message) => (
                <div key={message._id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.authorRole === 'seller' ? 'ml-auto bg-wine text-white' : 'bg-[#fbf8f4]'}`}>
                  {message.body}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="mt-4 flex gap-3">
              <input className="h-11 flex-1 rounded-xl border px-3 font-semibold" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" />
              <button className="h-11 rounded-xl bg-wine px-5 text-sm font-black text-white" type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
