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

  const setDefault = async (address) => {
    setMessage('');
    try {
      await api.patch(`/user/addresses/${address._id}/default`);
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const remove = async (address) => {
    setMessage('');
    try {
      await api.delete(`/user/addresses/${address._id}`);
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="container-page py-6 md:py-8">
      <h1 className="mb-5 text-2xl font-black md:mb-6 md:text-3xl">My Addresses</h1>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <div className="space-y-3">{addresses.map((address) => <div key={address._id} className="rounded-xl bg-white p-4 shadow-sm md:rounded-3xl md:p-5"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="font-black">{address.fullName}</p><p className="mt-1 text-sm font-semibold text-slate-600">{address.mobile || address.phone}</p><p className="mt-2 text-sm leading-6 text-slate-600">{address.houseNo || address.houseNumber}, {address.area}, {address.city}, {address.state} - {address.pincode}</p>{address.isDefault && <span className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-black text-wine">Default</span>}</div><div className="grid shrink-0 gap-2"><button onClick={() => edit(address)} className="text-sm font-black text-wine">Edit</button><button onClick={() => setDefault(address)} className="text-sm font-black text-emerald-700">Default</button><button onClick={() => remove(address)} className="text-sm font-black text-rose">Delete</button></div></div></div>)}</div>
        <AddressForm form={form} setForm={setForm} onSubmit={save} message={message} editing={!!editingId} />
      </div>
    </section>
  );
}

export function AddressForm({ form, setForm, onSubmit, message, editing }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2 md:rounded-3xl md:p-5">
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
