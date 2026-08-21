import { useEffect, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import DataTable from '../../components/admin/DataTable';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import { Select } from '../../components/ui/Field';
import api from '../../services/api';

const statuses = ['NEW', 'READ', 'REPLIED', 'CLOSED'];

export default function Support() {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/contact').then((items) => {
      setMessages(items || []);
      setMessage('');
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = messages.filter((item) => {
    const haystack = [item.name, item.email, item.subject, item.message].join(' ').toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!status || item.status === status);
  });

  const update = async (item, nextStatus) => {
    try {
      await api.put(`/admin/contact/${item._id}/status`, { status: nextStatus });
      setMessages((current) => current.map((entry) => (entry._id === item._id ? { ...entry, status: nextStatus } : entry)));
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Support inbox" note="Messages submitted from the contact form." />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search name, email or message">
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full px-3 sm:w-44">
          <option value="">All Status</option>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No messages yet" heads={['From', 'Subject', 'Message', 'Status', 'Update']} rows={filtered.map((item) => (
        <tr key={item._id} className="border-t border-slate-100">
          <td className="px-4 py-4">
            <b>{item.name}</b>
            <div className="text-xs text-slate-500">{item.email}{item.phone ? ` · ${item.phone}` : ''}</div>
          </td>
          <td className="px-4 py-4">{item.subject || 'Website enquiry'}</td>
          <td className="max-w-sm px-4 py-4 text-sm">{item.message}</td>
          <td className="px-4 py-4"><StatusBadge value={item.status} /></td>
          <td className="px-4 py-4">
            <Select value={item.status} onChange={(event) => update(item, event.target.value)} className="h-10 w-36 rounded-lg px-2">
              {statuses.map((value) => <option key={value}>{value}</option>)}
            </Select>
          </td>
        </tr>
      ))} />
    </section>
  );
}
