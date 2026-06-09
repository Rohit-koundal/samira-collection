import { useEffect, useState } from 'react';
import api from '../../services/api';

const emptyAddress = { fullName: '', mobile: '', alternateMobile: '', pincode: '', state: '', city: '', houseNo: '', area: '', landmark: '', addressType: 'Home', isDefault: false };

export default function AddressManagement() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const load = () => api.get('/user/addresses').then(setAddresses).catch((error) => setMessage(error.message));
  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      if (editingId) await api.put(`/user/addresses/${editingId}`, form);
      else await api.post('/user/addresses', form);
      setForm(emptyAddress);
      setEditingId('');
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const edit = (address) => {
    setForm({ ...emptyAddress, ...address, mobile: address.mobile || address.phone, houseNo: address.houseNo || address.houseNumber });
    setEditingId(address._id);
  };

  return (
    <section className="container-page py-8">
      <h1 className="mb-6 text-3xl font-black">My Addresses</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">{addresses.map((address) => <div key={address._id} className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><p className="font-black">{address.fullName}</p><p className="mt-1 text-sm font-semibold text-slate-600">{address.mobile || address.phone}</p><p className="mt-2 text-sm leading-6 text-slate-600">{address.houseNo || address.houseNumber}, {address.area}, {address.city}, {address.state} - {address.pincode}</p>{address.isDefault && <span className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-black text-wine">Default</span>}</div><div className="grid gap-2"><button onClick={() => edit(address)} className="text-sm font-black text-wine">Edit</button><button onClick={() => api.patch(`/user/addresses/${address._id}/default`).then(load)} className="text-sm font-black text-emerald-700">Default</button><button onClick={() => api.delete(`/user/addresses/${address._id}`).then(load)} className="text-sm font-black text-rose">Delete</button></div></div></div>)}</div>
        <AddressForm form={form} setForm={setForm} onSubmit={save} message={message} editing={!!editingId} />
      </div>
    </section>
  );
}

export function AddressForm({ form, setForm, onSubmit, message, editing }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2">
      {[
        ['fullName', 'Full Name'],
        ['mobile', 'Mobile Number'],
        ['alternateMobile', 'Alternate Mobile'],
        ['pincode', 'Pincode'],
        ['state', 'State'],
        ['city', 'City'],
        ['houseNo', 'House / Building'],
        ['area', 'Road / Area / Colony'],
        ['landmark', 'Landmark'],
      ].map(([field, label]) => <input key={field} value={form[field] || ''} onChange={(event) => update(field, event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={label} />)}
      <select value={form.addressType} onChange={(event) => update('addressType', event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><option>Home</option><option>Work</option><option>Other</option></select>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isDefault} onChange={(event) => update('isDefault', event.target.checked)} className="accent-rose" /> Set as default</label>
      {message && <p className="text-sm font-bold text-rose md:col-span-2">{message}</p>}
      <button className="h-12 rounded-xl bg-wine text-sm font-black text-white md:col-span-2">{editing ? 'Update Address' : 'Add Address'}</button>
    </form>
  );
}
