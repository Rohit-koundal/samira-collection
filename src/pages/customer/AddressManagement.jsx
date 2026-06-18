import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardTitle, Select, TextInput } from '../../components/ui';
import { ArrowLeft, ChevronRight, Plus, Home, BriefcaseBusiness, MapPinned, UserRound, Phone, Building2 } from 'lucide-react';
import api from '../../services/api';

const emptyAddress = {
  fullName: '',
  mobile: '',
  alternateMobile: '',
  pincode: '',
  state: '',
  city: '',
  houseNo: '',
  area: '',
  landmark: '',
  addressType: 'Home',
  isDefault: false,
};

export default function AddressManagement({ route = '/profile/addresses', navigate }) {
  const routePath = route.split('?')[0];
  const searchParams = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);
  const editorId = searchParams.get('id') || '';
  const isEditor = routePath === '/profile/addresses/new' || routePath === '/profile/addresses/edit';

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get('/user/addresses')
      .then((data) => {
        setAddresses(Array.isArray(data) ? data : []);
      })
      .catch((error) => setMessage(error.message));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isEditor) return;
    if (routePath === '/profile/addresses/new') {
      setForm(emptyAddress);
      setMessage('');
      return;
    }

    const selected = addresses.find((item) => item._id === editorId);
    if (selected) {
      setForm({
        ...emptyAddress,
        ...selected,
        mobile: selected.mobile || selected.phone,
        houseNo: selected.houseNo || selected.houseNumber,
      });
      setMessage('');
    }
  }, [addresses, editorId, isEditor, routePath]);

  const sortedAddresses = useMemo(() => {
    const list = [...addresses];
    return list.sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
  }, [addresses]);

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      if (routePath === '/profile/addresses/edit' && editorId) {
        await api.put(`/user/addresses/${editorId}`, form);
      } else {
        await api.post('/user/addresses', form);
      }
      load();
      navigate?.('/profile/addresses');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (address) => {
    navigate?.(`/profile/addresses/edit?id=${address._id}`);
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

  const openNewAddress = () => {
    navigate?.('/profile/addresses/new');
  };

  const goBack = () => navigate?.('/profile/addresses');

  return (
    <section className={`${isEditor ? 'min-h-[100dvh]' : 'min-h-0'} bg-[#f6f7fb] pb-4 md:py-6`}>
      <div className="mx-auto w-full max-w-[470px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)] md:max-w-none md:bg-transparent md:shadow-none">
        {isEditor ? (
          <div className="bg-white">
            <AddressForm
              form={form}
              setForm={setForm}
              onSubmit={save}
              message={message}
              editing={routePath === '/profile/addresses/edit'}
              onCancel={goBack}
              saving={saving}
            />
          </div>
        ) : (
          <div className="bg-white">
            <button
              type="button"
              onClick={openNewAddress}
              className="flex w-full items-center gap-2 border-b border-slate-200 px-4 py-4 text-left text-[15px] font-bold uppercase tracking-[0.02em] text-[#4a67d6]"
            >
              <Plus className="h-4 w-4" />
              Add New Address
            </button>

            <div className="bg-[#f6f6f8] px-4 py-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-black">Default Address</p>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {sortedAddresses.length ? (
                sortedAddresses.map((address) => (
                  <AddressCard key={address._id} address={address} onEdit={edit} onRemove={remove} />
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[13px] text-slate-400">
                  No saved addresses yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AddressCard({ address, onEdit, onRemove }) {
  const formattedLines = buildAddressLines(address);
  const isDefault = !!address.isDefault;

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#2f3851]">{address.fullName}</h2>
            {isDefault && (
              <Badge className="rounded-full bg-[#f3f4f6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Home
              </Badge>
            )}
          </div>
          <div className="mt-3 space-y-0.5 text-[13px] leading-[1.35] text-slate-600">
            {formattedLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-slate-600">Mobile: {address.mobile || address.phone}</p>
        </div>
        {!isDefault && <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />}
      </div>

      <div className="mt-4 grid grid-cols-2 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="h-12 border-r border-slate-200 text-[13px] font-bold uppercase tracking-[0.06em] text-[#4a67d6]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove(address)}
          className="h-12 text-[13px] font-bold uppercase tracking-[0.06em] text-[#4a67d6]"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function AddressForm({ form, setForm, onSubmit, message, editing, onCancel, saving = false }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <Card as="form" onSubmit={onSubmit} className="overflow-hidden border-0 bg-[#fffafa] shadow-none">
      <div className="flex items-center justify-between border-b border-[#f1d9df] bg-white px-1 py-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <CardTitle className="flex-1 text-center text-[15px] font-semibold text-[#3f465c]">
          {editing ? 'Update Address' : 'Add New Address'}
        </CardTitle>
        <div className="h-10 w-10" />
      </div>

      <CardContent className="space-y-5 px-4 py-4 pb-4">
        <div className="space-y-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-500">Contact Details</p>
          <div className="grid gap-3">
            <FieldRow icon={UserRound}>
              <TextInput value={form.fullName || ''} onChange={(event) => update('fullName', event.target.value)} placeholder="Full Name *" disabled={saving} />
            </FieldRow>
            <FieldRow icon={Phone}>
              <TextInput value={form.mobile || ''} onChange={(event) => update('mobile', event.target.value)} placeholder="Mobile Number *" inputMode="tel" disabled={saving} />
            </FieldRow>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-500">Address Details</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow icon={MapPinned}>
              <TextInput value={form.pincode || ''} onChange={(event) => update('pincode', event.target.value)} placeholder="Pincode *" disabled={saving} />
            </FieldRow>
            <FieldRow icon={Building2}>
              <Select value={form.state || ''} onChange={(event) => update('state', event.target.value)} disabled={saving}>
                <option value="">State *</option>
                <option>Himachal Pradesh</option>
                <option>Punjab</option>
                <option>Haryana</option>
                <option>Uttar Pradesh</option>
                <option>Delhi</option>
              </Select>
            </FieldRow>
          </div>
          <FieldRow icon={Home}>
            <TextInput value={form.houseNo || ''} onChange={(event) => update('houseNo', event.target.value)} placeholder="House No. / Tower / Block *" disabled={saving} />
          </FieldRow>
          <FieldRow icon={MapPinned}>
            <TextInput value={form.area || ''} onChange={(event) => update('area', event.target.value)} placeholder="Address (Building, Street, Area) *" disabled={saving} />
          </FieldRow>
          <FieldRow icon={BriefcaseBusiness}>
            <TextInput value={form.landmark || ''} onChange={(event) => update('landmark', event.target.value)} placeholder="Locality / Town *" disabled={saving} />
          </FieldRow>
          <FieldRow icon={Building2}>
            <TextInput value={form.city || ''} onChange={(event) => update('city', event.target.value)} placeholder="City / District *" disabled={saving} />
          </FieldRow>
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-500">Address Type</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'Home', label: 'Home', desc: 'For personal use', icon: Home },
              { value: 'Work', label: 'Office', desc: 'For work use', icon: BriefcaseBusiness },
            ].map((option) => {
              const active = form.addressType === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update('addressType', option.value)}
                  disabled={saving}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    active ? 'border-[#ff5f86] bg-[#fff0f4]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${active ? 'bg-[#ff5f86] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-[#2f3851]">{option.label}</span>
                    <span className="block text-[11px] text-slate-500">{option.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[12px] text-slate-600">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => update('isDefault', event.target.checked)} className="accent-rose" disabled={saving} />
            Make this my default address
          </label>
        </div>

        {message && <p className="error-text font-semibold text-rose">{message}</p>}

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving} className="h-11 rounded-xl border border-slate-300 bg-white text-[#3f465c]">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="h-11 rounded-xl bg-[#ff5f86] text-white hover:bg-[#ff4c7b]">
            {saving ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({ icon: Icon, children }) {
  return (
    <div className="flex items-stretch gap-2 rounded-xl border border-[#ead3da] bg-white px-3 py-2 shadow-[0_1px_0_rgba(255,95,134,0.03)]">
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#ff5f86]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 [&_input]:border-0 [&_input]:px-0 [&_input]:shadow-none [&_input:focus]:ring-0 [&_select]:border-0 [&_select]:px-0 [&_select]:shadow-none [&_select:focus]:ring-0">
        {children}
      </div>
    </div>
  );
}

function buildAddressLines(address) {
  const lines = [];
  if (address.houseNo || address.houseNumber) lines.push(address.houseNo || address.houseNumber);
  if (address.area) lines.push(address.area);
  const cityLine = [address.city, address.pincode ? `- ${address.pincode}` : ''].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  if (address.state) lines.push(address.state);
  return lines;
}
