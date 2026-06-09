import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    api.get('/admin/customers').then(setCustomers).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => customers.filter((customer) => [customer.name, customer.email, customer.phone, customer.role].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())), [customers, query]);
  const toggle = async (customer) => {
    await api.patch(`/admin/customers/${customer._id}/block`, { isBlocked: !customer.isBlocked });
    load();
  };
  const promote = async (customer) => {
    if (!window.confirm('Are you sure you want to make this user an admin?')) return;
    await api.patch(`/admin/customers/${customer._id}/promote-admin`, {});
    load();
  };
  const demote = async (customer) => {
    if (!window.confirm('Are you sure you want to demote this admin to customer?')) return;
    await api.patch(`/admin/customers/${customer._id}/demote-admin`, {});
    load();
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Customers" note="View and control customer access." />
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search customer name, email or phone" />
      <DataTable loading={loading} emptyTitle="No customers found" heads={['Name', 'Phone', 'Email', 'Role', 'Modes', 'Status', 'Joined', 'Actions']} rows={filtered.map((customer) => (
        <tr key={customer._id} className="border-t border-slate-100">
          <td className="px-4 py-4 font-black">{customer.name}</td>
          <td className="px-4 py-4">{customer.phone || '-'}</td>
          <td className="px-4 py-4">{customer.email || '-'}</td>
          <td className="px-4 py-4 font-black">{customer.role}</td>
          <td className="px-4 py-4">{customer.availableModes?.join(', ') || 'customer'}</td>
          <td className="px-4 py-4"><StatusBadge value={customer.isBlocked ? 'Blocked' : 'Active'} /></td>
          <td className="px-4 py-4">{new Date(customer.createdAt).toLocaleDateString('en-IN')}</td>
          <td className="px-4 py-4"><div className="flex flex-wrap gap-3"><button onClick={() => toggle(customer)} className="font-black text-wine">{customer.isBlocked ? 'Unblock' : 'Block'}</button>{customer.role === 'admin' ? <button onClick={() => demote(customer)} className="font-black text-rose">Demote</button> : <button onClick={() => promote(customer)} className="font-black text-emerald-700">Promote</button>}</div></td>
        </tr>
      ))} />
    </section>
  );
}
