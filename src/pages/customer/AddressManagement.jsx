import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, FieldLabel, Select, TextInput } from '../../components/ui';
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
      <h1 className="page-title mb-5 md:mb-6 md:text-3xl">My Addresses</h1>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address._id}>
              <CardContent className="flex justify-between gap-3 p-4 md:p-5">
                <div className="min-w-0">
                  <p className="label-text text-charcoal">{address.fullName}</p>
                  <p className="body-text mt-1 text-slate-600">{address.mobile || address.phone}</p>
                  <p className="body-text mt-2 text-slate-600">{address.houseNo || address.houseNumber}, {address.area}, {address.city}, {address.state} - {address.pincode}</p>
                  {address.isDefault && <Badge className="mt-3">Default</Badge>}
                </div>
                <div className="grid shrink-0 gap-2">
                  <Button onClick={() => edit(address)} variant="ghost" size="sm" className="justify-start px-0 text-wine">Edit</Button>
                  <Button onClick={() => setDefault(address)} variant="ghost" size="sm" className="justify-start px-0 text-emerald-700">Default</Button>
                  <Button onClick={() => remove(address)} variant="ghost" size="sm" className="justify-start px-0 text-rose">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <AddressForm form={form} setForm={setForm} onSubmit={save} message={message} editing={!!editingId} />
      </div>
    </section>
  );
}

export function AddressForm({ form, setForm, onSubmit, message, editing }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <Card as="form" onSubmit={onSubmit}>
      <CardHeader>
        <CardTitle className="text-xl">{editing ? 'Update Address' : 'Add New Address'}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
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
        ].map(([field, label]) => (
          <div key={field} className="space-y-2">
            <FieldLabel>{label}</FieldLabel>
            <TextInput value={form[field] || ''} onChange={(event) => update(field, event.target.value)} placeholder={label} />
          </div>
        ))}
        <div className="space-y-2">
          <FieldLabel>Address Type</FieldLabel>
          <Select value={form.addressType} onChange={(event) => update('addressType', event.target.value)}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </Select>
        </div>
        <label className="label-text flex items-center gap-2 self-end">
          <input type="checkbox" checked={form.isDefault} onChange={(event) => update('isDefault', event.target.checked)} className="accent-rose" />
          Set as default
        </label>
        {message && <p className="error-text font-semibold text-rose md:col-span-2">{message}</p>}
        <Button className="md:col-span-2">{editing ? 'Update Address' : 'Add Address'}</Button>
      </CardContent>
    </Card>
  );
}
