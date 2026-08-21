import { useEffect, useMemo, useState } from 'react';
import { Check, CopyPlus, Trash2, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { Select, TextInput } from '../../components/ui/Field';
import PageHeader from '../../components/admin/PageHeader';
import EmptyState from '../../components/admin/EmptyState';
import Loader from '../../components/admin/Loader';
import { fetchCategories, fetchSubcategories } from '../../utils/catalogOptions';
import { normalizeImageUrl } from '../../services/normalize';
import useDesktopFeedback from '../../hooks/useDesktopFeedback';
import {
  useBulkUploadProductDraftsMutation,
  useDeleteProductDraftMutation,
  useGetProductDraftsQuery,
  usePublishSelectedDraftsMutation,
  useUpdateProductDraftMutation,
} from '../../store/apiSlice';

export default function ProductDrafts() {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState([]);
  const { notify } = useDesktopFeedback();
  const { data: draftResponse, isLoading, isFetching } = useGetProductDraftsQuery();
  const [bulkUploadProductDrafts, { isLoading: uploading }] = useBulkUploadProductDraftsMutation();
  const [updateProductDraft, { isLoading: saving }] = useUpdateProductDraftMutation();
  const [deleteProductDraft] = useDeleteProductDraftMutation();
  const [publishSelectedDrafts] = usePublishSelectedDraftsMutation();

  const drafts = useMemo(() => draftResponse?.data || [], [draftResponse]);

  useEffect(() => {
    setSelected((current) => current.filter((id) => drafts.some((draft) => (draft._id || draft.id) === id)));
  }, [drafts]);

  useEffect(() => {
    fetchCategories(api).then(setCategories).catch(() => setCategories([]));
  }, []);

  const selectedCount = useMemo(() => selected.length, [selected]);
  const showFeedback = (text, type = 'info') => {
    if (!text) return;
    if (!notify(text, type, 'Product Drafts')) {
      setMessage(text);
    } else {
      setMessage('');
    }
  };

  const onUpload = async () => {
    if (!files.length) return showFeedback('Please choose one or more images first.', 'warning');
    setMessage('');
    try {
      await bulkUploadProductDrafts({ files }).unwrap();
      setFiles([]);
      showFeedback('Drafts created successfully.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const saveDraft = async (draft) => {
    try {
      await updateProductDraft({
        id: draft._id || draft.id,
        body: normalizeDraftBody(draft),
      }).unwrap();
      showFeedback('Draft saved successfully.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const removeDraft = async (draftId) => {
    if (!window.confirm('Delete this draft?')) return;
    await deleteProductDraft(draftId).unwrap();
    showFeedback('Draft deleted successfully.', 'success');
  };

  const publishSelected = async () => {
    if (!selected.length) return showFeedback('Select at least one draft to publish.', 'warning');
    try {
      await publishSelectedDrafts({ ids: selected }).unwrap();
      setSelected([]);
      showFeedback('Selected drafts published.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Product Drafts"
        note="Bulk upload images, create draft cards, edit fields, and publish when ready."
      />

      <div className="admin-card p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="grid gap-2">
            <span className="text-sm font-black text-charcoal">Bulk upload draft images</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={onUpload} disabled={uploading} className="inline-flex h-12 items-center gap-2 rounded-xl bg-wine px-5 text-sm font-black text-white disabled:opacity-60">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Create Drafts'}
            </button>
            <button type="button" onClick={() => setFiles([])} className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600">
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {files.map((file) => <span key={`${file.name}-${file.size}`} className="rounded-full bg-[#fff5f7] px-3 py-1 text-xs font-bold text-wine">{file.name}</span>)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 admin-card p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-wine/60">Selected drafts</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{selectedCount} selected · {drafts.length} total</p>
        </div>
        <button type="button" onClick={publishSelected} disabled={!selected.length || saving} className="admin-btn disabled:opacity-60">
          <CopyPlus className="h-4 w-4" />
          Publish Selected
        </button>
      </div>

      {message && <p className="rounded-2xl bg-[#fdf4f6] px-4 py-3 text-sm font-bold text-wine md:hidden">{message}</p>}

      <div className="admin-card overflow-hidden">
        {isLoading || isFetching ? (
          <Loader label="Loading drafts..." />
        ) : !drafts.length ? (
          <div className="p-5"><EmptyState title="No product drafts found" note="Upload product images to create draft records." /></div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft._id || draft.id}
                draft={draft}
                categories={categories}
                selected={selected.includes(draft._id || draft.id)}
                onSelect={() => setSelected((current) => current.includes(draft._id || draft.id) ? current.filter((id) => id !== (draft._id || draft.id)) : [...current, draft._id || draft.id])}
                onSave={saveDraft}
                onDelete={removeDraft}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DraftCard({ draft, categories, selected, onSelect, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    ...draft,
    sizes: Array.isArray(draft.sizes) ? draft.sizes.join(', ') : '',
    colors: Array.isArray(draft.colors) ? draft.colors.join(', ') : '',
    tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : '',
    highlights: Array.isArray(draft.highlights) ? draft.highlights.join(', ') : '',
  }));
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    setForm({
      ...draft,
      sizes: Array.isArray(draft.sizes) ? draft.sizes.join(', ') : '',
      colors: Array.isArray(draft.colors) ? draft.colors.join(', ') : '',
      tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : '',
      highlights: Array.isArray(draft.highlights) ? draft.highlights.join(', ') : '',
    });
  }, [draft]);

  useEffect(() => {
    const categoryId = form.category?._id || form.category || '';
    fetchSubcategories(api, categoryId).then(setSubcategories);
  }, [form.category]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <article className="rounded-[22px] border border-[#f0e5db] bg-[#fffdfa] p-4 shadow-[0_10px_24px_rgba(111,74,52,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-black text-charcoal">
          <input type="checkbox" checked={selected} onChange={onSelect} className="accent-wine" />
          Draft
        </label>
        <button type="button" onClick={() => onDelete(draft._id || draft.id)} className="text-rose" aria-label="Delete draft">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl bg-[#f7efe8]">
        <img src={normalizeImageUrl(draft.image || draft.images?.[0]?.url || '/uploads/placeholder.jpg')} alt={draft.name || 'Draft'} className="h-44 w-full object-cover" />
      </div>
      <div className="mt-4 space-y-3">
        <TextInput value={form.name || ''} onChange={(event) => update('name', event.target.value)} placeholder="Product name" />
        <Select value={form.category?._id || form.category || ''} onChange={(event) => update('category', event.target.value)}>
          <option value="">Select category</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </Select>
        <Select value={form.subCategory || ''} onChange={(event) => update('subCategory', event.target.value)}>
          <option value="">{subcategories.length ? 'Select subcategory' : 'No subcategories yet'}</option>
          {form.subCategory && !subcategories.includes(form.subCategory) ? <option value={form.subCategory}>{form.subCategory}</option> : null}
          {subcategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <TextInput type="number" value={form.originalPrice || ''} onChange={(event) => update('originalPrice', event.target.value)} placeholder="Original price" />
          <TextInput type="number" value={form.sellingPrice || form.price || ''} onChange={(event) => update('sellingPrice', event.target.value)} placeholder="Selling price" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextInput type="number" value={form.stock || ''} onChange={(event) => update('stock', event.target.value)} placeholder="Stock" />
          <TextInput value={form.sizes || ''} onChange={(event) => update('sizes', event.target.value)} placeholder="Sizes" />
        </div>
        <TextInput value={form.colors || ''} onChange={(event) => update('colors', event.target.value)} placeholder="Colors" />
        <TextInput value={form.fabric || ''} onChange={(event) => update('fabric', event.target.value)} placeholder="Fabric" />
        <TextInput value={form.occasion || ''} onChange={(event) => update('occasion', event.target.value)} placeholder="Occasion" />
        <TextInput value={form.tags || ''} onChange={(event) => update('tags', event.target.value)} placeholder="Tags" />
        <button type="button" onClick={() => onSave(form)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-wine px-4 text-sm font-black text-white">
          <Check className="h-4 w-4" />
          Save Draft
        </button>
      </div>
    </article>
  );
}

function normalizeDraftBody(form) {
  return {
    ...form,
    category: form.category?._id || form.category || undefined,
    images: Array.isArray(form.images) ? form.images : [],
    videos: Array.isArray(form.videos) ? form.videos : [],
    price: Number(form.sellingPrice || form.price || 0),
    originalPrice: Number(form.originalPrice || form.sellingPrice || form.price || 0),
    sellingPrice: Number(form.sellingPrice || form.price || 0),
    stock: Number(form.stock || 0),
  };
}
