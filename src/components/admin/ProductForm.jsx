import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import { normalizeImageEntries, normalizeVideoEntries } from '../../services/normalize';
import {
  applyAssistantSuggestions,
  buildAssistantSuggestions,
} from '../../utils/productAssistant';

const DRAFT_PREFIX = 'samira-admin-product-draft';

const emptyProduct = {
  name: '',
  slug: '',
  shortDescription: '',
  price: '',
  originalPrice: '',
  sku: '',
  brand: 'Samira Collection',
  category: '',
  subCategory: '',
  stock: 0,
  lowStockAlert: 5,
  sizes: 'S, M, L, XL',
  colors: 'Wine, Blush, Gold',
  tags: '',
  fabric: '',
  occasion: '',
  description: '',
  images: [],
  videos: [],
  highlights: ['Premium fabric', 'Comfortable fit'],
  careInstructions: '',
  returnPolicy: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  showOnHomepage: false,
  showInTrending: false,
  showInFestive: false,
  isActive: true,
};

export default function ProductForm({ mode = 'Add', productId, onSaved, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => (productId ? emptyProduct : (readDraft(productId) || emptyProduct)));
  const [assistant, setAssistant] = useState({
    category: '',
    subCategory: '',
    color: '',
    secondaryColors: '',
    fabric: '',
    occasion: '',
    style: '',
    workPattern: '',
    fit: '',
    sizeRange: '',
    priceSegment: '',
    targetCustomer: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [draftReady, setDraftReady] = useState(() => !productId);
  const [assistantMode, setAssistantMode] = useState('fill-empty');
  const [assistantSuggestions, setAssistantSuggestions] = useState(null);
  const [assistantSelection, setAssistantSelection] = useState({
    name: true,
    slug: true,
    sku: true,
    shortDescription: true,
    description: true,
    category: true,
    subCategory: true,
    occasion: true,
    fabric: true,
    sizes: true,
    colors: true,
    tags: true,
    highlights: true,
    careInstructions: true,
    returnPolicy: true,
    metaTitle: true,
    metaKeywords: true,
    metaDescription: true,
    caption: true,
    flags: false,
  });
  const [assistantPreviewOpen, setAssistantPreviewOpen] = useState(false);
  const draftKey = getDraftKey(productId);

  useEffect(() => {
    api.get('/categories?admin=true').then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!productId) {
      setDraftReady(true);
      return;
    }

    setDraftReady(false);
    api.get(`/admin/products/${productId}`).then((product) => {
      const savedDraft = readDraft(productId);
      const mergedDraft = mergeDraftIntoProduct(savedDraft);
      setForm({
        ...emptyProduct,
        ...product,
        ...mergedDraft,
        category: mergedDraft.category ?? (product.category?._id || product.category || ''),
        sizes: mergedDraft.sizes || (product.sizes || []).join(', '),
        colors: mergedDraft.colors || (product.colors || []).join(', '),
        tags: mergedDraft.tags || (product.tags || []).join(', '),
        highlights: Array.isArray(mergedDraft.highlights) && mergedDraft.highlights.length
          ? mergedDraft.highlights
          : (product.highlights?.length ? product.highlights : emptyProduct.highlights),
        images: normalizeImageEntries((Array.isArray(mergedDraft.images) && mergedDraft.images.length ? mergedDraft.images : product.images) || []),
        videos: normalizeVideoEntries((Array.isArray(mergedDraft.videos) && mergedDraft.videos.length ? mergedDraft.videos : product.videos) || []),
      });
      setAssistant({
        category: product.category?.name || product.category || '',
        subCategory: product.subCategory || '',
        color: Array.isArray(product.colors) ? product.colors[0] : splitList(product.colors)[0] || '',
        secondaryColors: Array.isArray(product.colors) ? product.colors.slice(1).join(', ') : splitList(product.colors).slice(1).join(', '),
        fabric: product.fabric || '',
        occasion: product.occasion || '',
        style: product.shortDescription || '',
      });
    }).catch((error) => setMessage(error.message))
      .finally(() => setDraftReady(true));
  }, [productId]);

  useEffect(() => {
    if (!draftReady) return undefined;
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(form));
      } catch {
        // ignore storage quota or privacy mode errors
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draftKey, draftReady, form]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const updateAssistant = (field, value) => setAssistant((current) => ({ ...current, [field]: value }));

  const generateAssistant = () => {
    const selectedCategory = categories.find((category) => category._id === form.category) || {};
    const matchedCategory = categories.find((category) => String(category.name || '').trim().toLowerCase() === String(assistant.category || '').trim().toLowerCase());
    const categoryLabel = assistant.category || selectedCategory.name || '';
    const suggestions = buildAssistantSuggestions({
      productId,
      categoryId: matchedCategory?._id || form.category || '',
      categoryName: categoryLabel,
      categoryLabel,
      subCategory: assistant.subCategory || form.subCategory || '',
      color: assistant.color || (Array.isArray(form.colors) ? form.colors[0] : splitList(form.colors)[0]) || '',
      secondaryColors: assistant.secondaryColors || splitList(form.colors).slice(1).join(', '),
      fabric: assistant.fabric || form.fabric || '',
      occasion: assistant.occasion || form.occasion || '',
      style: assistant.style || '',
      workPattern: assistant.workPattern || '',
      fit: assistant.fit || '',
      sizeRange: assistant.sizeRange || form.sizes || '',
      priceSegment: assistant.priceSegment || '',
      targetCustomer: assistant.targetCustomer || '',
    });
    setAssistantSuggestions(suggestions);
    setAssistantPreviewOpen(true);
    setMessage('');
  };

  const applyAssistant = () => {
    if (!assistantSuggestions) return;
    const nextForm = applyAssistantSuggestions(form, assistantSuggestions, assistantMode, Object.entries(assistantSelection).filter(([, value]) => value).map(([key]) => key));
    setForm(nextForm);
    if (assistantSelection.caption && assistantSuggestions.caption && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(assistantSuggestions.caption).catch(() => {});
    }
    setAssistantPreviewOpen(false);
    setMessage('Smart product details generated.');
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setMessage('');
    try {
      const price = Number(form.price);
      const originalPrice = Number(form.originalPrice || form.price);
      const payload = {
        ...form,
        images: prepareImages(form.images),
        videos: prepareVideos(form.videos),
        price,
        originalPrice,
        stock: Number(form.stock),
        lowStockAlert: Number(form.lowStockAlert),
        sizes: splitList(form.sizes),
        colors: splitList(form.colors),
        tags: splitList(form.tags),
        discountPercentage: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      };
      if (!payload.category) delete payload.category;
      if (productId) await api.put(`/admin/products/${productId}`, payload);
      else await api.post('/admin/products', payload);
      if (!productId) setForm(emptyProduct);
      clearDraft(productId);
      setMessage('Product saved successfully.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Basic Information">
        <Input label="Product name" value={form.name} onChange={(value) => update('name', value)} error={errors.name} placeholder="Royal Zari Silk Saree" required />
        <Input label="Slug" value={form.slug} onChange={(value) => update('slug', value)} placeholder="leave blank for auto slug" />
        <Input label="SKU" value={form.sku} onChange={(value) => update('sku', value)} error={errors.sku} placeholder="SC-0101" />
        <Input label="Brand" value={form.brand} onChange={(value) => update('brand', value)} />
        <Input label="Short Description" value={form.shortDescription} onChange={(value) => update('shortDescription', value)} placeholder="Premium festive wear" />
        <label className="grid gap-2 text-sm font-black lg:col-span-2">Full Description
          <textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="min-h-28 rounded-xl border border-slate-200 p-4 font-semibold" placeholder="Write fabric, fit, finish and occasion details" />
          {errors.description && <span className="text-xs font-bold text-rose">{errors.description}</span>}
        </label>
      </Section>

      <Section title="Category, Pricing and Inventory">
        <label className="grid gap-2 text-sm font-black">Category
          <select value={form.category} onChange={(event) => update('category', event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 font-semibold">
            <option value="">Select category</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          {errors.category && <span className="text-xs font-bold text-rose">{errors.category}</span>}
        </label>
        <Input label="Subcategory" value={form.subCategory} onChange={(value) => update('subCategory', value)} placeholder="Festive Wear" />
        <Input label="Occasion" value={form.occasion} onChange={(value) => update('occasion', value)} placeholder="Wedding" />
        <Input label="Fabric" value={form.fabric} onChange={(value) => update('fabric', value)} placeholder="Silk" />
        <Input label="Original price" type="number" value={form.originalPrice} onChange={(value) => update('originalPrice', value)} error={errors.originalPrice} placeholder="2499" />
        <Input label="Selling price" type="number" value={form.price} onChange={(value) => update('price', value)} error={errors.price} placeholder="1299" />
        <Input label="Stock quantity" type="number" value={form.stock} onChange={(value) => update('stock', value)} error={errors.stock} placeholder="20" />
        <Input label="Low stock alert" type="number" value={form.lowStockAlert} onChange={(value) => update('lowStockAlert', value)} placeholder="5" />
      </Section>

      <Section title="Product Images, Sizes and Colors">
        <div className="lg:col-span-2">
          <div className="mb-3 rounded-xl bg-[#fbf8f4] p-4">
            <h3 className="text-sm font-black text-charcoal">Product Images Required</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Click the upload box or drag images here. Upload 1 to 8 clear product photos. Allowed: JPG, JPEG, PNG, WEBP. Max 2MB each.
            </p>
          </div>
          <ImageUploader
            label="Choose Product Images"
            helpText="Uploaded images are saved on the backend and only image URLs are stored in MongoDB."
            multiple
            maxFiles={8}
            uploadContext="products"
            compressAboveMb={2}
            maxUploadMb={20}
            targetSizeMb={0.7}
            value={form.images}
            onChange={(images) => update('images', images)}
          />
          <p className="mt-2 text-xs font-bold text-slate-500">{form.images.length}/8 images uploaded. Mark one image as Main for product listing.</p>
          {errors.images && <p className="mt-2 text-xs font-bold text-rose">{errors.images}</p>}
        </div>
        <div className="lg:col-span-2">
          <div className="mb-3 rounded-xl bg-[#fbf8f4] p-4">
            <h3 className="text-sm font-black text-charcoal">Product Videos Optional</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Upload up to 2 short product videos. Allowed: MP4, WEBM, MOV. Max 20MB each.
            </p>
          </div>
          <VideoUploader
            label="Choose Product Videos"
            helpText="Videos are uploaded to the backend and only video URLs are stored in MongoDB."
            multiple
            maxFiles={2}
            uploadContext="product-videos"
            value={form.videos}
            onChange={(videos) => update('videos', videos)}
          />
          <p className="mt-2 text-xs font-bold text-slate-500">{form.videos.length}/2 videos uploaded.</p>
        </div>
        <Input label="Sizes" value={form.sizes} onChange={(value) => update('sizes', value)} placeholder="XS, S, M, L, XL, Free Size" />
        <Input label="Colors" value={form.colors} onChange={(value) => update('colors', value)} placeholder="Pink, Maroon, Gold" />
        <Input label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="festive, silk, wedding" />
        <Input label="Care Instructions" value={form.careInstructions} onChange={(value) => update('careInstructions', value)} placeholder="Dry clean preferred" />
      </Section>

      <Section title="Smart Product Assistant">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
          <p className="text-sm font-black text-charcoal">Generate product title, description, tags, SEO and caption from basic product details.</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Use any details you know. The assistant will keep existing manual values unless you choose to replace them.</p>
        </div>
        <Input label="Category" value={assistant.category} onChange={(value) => updateAssistant('category', value)} placeholder="Suit, Saree, Kurti" />
        <Input label="Subcategory" value={assistant.subCategory} onChange={(value) => updateAssistant('subCategory', value)} placeholder="Anarkali Suit, Palazzo Suit" />
        <Input label="Main color" value={assistant.color} onChange={(value) => updateAssistant('color', value)} placeholder="Pink, Wine, Blue" />
        <Input label="Secondary colors" value={assistant.secondaryColors} onChange={(value) => updateAssistant('secondaryColors', value)} placeholder="Gold, Cream" />
        <Input label="Fabric" value={assistant.fabric} onChange={(value) => updateAssistant('fabric', value)} placeholder="Georgette, Silk, Cotton" />
        <Input label="Occasion" value={assistant.occasion} onChange={(value) => updateAssistant('occasion', value)} placeholder="Festive, Party, Wedding" />
        <Input label="Style / Type" value={assistant.style} onChange={(value) => updateAssistant('style', value)} placeholder="Ethnic, Party Wear, Daily Wear" />
        <Input label="Work / Pattern" value={assistant.workPattern} onChange={(value) => updateAssistant('workPattern', value)} placeholder="Embroidered, Printed, Zari" />
        <Input label="Fit" value={assistant.fit} onChange={(value) => updateAssistant('fit', value)} placeholder="Regular, Relaxed, Slim" />
        <Input label="Size range" value={assistant.sizeRange} onChange={(value) => updateAssistant('sizeRange', value)} placeholder="S, M, L, XL" />
        <Input label="Price segment" value={assistant.priceSegment} onChange={(value) => updateAssistant('priceSegment', value)} placeholder="Budget, Premium, Luxury" />
        <Input label="Target customer / usage" value={assistant.targetCustomer} onChange={(value) => updateAssistant('targetCustomer', value)} placeholder="Wedding guest, festive wear" />
        <div className="lg:col-span-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="flex items-start gap-3 text-sm font-bold text-charcoal">
            <input
              type="radio"
              name="assistantMode"
              checked={assistantMode === 'fill-empty'}
              onChange={() => setAssistantMode('fill-empty')}
              className="mt-1 accent-rose"
            />
            <span>
              <span className="block">Fill Empty Fields Only</span>
              <span className="block text-xs font-semibold text-slate-500">Default. Existing manual values stay untouched.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm font-bold text-charcoal">
            <input
              type="radio"
              name="assistantMode"
              checked={assistantMode === 'replace'}
              onChange={() => setAssistantMode('replace')}
              className="mt-1 accent-rose"
            />
            <span>
              <span className="block">Replace Existing Values</span>
              <span className="block text-xs font-semibold text-slate-500">Will ask for confirmation before overwriting manual data.</span>
            </span>
          </label>
        </div>
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['name', 'Product name'],
            ['slug', 'Slug'],
            ['sku', 'SKU'],
            ['shortDescription', 'Short description'],
            ['description', 'Full description'],
            ['category', 'Category'],
            ['subCategory', 'Subcategory'],
            ['occasion', 'Occasion'],
            ['fabric', 'Fabric'],
            ['sizes', 'Sizes'],
            ['colors', 'Colors'],
            ['tags', 'Tags'],
            ['highlights', 'Highlights'],
            ['careInstructions', 'Care instructions'],
            ['returnPolicy', 'Return policy'],
            ['metaTitle', 'Meta title'],
            ['metaKeywords', 'Meta keywords'],
            ['metaDescription', 'Meta description'],
            ['flags', 'Flags'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-charcoal">
              <input
                type="checkbox"
                checked={assistantSelection[key]}
                onChange={(event) => setAssistantSelection((current) => ({ ...current, [key]: event.target.checked }))}
                className="accent-rose"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={generateAssistant}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f2a44] px-5 text-sm font-black text-white"
          >
            Generate Smart Details
          </button>
          <button
            type="button"
            onClick={generateAssistant}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700"
          >
            Preview Suggestions
          </button>
        </div>
      </Section>

      <Section title="Highlights, Policy and SEO">
        <Input label="Highlights" value={form.highlights.join(', ')} onChange={(value) => update('highlights', splitList(value))} placeholder="Premium fabric, Easy wash care" />
        <Input label="Return Policy" value={form.returnPolicy} onChange={(value) => update('returnPolicy', value)} placeholder="7 days return/exchange" />
        <Input label="Meta Title" value={form.metaTitle} onChange={(value) => update('metaTitle', value)} />
        <Input label="Meta Keywords" value={form.metaKeywords} onChange={(value) => update('metaKeywords', value)} />
        <label className="grid gap-2 text-sm font-black lg:col-span-2">Meta Description
          <textarea value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} className="min-h-20 rounded-xl border border-slate-200 p-4 font-semibold" />
        </label>
        <div className="flex flex-wrap gap-4 lg:col-span-2">
          {[
            ['isFeatured', 'Featured'],
            ['isNewArrival', 'New Arrival'],
            ['isBestSeller', 'Best Seller'],
            ['showOnHomepage', 'Homepage'],
            ['showInTrending', 'Trending'],
            ['showInFestive', 'Festive'],
            ['isActive', 'Active'],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={form[field]} onChange={(event) => update(field, event.target.checked)} className="accent-rose" /> {label}
            </label>
          ))}
        </div>
      </Section>

      {assistantPreviewOpen && assistantSuggestions && (
        <AssistantPreviewModal
          suggestions={assistantSuggestions}
          selection={assistantSelection}
          setSelection={setAssistantSelection}
          mode={assistantMode}
          onClose={() => setAssistantPreviewOpen(false)}
          onApply={applyAssistant}
        />
      )}

      {message && <p className="rounded-xl bg-white p-3 text-sm font-bold text-wine shadow-sm">{message}</p>}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="grid h-12 place-items-center rounded-xl border border-slate-200 px-5 text-sm font-black">
            Cancel
          </button>
        ) : (
          <a href="#/admin/products" className="grid h-12 place-items-center rounded-xl border border-slate-200 px-5 text-sm font-black">Cancel</a>
        )}
        <button type="button" onClick={() => setForm(emptyProduct)} className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-black">Reset</button>
        <button type="button" onClick={() => { update('isActive', false); setTimeout(() => document.querySelector('form')?.requestSubmit(), 0); }} className="h-12 rounded-xl bg-charcoal px-5 text-sm font-black text-white">Save Draft</button>
        <button disabled={saving} className="h-12 rounded-xl bg-wine px-5 text-sm font-black text-white disabled:opacity-60">{saving ? 'Saving...' : `${mode} Product`}</button>
      </div>
    </form>
  );
}

function AssistantPreviewModal({ suggestions, selection, setSelection, mode, onClose, onApply }) {
  const fields = [
    ['name', 'Product name', suggestions.productName],
    ['slug', 'Slug', suggestions.slug],
    ['sku', 'SKU suggestion', suggestions.sku],
    ['shortDescription', 'Short description', suggestions.shortDescription],
    ['description', 'Full description', suggestions.description],
    ['category', 'Category', suggestions.categoryName || suggestions.category],
    ['subCategory', 'Subcategory', suggestions.subCategory],
    ['occasion', 'Occasion', suggestions.occasion],
    ['fabric', 'Fabric', suggestions.fabric],
    ['sizes', 'Sizes', suggestions.sizes.join(', ')],
    ['colors', 'Colors', suggestions.colors.join(', ')],
    ['tags', 'Tags', suggestions.tags],
    ['highlights', 'Highlights', suggestions.highlights.join('\n')],
    ['careInstructions', 'Care instructions', suggestions.careInstructions],
    ['returnPolicy', 'Return policy', suggestions.returnPolicy],
    ['metaTitle', 'Meta title', suggestions.seo?.metaTitle],
    ['metaKeywords', 'Meta keywords', suggestions.seo?.metaKeywords],
    ['metaDescription', 'Meta description', suggestions.seo?.metaDescription],
    ['flags', 'Flags', formatFlagSummary(suggestions.flags)],
    ['caption', 'Caption', suggestions.caption],
  ];

  return (
    <div className="fixed inset-0 z-[90] bg-black/55 p-3 sm:p-4">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-wine/60">Smart Product Assistant</p>
            <h2 className="text-lg font-black text-charcoal">Preview generated suggestions</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Mode: {mode === 'replace' ? 'Replace existing values' : 'Fill empty fields only'}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {fields.map(([key, label, value]) => (
              <label key={key} className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-charcoal">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selection[key])}
                    onChange={(event) => setSelection((current) => ({ ...current, [key]: event.target.checked }))}
                    className="accent-rose"
                  />
                </div>
                <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-5 text-slate-600">{String(value || 'No suggestion')}</pre>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode === 'replace' && !window.confirm('This will replace existing manually entered values. Continue?')) {
                return;
              }
              onApply();
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-wine px-5 text-sm font-black text-white"
          >
            Apply Selected
          </button>
        </div>
      </div>
    </div>
  );
}

function formatFlagSummary(flags = {}) {
  return [
    flags.isNewArrival ? 'New Arrival: yes' : 'New Arrival: no',
    flags.showInFestive ? 'Festive: suggested' : 'Festive: no',
    flags.showInTrending ? 'Trending: suggested' : 'Trending: no',
    flags.isFeatured ? 'Featured: yes' : 'Featured: no',
    flags.isBestSeller ? 'Best Seller: yes' : 'Best Seller: no',
  ].join('\n');
}

function Section({ title, children }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-black text-charcoal">{title}</h2><div className="grid gap-4 lg:grid-cols-2">{children}</div></section>;
}

function Input({ label, value, onChange, placeholder, type = 'text', required = false, error }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 font-semibold" placeholder={placeholder} />
      {error && <span className="text-xs font-bold text-rose">{error}</span>}
    </label>
  );
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Product name must be at least 3 characters.';
  if (!form.sku.trim()) errors.sku = 'SKU is required.';
  if (!form.category) errors.category = 'Category is required.';
  if (!Number(form.originalPrice)) errors.originalPrice = 'Original price is required.';
  if (!Number(form.price)) errors.price = 'Selling price is required.';
  if (Number(form.price) > Number(form.originalPrice)) errors.price = 'Selling price cannot exceed original price.';
  if (Number(form.stock) < 0) errors.stock = 'Stock cannot be negative.';
  if (!form.images.length) errors.images = 'Upload at least one product image.';
  if (form.description.trim().length < 20) errors.description = 'Description must be at least 20 characters.';
  return errors;
}

function prepareImages(images) {
  const normalized = normalizeImageEntries(images);
  if (!normalized.length) return [];
  if (!normalized.some((image) => image.primary)) {
    normalized[0] = { ...normalized[0], primary: true };
  }
  return normalized.map((image) => ({
    url: image.url,
    publicId: image.publicId,
    primary: Boolean(image.primary),
  }));
}

function getDraftKey(productId) {
  return `${DRAFT_PREFIX}:${productId || 'new'}`;
}

function readDraft(productId) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getDraftKey(productId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft(productId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getDraftKey(productId));
  } catch {
    // ignore storage errors
  }
}

function prepareVideos(videos) {
  const normalized = normalizeVideoEntries(videos).slice(0, 2);
  return normalized.map((video) => ({
    url: video.url,
    publicId: video.publicId,
    thumbnail: video.thumbnail,
  }));
}

function mergeDraftIntoProduct(draft) {
  if (!draft || typeof draft !== 'object') return {};
  if (!isMeaningfulDraft(draft)) return {};

  const merged = {};
  for (const [key, value] of Object.entries(draft)) {
    if (key === 'images') {
      if (Array.isArray(value) && value.length) merged.images = value;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length) merged[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      if (value.trim()) merged[key] = value;
      continue;
    }

    if (typeof value === 'boolean') {
      merged[key] = value;
      continue;
    }

    if (typeof value === 'number') {
      if (!Number.isNaN(value)) merged[key] = value;
    }
  }

  return merged;
}

function isMeaningfulDraft(draft) {
  return Object.entries(draft).some(([key, value]) => {
    const defaultValue = emptyProduct[key];

    if (Array.isArray(value)) {
      if (key === 'highlights') {
        return JSON.stringify(value) !== JSON.stringify(defaultValue);
      }
      return value.length > 0;
    }

    if (typeof value === 'string') {
      if (key === 'brand') return value.trim() !== String(defaultValue || '').trim();
      return value.trim().length > 0;
    }

    if (typeof value === 'boolean') {
      return value !== defaultValue;
    }

    if (typeof value === 'number') {
      return !Number.isNaN(value) && value !== defaultValue;
    }

    return false;
  });
}
