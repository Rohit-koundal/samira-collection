import { useEffect, useState } from 'react';
import api from '../../services/api';
import { productIdOf } from '../../utils/orderActions';
import { OrderItem } from './OrderUi';

export default function ReturnRequestForm({ item, eligibility, onSubmit, busy, error, onCancel }) {
  const [form, setForm] = useState({ type: 'return', quantity: 1, reason: '', comment: '', exchangeVariantId: '', exchangeSize: '', exchangeColor: '' });
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productError, setProductError] = useState('');
  const [retry, setRetry] = useState(0);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (form.type !== 'exchange') return undefined;
    let active = true;
    setLoading(true); setProductError(''); setProduct(null);
    api.get(`/products/${productIdOf(item)}`).then((data) => {
      if (active) { setProduct(data); setForm((current) => ({ ...current, exchangeVariantId: '', exchangeSize: !data.sizes?.length || data.sizes.includes(item.size) ? item.size || '' : '', exchangeColor: !data.colors?.length || data.colors.includes(item.color) ? item.color || '' : '' })); }
    }).catch((err) => { if (active) setProductError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [form.type, item, retry]);
  const variants = (product?.variants || []).filter((variant) => variant.isActive !== false);
  const exchangeAvailable = product && product.isActive !== false && !product.isArchived
    && (variants.length ? variants.some((variant) => Number(variant.stock) >= form.quantity) : Number(product.stock) >= form.quantity);
  const sizes = product?.sizes?.length ? product.sizes : [item.size].filter(Boolean);
  const colors = product?.colors?.length ? product.colors : [item.color].filter(Boolean);
  const selectedVariant = variants.find((variant) => String(variant._id) === form.exchangeVariantId);
  const selectionAvailable = !variants.length || (selectedVariant && Number(selectedVariant.stock) >= form.quantity);
  const submit = (event) => {
    event.preventDefault();
    const variant = variants.find((entry) => String(entry._id) === form.exchangeVariantId);
    onSubmit({ ...form, ...(variant ? { exchangeSize: variant.size, exchangeColor: variant.color } : {}), quantity: Number(form.quantity) });
  };
  return <form className="sc-order-form" onSubmit={submit}>
    <OrderItem item={item} />
    <fieldset disabled={busy}>
      <legend>How can we help?</legend>
      <div className="sc-order-form__choices"><label><input type="radio" name="requestType" checked={form.type === 'return'} onChange={() => update('type', 'return')} />Return</label><label><input type="radio" name="requestType" checked={form.type === 'exchange'} onChange={() => update('type', 'exchange')} />Exchange</label></div>
      <label>Quantity<select value={form.quantity} onChange={(event) => update('quantity', Number(event.target.value))}>{Array.from({ length: Math.min(20, eligibility.remainingQuantity) }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
      <label>Reason<select required value={form.reason} onChange={(event) => update('reason', event.target.value)}><option value="">Select a reason</option>{['Size or fit issue', 'Damaged or defective item', 'Wrong item received', 'Different from description', 'Quality not as expected', 'Other'].map((reason) => <option key={reason}>{reason}</option>)}</select></label>
      {form.type === 'exchange' && <div className="sc-order-form__exchange">
        {loading ? <p role="status">Checking exchange availability…</p> : productError ? <div role="alert"><p>{productError}</p><button type="button" className="sc-orders__text" onClick={() => setRetry((value) => value + 1)}>Retry availability</button></div>
          : !exchangeAvailable ? <p role="status">An exchange is currently out of stock. You can request a return instead.</p>
            : variants.length ? <label>Replacement size / colour<select required value={form.exchangeVariantId} onChange={(event) => update('exchangeVariantId', event.target.value)}><option value="">Select replacement</option>{variants.map((variant) => <option key={variant._id} value={variant._id} disabled={Number(variant.stock) < form.quantity}>{[variant.size, variant.color].filter(Boolean).join(' / ')}{Number(variant.stock) < form.quantity ? ' — out of stock' : ''}</option>)}</select></label>
              : <><label>Replacement size<select required={sizes.length > 0} value={form.exchangeSize} onChange={(event) => update('exchangeSize', event.target.value)}><option value="">Select size</option>{sizes.map((size) => <option key={size}>{size}</option>)}</select></label><label>Replacement colour<select required={colors.length > 0} value={form.exchangeColor} onChange={(event) => update('exchangeColor', event.target.value)}><option value="">Select colour</option>{colors.map((color) => <option key={color}>{color}</option>)}</select></label></>}
      </div>}
      <label>Additional details (optional)<textarea rows={3} maxLength={2000} value={form.comment} onChange={(event) => update('comment', event.target.value)} placeholder="Tell us more about the issue" /></label>
      <p className="sc-orders__muted">Keep the item unused with its original tags and packaging. Your request will be reviewed under the store’s return policy.</p>
    </fieldset>
    {error && <p className="sc-orders__error" role="alert">{error}</p>}
    <div className="sc-order-form__actions"><button type="button" className="sc-orders__outline" onClick={onCancel} disabled={busy}>Cancel</button><button className="sc-orders__button" disabled={busy || (form.type === 'exchange' && (!exchangeAvailable || !selectionAvailable || loading || !!productError))}>{busy ? 'Submitting…' : 'Submit request'}</button></div>
  </form>;
}
