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
import {
  buildSizeChartPayload,
  getSelectableSizes,
  getSizeChartColumns,
  inferSizeChartProfile,
  reconcileSizeChartRows,
  resolveSizingMode,
  SIZE_CHART_PROFILES,
} from '../../utils/productSizing';

export default function ProductDrafts({ route = '/admin/product-drafts' }) {
  const focusedDraftId = new URLSearchParams(route.split('?')[1] || '').get('draftId') || '';
  const [categories, setCategories] = useState([]);
  const [structure, setStructure] = useState(null);
  const [structureError, setStructureError] = useState('');
  const loadStructure = () => api.get('/catalog-configuration').then((value) => { setStructure(value); setStructureError(''); }).catch((error) => setStructureError(error.message));
  useEffect(() => { loadStructure(); }, []);
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
  const visibleDrafts = focusedDraftId ? drafts.filter((draft) => String(draft._id || draft.id) === focusedDraftId) : drafts;

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
        body: normalizeDraftBody(draft, categories, structure),
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
    if (!structure) return showFeedback('Load product configuration before publishing.', 'error');
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
      ><a href="/admin/social-import" className="admin-btn-ghost">Import Instagram / Facebook link</a></PageHeader>

      {focusedDraftId && <p className="admin-note">Showing your imported draft. <a className="text-wine underline" href="/admin/product-drafts">View all drafts</a></p>}

      {structureError && <p role="alert" className="admin-card p-4">{structureError} <button type="button" onClick={loadStructure}>Retry product configuration</button></p>}
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
        ) : !visibleDrafts.length ? (
          <div className="p-5"><EmptyState title="No product drafts found" note="Upload product images to create draft records." /></div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleDrafts.map((draft) => (
              <DraftCard
                key={draft._id || draft.id}
                draft={draft}
                categories={categories}
                structure={structure}
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

function DraftCard({ draft, structure, categories, selected, onSelect, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    ...draft,
    sizes: Array.isArray(draft.sizes) ? draft.sizes.join(', ') : '',
    colors: Array.isArray(draft.colors) ? draft.colors.join(', ') : '',
    tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : '',
    highlights: Array.isArray(draft.highlights) ? draft.highlights.join(', ') : '',
    sizingMode: draft.sizingMode || 'auto',
    sizeChartProfile: draft.sizeChartProfile || 'auto',
    sizeChart: draft.sizeChart || { unit: 'in', columns: [], rows: [] },
  }));
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    setForm({
      ...draft,
      sizes: Array.isArray(draft.sizes) ? draft.sizes.join(', ') : '',
      colors: Array.isArray(draft.colors) ? draft.colors.join(', ') : '',
      tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : '',
      highlights: Array.isArray(draft.highlights) ? draft.highlights.join(', ') : '',
      sizingMode: draft.sizingMode || 'auto',
      sizeChartProfile: draft.sizeChartProfile || 'auto',
      sizeChart: draft.sizeChart || { unit: 'in', columns: [], rows: [] },
    });
  }, [draft]);

  useEffect(() => {
    const categoryId = form.category?._id || form.category || '';
    fetchSubcategories(api, categoryId).then(setSubcategories);
  }, [form.category]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const categoryName = categories.find((category) => String(category._id) === String(form.category?._id || form.category))?.name || '';
  const sizingProduct = { ...form, category: categoryName, ...(structure?.features?.sizing === false ? { sizingMode: 'free-size', sizeChartProfile: 'free-size' } : {}) };
  const sizingMode = resolveSizingMode(sizingProduct);
  const profile = inferSizeChartProfile(sizingProduct);
  const sizes = getSelectableSizes(sizingProduct);
  const columns = getSizeChartColumns(sizingProduct);
  const rows = reconcileSizeChartRows(form.sizeChart?.rows, sizes, columns);
  const updateMeasurement = (size, field, value) => {
    setForm((current) => ({
      ...current,
      sizeChart: {
        unit: current.sizeChart?.unit === 'cm' ? 'cm' : 'in',
        columns: columns.map((column) => column.key),
        rows: reconcileSizeChartRows(current.sizeChart?.rows, getSelectableSizes({ ...current, category: categoryName }), columns)
          .map((row) => row.size === size ? { ...row, [field]: value } : row),
      },
    }));
  };

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
      {draft.status === 'published' && draft.publishedProductId && <a href={'/admin/products/edit?id=' + encodeURIComponent(draft.publishedProductId)} className="admin-btn-ghost mt-3 w-full">Edit published product</a>}
      <div className="mt-3 overflow-hidden rounded-2xl bg-[#f7efe8]">
        <img src={normalizeImageUrl(form.image || form.images?.[0]?.url || '/uploads/placeholder.jpg')} alt={form.name || 'Draft'} className="h-44 w-full object-cover" />
      </div>
      <div className="mt-4 space-y-3">
        <TextInput value={form.name || ''} onChange={(event) => update('name', event.target.value)} placeholder="Product name" />
        {['social-import', 'reel-import'].includes(draft.sourceType) && <>
          {draft.sourceUrl && <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-wine underline">Original {draft.sourcePlatform === 'facebook' ? 'Facebook' : 'Instagram'} post</a>}
          <div className="grid grid-cols-4 gap-2">{(form.images || []).map((image, index) => <button key={image.url} type="button" onClick={() => setForm((value) => ({ ...value, image: image.url, images: value.images.map((item) => ({ ...item, primary: item.url === image.url })) }))} aria-label={'Set imported photo ' + (index + 1) + ' as cover'} aria-pressed={image.primary} className={'overflow-hidden rounded-lg border-2 ' + (image.primary ? 'border-wine' : 'border-transparent')}><img src={normalizeImageUrl(image.url)} alt={'Imported product photo ' + (index + 1)} className="aspect-[3/4] w-full object-cover" loading="lazy" /></button>)}</div>
          <label className="grid gap-1 text-xs font-bold">Description<textarea rows={4} maxLength={6000} value={form.description || ''} onChange={(event) => update('description', event.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label>
        </>}
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
          {sizingMode === 'sized' ? <TextInput value={form.sizes || ''} onChange={(event) => update('sizes', event.target.value)} placeholder="Sizes: S, M, L" /> : <div className="grid place-items-center rounded-xl bg-emerald-50 px-2 text-center text-[10px] font-black text-emerald-700">No size selection</div>}
        </div>
        {structure?.features?.sizing !== false && <Select value={form.sizingMode || 'auto'} onChange={(event) => update('sizingMode', event.target.value)}>
          <option value="auto">Automatic sizing</option>
          <option value="sized">Selectable sizes</option>
          <option value="free-size">No size selection / free size</option>
        </Select>}
        {sizingMode === 'sized' ? (
          <details className="rounded-xl border border-[#eadfd5] bg-white">
            <summary className="cursor-pointer px-3 py-3 text-xs font-black text-charcoal">Edit garment size chart</summary>
            <div className="border-t border-[#eee5de] p-3">
              <Select value={form.sizeChartProfile || 'auto'} onChange={(event) => update('sizeChartProfile', event.target.value)}>
                <option value="auto">Automatic ({SIZE_CHART_PROFILES[profile]?.label || 'apparel'})</option>
                {Object.entries(SIZE_CHART_PROFILES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
              </Select>
              <div className="mt-3 flex justify-end gap-1">
                {['in', 'cm'].map((unit) => <button key={unit} type="button" onClick={() => update('sizeChart', { ...(form.sizeChart || {}), unit })} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${form.sizeChart?.unit === unit ? 'bg-wine text-white' : 'bg-slate-100 text-slate-500'}`}>{unit}</button>)}
              </div>
              {sizes.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-max text-left text-[10px]">
                    <thead><tr><th className="p-2">Size</th>{columns.map((column) => <th key={column.key} className="min-w-28 p-2">{column.shortLabel}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.size} className="border-t"><th className="p-2">{row.size}</th>{columns.map((column) => <td key={column.key} className="p-1"><input type="number" min="0.1" step="0.1" value={row[column.key] ?? ''} onChange={(event) => updateMeasurement(row.size, column.key, event.target.value)} aria-label={`${row.size} ${column.label}`} className="h-9 w-24 rounded-lg border px-2" /></td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : <p className="mt-3 text-[10px] font-bold text-amber-700">Add size labels to generate the chart.</p>}
            </div>
          </details>
        ) : null}
        {structure?.attributes?.map((attribute) => <label key={attribute.key} className="grid gap-1 text-xs font-bold">{attribute.label}{attribute.unit ? ' (' + attribute.unit + ')' : ''}{attribute.required ? ' *' : ''}<TextInput value={form.attributeValues?.[attribute.key] ?? ''} maxLength={500} onChange={(event) => update('attributeValues', { ...form.attributeValues, [attribute.key]: event.target.value })} /></label>)}
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

function normalizeDraftBody(form, categories = [], structure) {
  const categoryName = categories.find((category) => String(category._id) === String(form.category?._id || form.category))?.name || '';
  const sizingProduct = { ...form, category: categoryName, ...(structure?.features?.sizing === false ? { sizingMode: 'free-size', sizeChartProfile: 'free-size' } : {}) };
  const sizingMode = resolveSizingMode(sizingProduct);
  return {
    ...form,
    category: form.category?._id || form.category || undefined,
    images: Array.isArray(form.images) ? form.images : [],
    videos: Array.isArray(form.videos) ? form.videos : [],
    price: Number(form.sellingPrice || form.price || 0),
    originalPrice: Number(form.originalPrice || form.sellingPrice || form.price || 0),
    sellingPrice: Number(form.sellingPrice || form.price || 0),
    stock: Number(form.stock || 0),
    sizes: sizingMode === 'sized' ? getSelectableSizes(sizingProduct) : [],
    sizingMode: sizingProduct.sizingMode || 'auto',
    sizeChartProfile: sizingProduct.sizeChartProfile || 'auto',
    sizeChart: buildSizeChartPayload(sizingProduct),
    sizeFitNotes: form.sizeFitNotes || '',
  };
}
