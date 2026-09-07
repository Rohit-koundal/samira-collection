import { useEffect, useState } from 'react';
import api from '../../services/api';

export const SHIPPING_DEFAULTS = { shippingProvider: 'manual', shippingPricingMode: 'fixed', shippingFreeAboveEnabled: true, shippingDefaultWeightKg: 0.5, shippingLengthCm: 30, shippingWidthCm: 25, shippingHeightCm: 5, shippingVolumetricDivisor: 5000, shippingWeightStepKg: 0.5, shippingAdditionalStepCharge: 0, shippingPickup: {}, shippingRateZones: [] };

export default function DeliverySettings({ form, update }) {
  const data = { ...SHIPPING_DEFAULTS, ...form };
  const [readiness, setReadiness] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    api.get('/admin/settings/shipping-readiness', { silent: true, cache: 'no-store' }).then(result => { if (active) { setReadiness(result.blueDart); setError(''); } }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [reload]);
  const field = (key, label, note, max = 100000) => <label className="store-settings__field" key={key}><span>{label}</span><input type="number" min="0" step="any" max={max} value={data[key]} onChange={e => update(key, e.target.value)} /><small>{note}</small></label>;
  const zones = data.shippingRateZones || [];
  const zoneChange = (index, key, value) => update('shippingRateZones', zones.map((row, i) => i === index ? { ...row, [key]: value } : row));
  return <>
    <div className="store-settings__wide"><h3>Courier connection</h3><p className="admin-note">Book parcels after packing, print their labels, then request pickup from each order.</p></div>
    <label className="store-settings__field"><span>Delivery provider</span><select value={data.shippingProvider} onChange={e => update('shippingProvider', e.target.value)}><option value="manual">Manual courier booking</option><option value="bluedart">Blue Dart</option></select><small>Blue Dart checks pickup and delivery availability before accepting checkout.</small></label>
    <div className="store-settings__tip"><div><strong>Blue Dart · {readiness?.mode || 'Connection check'}</strong><p>{error || readiness?.note || 'Checking backend connection...'}</p>{readiness?.missing?.length > 0 && <p className="admin-note">Your developer needs to complete the backend credentials. Keys are never entered in this screen.</p>}<button type="button" className="admin-table-action-link" onClick={() => setReload(n => n + 1)}>Check connection again</button></div></div>
    <label className="store-settings__field"><span>Delivery pricing</span><select value={data.shippingPricingMode} onChange={e => update('shippingPricingMode', e.target.value)}><option value="fixed">Fixed delivery charge</option><option value="weight">Destination and weight rate card</option></select><small>Your customer delivery charge. Blue Dart bills you separately at your agreed account rates.</small></label>
    <label className="store-settings__field"><span>Free delivery offer</span><select value={String(data.shippingFreeAboveEnabled)} onChange={e => update('shippingFreeAboveEnabled', e.target.value === 'true')}><option value="true">Use the free shipping minimum above</option><option value="false">Charge delivery on every order</option></select></label>
    {data.shippingPricingMode === 'weight' && <>
      {field('shippingWeightStepKg', 'Weight slab (kg)', 'The base charge covers the first slab. Further slabs are rounded up.')}
      {field('shippingAdditionalStepCharge', 'Each additional slab (INR)', 'Default surcharge outside any specific PIN zone.')}
      <div className="store-settings__wide"><h3>Destination rates</h3><p className="admin-note">Enter agreed customer-facing rates. A longer PIN prefix takes priority. Unmatched PIN codes use the default delivery charge above.</p>{zones.map((row, index) => <div className="grid gap-3 rounded-xl border p-3 mt-3 sm:grid-cols-4" key={index}><label>PIN prefix<input aria-label={`PIN prefix ${index + 1}`} value={row.prefix} maxLength={6} inputMode="numeric" onChange={e => zoneChange(index, 'prefix', e.target.value)} className="admin-field__control w-full" /></label><label>Base (INR)<input aria-label={`Base charge ${index + 1}`} type="number" min="0" value={row.baseCharge} onChange={e => zoneChange(index, 'baseCharge', e.target.value)} className="admin-field__control w-full" /></label><label>Extra slab (INR)<input aria-label={`Extra slab ${index + 1}`} type="number" min="0" value={row.additionalStepCharge} onChange={e => zoneChange(index, 'additionalStepCharge', e.target.value)} className="admin-field__control w-full" /></label><button type="button" className="admin-btn-ghost self-end" onClick={() => update('shippingRateZones', zones.filter((_, i) => i !== index))}>Remove zone</button></div>)}<button type="button" className="admin-btn-ghost mt-3" disabled={zones.length >= 200} onClick={() => update('shippingRateZones', [...zones, { prefix: '', baseCharge: '', additionalStepCharge: '' }])}>Add PIN zone</button></div>
    </>}
    <div className="store-settings__wide"><h3>Pickup address</h3><p className="admin-note">Where Blue Dart collects packed orders and returns parcels. Use the address registered on your business account.</p></div>
    {[['fullName', 'Contact name'], ['mobile', 'Mobile number'], ['houseNo', 'Building / street'], ['area', 'Area'], ['city', 'City'], ['state', 'State'], ['pincode', 'PIN code']].map(([key, label]) => <label className="store-settings__field" key={key}><span>{label}</span><input value={data.shippingPickup?.[key] || ''} maxLength={key === 'fullName' ? 30 : key === 'pincode' ? 6 : key === 'mobile' ? 10 : 120} onChange={e => update('shippingPickup', { ...data.shippingPickup, [key]: e.target.value })} /></label>)}
    <div className="store-settings__wide"><h3>Parcel defaults</h3><p className="admin-note">Checkout estimates a single parcel from unit weights and stacked item heights. Confirm the actual packed measurements when booking; this never changes a customer's agreed order total.</p></div>
    {field('shippingDefaultWeightKg', 'Default packed unit weight (kg)', 'Used when a product has no saved weight.', 1000)}
    {field('shippingLengthCm', 'Package length (cm)', 'Default outer package length.', 300)}
    {field('shippingWidthCm', 'Package width (cm)', 'Default outer package width.', 300)}
    {field('shippingHeightCm', 'Height per item (cm)', 'Multiplied by the number of items at checkout.', 300)}
    {field('shippingVolumetricDivisor', 'Volumetric divisor', 'Confirm the divisor for your Blue Dart service and account. Chargeable weight is the greater of actual and volumetric weight.')}
  </>;
}
