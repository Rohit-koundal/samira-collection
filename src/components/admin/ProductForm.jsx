import { useEffect, useState } from 'react';
import api from '../../services/api';
import { normalizeImageUrl } from '../../services/normalize';
import ImageUploader from './ImageUploader';
import { normalizeImageEntries } from '../../services/normalize';

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

export default function ProductForm({ mode = 'Add', productId, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => readDraft(productId) || emptyProduct);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const draftKey = getDraftKey(productId);

  useEffect(() => {
    api.get('/categories?admin=true').then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!productId) return;
    api.get(`/admin/products/${productId}`).then((product) => {
      const savedDraft = readDraft(productId);
      setForm({
        ...emptyProduct,
        ...product,
        ...(savedDraft || {}),
        category: savedDraft?.category ?? (product.category?._id || product.category || ''),
        sizes: savedDraft?.sizes || (product.sizes || []).join(', '),
        colors: savedDraft?.colors || (product.colors || []).join(', '),
        tags: savedDraft?.tags || (product.tags || []).join(', '),
        highlights: savedDraft?.highlights?.length ? savedDraft.highlights : (product.highlights?.length ? product.highlights : emptyProduct.highlights),
        images: normalizeImageEntries((savedDraft?.images?.length ? savedDraft.images : product.images) || []),
      });
    }).catch((error) => setMessage(error.message));
  }, [productId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(form));
      } catch {
        // ignore storage quota or privacy mode errors
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draftKey, form]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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
            maxSizeMb={2}
            value={form.images}
            onChange={(images) => update('images', images)}
          />
          <p className="mt-2 text-xs font-bold text-slate-500">{form.images.length}/8 images uploaded. Mark one image as Main for product listing.</p>
          {errors.images && <p className="mt-2 text-xs font-bold text-rose">{errors.images}</p>}
        </div>
        <Input label="Sizes" value={form.sizes} onChange={(value) => update('sizes', value)} placeholder="XS, S, M, L, XL, Free Size" />
        <Input label="Colors" value={form.colors} onChange={(value) => update('colors', value)} placeholder="Pink, Maroon, Gold" />
        <Input label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="festive, silk, wedding" />
        <Input label="Care Instructions" value={form.careInstructions} onChange={(value) => update('careInstructions', value)} placeholder="Dry clean preferred" />
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

      {message && <p className="rounded-xl bg-white p-3 text-sm font-bold text-wine shadow-sm">{message}</p>}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
        <a href="#/admin/products" className="grid h-12 place-items-center rounded-xl border border-slate-200 px-5 text-sm font-black">Cancel</a>
        <button type="button" onClick={() => setForm(emptyProduct)} className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-black">Reset</button>
        <button type="button" onClick={() => { update('isActive', false); setTimeout(() => document.querySelector('form')?.requestSubmit(), 0); }} className="h-12 rounded-xl bg-charcoal px-5 text-sm font-black text-white">Save Draft</button>
        <button disabled={saving} className="h-12 rounded-xl bg-wine px-5 text-sm font-black text-white disabled:opacity-60">{saving ? 'Saving...' : `${mode} Product`}</button>
      </div>
    </form>
  );
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
