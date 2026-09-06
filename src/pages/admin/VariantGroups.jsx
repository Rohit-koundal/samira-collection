import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, PencilLine, Plus, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { Select, TextInput } from '../../components/ui/Field';
import PageHeader from '../../components/admin/PageHeader';
import Loader from '../../components/admin/Loader';
import EmptyState from '../../components/admin/EmptyState';

export default function VariantGroups() {
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', baseProduct: '', productIds: [], colors: '', sizes: '' });
  const [editingGroupId, setEditingGroupId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true); setLoadError('');
    try {
      const [groupItems, productItems] = await Promise.all([
        api.get('/admin/variant-groups'),
        api.get('/admin/products?admin=true'),
      ]);
      if (sequence !== loadSequence.current) return;
      const list = Array.isArray(groupItems) ? groupItems : groupItems?.data;
      if (!Array.isArray(list) || list.some(item => !item?._id) || !Array.isArray(productItems)) throw new Error('Unable to read variant groups. Please try again.');
      setGroups(list);
      setProducts(productItems);
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError(error.message);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => { loadSequence.current += 1; };
  }, [load]);

  const productMap = useMemo(() => new Map(products.map((product) => [product._id, product])), [products]);

  const createGroup = async () => {
    if (!form.name.trim()) return setMessage('Group name is required.');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        baseProduct: form.baseProduct || undefined,
        productIds: form.productIds,
        colors: form.colors,
        sizes: form.sizes,
      };
      if (editingGroupId) await api.put(`/admin/variant-groups/${editingGroupId}`, payload);
      else await api.post('/admin/variant-groups', payload);
      setForm({ name: '', baseProduct: '', productIds: [], colors: '', sizes: '' });
      setEditingGroupId('');
      await load();
      setMessage(editingGroupId ? 'Variant group updated successfully.' : 'Variant group created successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const editGroup = (group) => {
    setEditingGroupId(group._id || group.id || '');
    setForm({
      name: group.name || '',
      baseProduct: getGroupProductId(group.baseProduct),
      productIds: (group.products || []).map(getGroupProductId).filter(Boolean),
      colors: Array.isArray(group.colors) ? group.colors.join(', ') : '',
      sizes: Array.isArray(group.sizes) ? group.sizes.join(', ') : '',
    });
    setMessage('');
  };

  const clearForm = () => {
    setForm({ name: '', baseProduct: '', productIds: [], colors: '', sizes: '' });
    setEditingGroupId('');
    setMessage('');
  };

  const toggleProduct = (productId) => {
    setForm((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }));
  };

  const removeGroup = async (groupId) => {
    if (saving) return;
    if (!window.confirm('Delete this variant group?')) return;
    setSaving(true); setMessage('');
    try {
      await api.delete(`/admin/variant-groups/${groupId}`);
      setGroups(current => current.filter(group => (group._id || group.id) !== groupId));
      if (editingGroupId === groupId) clearForm();
      setMessage('Variant group deleted successfully.');
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Variant Groups" note="Group same-design products by colors and sizes." />

      <div className="admin-card p-4">
        {editingGroupId && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-wine/20 bg-[#fff4f7] px-4 py-3">
            <p className="text-sm font-black text-wine">Editing variant group</p>
            <button type="button" onClick={clearForm} className="inline-flex items-center gap-1 rounded-full border border-wine/20 bg-white px-3 py-1.5 text-xs font-black text-wine">
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          <TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Variant group name" />
          <Select value={form.baseProduct} onChange={(event) => setForm((current) => ({ ...current, baseProduct: event.target.value }))}>
            <option value="">Select base product</option>
            {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
          </Select>
          <TextInput value={form.colors} onChange={(event) => setForm((current) => ({ ...current, colors: event.target.value }))} placeholder="Colors, comma separated" />
          <TextInput value={form.sizes} onChange={(event) => setForm((current) => ({ ...current, sizes: event.target.value }))} placeholder="Sizes, comma separated" />
        </div>
        <div className="mt-4 rounded-[20px] border border-slate-200 bg-[#fcfaf7] p-4">
          <p className="text-sm font-black text-charcoal">Select products</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => toggleProduct(product._id)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-semibold ${form.productIds.includes(product._id) ? 'border-wine bg-[#fff4f7] text-wine' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                <span className="truncate">{product.name}</span>
                {form.productIds.includes(product._id) ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={createGroup} disabled={saving} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-wine px-5 text-sm font-black text-white disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {saving ? 'Saving...' : editingGroupId ? 'Update Group' : 'Create Group'}
        </button>
      </div>

      {message && <p role="status" className="rounded-2xl bg-[#fdf4f6] px-4 py-3 text-sm font-bold text-wine">{message}</p>}

      <div className="admin-card overflow-hidden">
        {loadError ? <div role="alert" className="admin-card space-y-3 p-5"><p className="text-sm font-semibold text-rose">{loadError}</p><button type="button" className="admin-btn-secondary" onClick={() => load()}>Try again</button></div> : loading ? (
          <Loader label="Loading variant groups..." />
        ) : !groups.length ? (
          <div className="p-5"><EmptyState title="No variant groups yet" note="Create grouped variants for color and size families." /></div>
        ) : (
          <div className="space-y-4 p-4">
            {groups.map((group) => (
              <article key={group._id || group.id} className="rounded-[22px] border border-[#f0e5db] bg-[#fffdfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-charcoal">{group.name}</h3>
                    <p className="text-xs font-semibold text-slate-500">{(group.products || []).length} products · {group.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => editGroup(group)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600" aria-label="Edit group">
                      <PencilLine className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={saving} onClick={() => removeGroup(group._id || group.id)} className="text-rose" aria-label="Delete group">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(group.colors || []).map((color) => <span key={color} className="rounded-full bg-[#fff4f7] px-3 py-1 text-xs font-black text-wine">{color}</span>)}
                  {(group.sizes || []).map((size) => <span key={size} className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-black text-slate-700">{size}</span>)}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {(group.products || []).map((product) => {
                    const item = productMap.get(product._id || product.id || product);
                    return <span key={product._id || product.id || product} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{item?.name || 'Product'}</span>;
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getGroupProductId(product) {
  return product?._id || product?.id || product || '';
}
