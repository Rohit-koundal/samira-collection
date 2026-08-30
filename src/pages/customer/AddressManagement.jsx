import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, CardContent, CardTitle, Select, TextInput } from '../../components/ui';
import { ArrowLeft, ChevronRight, Plus, Home, BriefcaseBusiness, MapPinned, UserRound, Phone, Building2 } from 'lucide-react';
import api from '../../services/api';
import { districtsForState, INDIAN_STATES, pincodeForDistrict } from '../../data/indiaLocations';
import { lookupPincode } from '../../utils/indiaPincode';
import { digitsOnly, isValidIndianMobile, PHONE_VALIDATION_MESSAGE } from '../../utils/phoneInput';

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
    if (!isValidIndianMobile(form.mobile)) {
      setMessage(PHONE_VALIDATION_MESSAGE);
      return;
    }
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
    <section className={`${isEditor ? 'min-h-[100dvh]' : 'min-h-0'} bg-[#fffaf2] pb-4 md:py-6`}>
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
  const districts = useMemo(() => districtsForState(form.state), [form.state]);
  const lookupToken = useRef(0);
  const autoPinRef = useRef('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const selectState = (state) => {
    setForm((current) => {
      const nextDistricts = districtsForState(state);
      const city = nextDistricts.includes(current.city) ? current.city : '';
      return { ...current, state, city, pincode: city ? current.pincode : '' };
    });
  };

  const selectDistrict = (district) => {
    const pin = pincodeForDistrict(form.state, district);
    autoPinRef.current = pin;
    setForm((current) => ({ ...current, city: district, pincode: pin || current.pincode }));
  };

  useEffect(() => {
    const pin = String(form.pincode || '').replace(/\D/g, '');
    if (pin.length !== 6 || pin === autoPinRef.current) return undefined;
    const token = ++lookupToken.current;
    const timer = window.setTimeout(() => {
      lookupPincode(pin).then((match) => {
        if (!match || token !== lookupToken.current) return;
        autoPinRef.current = pin;
        setForm((current) => ({
          ...current,
          pincode: pin,
          state: match.state || current.state,
          city: match.district || match.city || current.city,
        }));
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [form.pincode, setForm]);

  return (
    <Card as="form" onSubmit={onSubmit} className="overflow-hidden border-0 bg-[#fffaf2] shadow-none">
      <div className="flex items-center justify-between border-b border-[#ead8cb] bg-[#fffaf2] px-2 py-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="grid h-10 w-10 place-items-center rounded-full text-[#6d1f34] hover:bg-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <CardTitle className="flex-1 text-center text-[16px] font-semibold text-[#6d1f34]">
          {editing ? 'Update Address' : 'Add New Address'}
        </CardTitle>
        <div className="h-10 w-10" />
      </div>

      <CardContent className="space-y-6 px-4 py-5 pb-5">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b88945]">Contact details</p>
          <LabeledField icon={UserRound} label="Full name">
            <TextInput value={form.fullName || ''} onChange={(event) => update('fullName', event.target.value)} placeholder="Name as on the parcel" disabled={saving} required />
          </LabeledField>
          <LabeledField icon={Phone} label="Mobile number">
            <TextInput
              value={form.mobile || ''}
              onChange={(event) => update('mobile', digitsOnly(event.target.value, 10))}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              pattern="[0-9]*"
              disabled={saving}
              required
            />
          </LabeledField>
          {form.mobile && !isValidIndianMobile(form.mobile) ? (
            <p className="text-[11px] font-medium text-[#c81e4a]">{PHONE_VALIDATION_MESSAGE}</p>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-[#ead8cb] pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b88945]">Delivery location</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField icon={Building2} label="State">
              <Select value={form.state || ''} onChange={(event) => selectState(event.target.value)} disabled={saving} required>
                <option value="">Select state</option>
                {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                {form.state && !INDIAN_STATES.includes(form.state) ? <option value={form.state}>{form.state}</option> : null}
              </Select>
            </LabeledField>
            <LabeledField icon={MapPinned} label="District">
              <Select value={form.city || ''} onChange={(event) => selectDistrict(event.target.value)} disabled={saving || !form.state} required>
                <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                {districts.map((district) => <option key={district} value={district}>{district}</option>)}
                {form.city && !districts.includes(form.city) ? <option value={form.city}>{form.city}</option> : null}
              </Select>
            </LabeledField>
          </div>
          <LabeledField icon={MapPinned} label="Pincode">
            <TextInput
              value={form.pincode || ''}
              onChange={(event) => update('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit pincode"
              inputMode="numeric"
              disabled={saving}
              required
            />
          </LabeledField>
          <p className="text-[11px] leading-5 text-slate-500">Choose a district to fill its pincode, or type a pincode to fill state and district.</p>
          <LabeledField icon={Home} label="House / flat / block">
            <TextInput value={form.houseNo || ''} onChange={(event) => update('houseNo', event.target.value)} placeholder="House no., tower or block" disabled={saving} required />
          </LabeledField>
          <LabeledField icon={MapPinned} label="Street / area">
            <TextInput value={form.area || ''} onChange={(event) => update('area', event.target.value)} placeholder="Building, street, area" disabled={saving} required />
          </LabeledField>
          <LabeledField icon={BriefcaseBusiness} label="Locality / landmark">
            <TextInput value={form.landmark || ''} onChange={(event) => update('landmark', event.target.value)} placeholder="Locality or nearby landmark" disabled={saving} />
          </LabeledField>
        </div>

        <div className="space-y-3 border-t border-[#ead8cb] pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b88945]">Address type</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'Home', label: 'Home', desc: 'Personal deliveries', icon: Home },
              { value: 'Work', label: 'Office', desc: 'Work deliveries', icon: BriefcaseBusiness },
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
                    active ? 'border-[#6d1f34] bg-white shadow-[0_0_0_1px_#6d1f34]' : 'border-[#ead8cb] bg-white'
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${active ? 'bg-[#6d1f34] text-[#fffaf2]' : 'bg-[#fffaf2] text-[#b88945]'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-[#3f2a22]">{option.label}</span>
                    <span className="block text-[11px] text-slate-500">{option.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-[#ead8cb] bg-white px-3 py-3 text-[12px] text-slate-600">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => update('isDefault', event.target.checked)} className="accent-[#6d1f34]" disabled={saving} />
            Make this my default address
          </label>
        </div>

        {message && <p className="error-text font-semibold text-[#6d1f34]">{message}</p>}

        <div className="grid grid-cols-2 gap-3 border-t border-[#ead8cb] pt-5">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving} className="h-11 rounded-xl border border-[#ead8cb] bg-white text-[#3f2a22]">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="h-11 rounded-xl bg-[#6d1f34] text-[#fffaf2] hover:bg-[#5a192b]">
            {saving ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LabeledField({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-[#6d1f34]">
        <Icon className="h-3.5 w-3.5 text-[#b88945]" />
        {label}
      </span>
      <div className="rounded-xl border border-[#ead8cb] bg-white px-3 py-1 [&_input]:border-0 [&_input]:px-0 [&_input]:shadow-none [&_input:focus]:ring-0 [&_select]:border-0 [&_select]:px-0 [&_select]:shadow-none [&_select:focus]:ring-0">
        {children}
      </div>
    </label>
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
