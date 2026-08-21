import { useEffect, useState } from 'react';
import { CircleCheck, FileText, Hash, ImagePlus, IndianRupee, Tag, Type, X } from 'lucide-react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import { normalizeImageEntries, normalizeVideoEntries } from '../../services/normalize';
import {
  applyAssistantSuggestions,
  buildAssistantSuggestions,
} from '../../utils/productAssistant';
import { fetchCategories, fetchSubcategories } from '../../utils/catalogOptions';
import { buildVariantMatrix, hasManagedVariants } from '../../utils/variants';

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
  trackVariants: false,
  variants: [],
};

export default function ProductForm({
  mode = 'Add',
  productId,
  onSaved,
  onCancel,
  apiPrefix = '/admin',
  uploadPrefix = '/admin/uploads',
  cancelPath = '/admin/products',
}) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
    let alive = true;
    fetchCategories(api, apiPrefix).then((items) => {
      if (alive) setCategories(items);
    });
    return () => { alive = false; };
  }, [apiPrefix]);

  useEffect(() => {
    let alive = true;
    fetchSubcategories(api, form.category, apiPrefix).then((items) => {
      if (alive) setSubcategories(items);
    });
    return () => { alive = false; };
  }, [apiPrefix, form.category]);

  useEffect(() => {
    if (!productId) {
      setDraftReady(true);
      return;
    }

    setDraftReady(false);
    api.get(`${apiPrefix}/products/${productId}`).then((product) => {
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
        trackVariants: hasManagedVariants(product) || Boolean(mergedDraft.trackVariants),
        variants: Array.isArray(mergedDraft.variants) && mergedDraft.variants.length
          ? mergedDraft.variants
          : (product.variants || []),
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
  }, [apiPrefix, productId]);

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

  const update = (field, value) => setForm((current) => {
    const next = { ...current, [field]: value };
    if ((field === 'sizes' || field === 'colors') && current.trackVariants) {
      next.variants = buildVariantMatrix(splitList(field === 'sizes' ? value : current.sizes), splitList(field === 'colors' ? value : current.colors), current.variants);
      next.stock = next.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0);
    }
    return next;
  });

  const updateVariantStock = (index, stock) => {
    setForm((current) => {
      const variants = current.variants.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, stock: Math.max(0, Number(stock || 0)) } : variant
      ));
      return { ...current, variants, stock: variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0) };
    });
  };

  const toggleTrackVariants = (enabled) => {
    setForm((current) => ({
      ...current,
      trackVariants: enabled,
      variants: enabled
        ? buildVariantMatrix(splitList(current.sizes), splitList(current.colors), current.variants)
        : [],
    }));
  };

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
        lowStockAlert: Number(form.lowStockAlert),
        sizes: splitList(form.sizes),
        colors: splitList(form.colors),
        tags: splitList(form.tags),
        variants: form.trackVariants ? form.variants : [],
        stock: form.trackVariants
          ? form.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0)
          : Number(form.stock),
        discountPercentage: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      };
      if (!payload.category) delete payload.category;
      if (productId) await api.put(`${apiPrefix}/products/${productId}`, payload);
      else await api.post(`${apiPrefix}/products`, payload);
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

  const previewImage = (form.images || []).find((image) => image?.primary)?.url || form.images?.[0]?.url || '';
  const checklist = [
    { id: 'photo', label: 'Photo', done: Boolean(previewImage), target: 'product-media', icon: ImagePlus },
    { id: 'name', label: 'Name', done: String(form.name || '').trim().length >= 3, target: 'product-basics', icon: Type },
    { id: 'sku', label: 'SKU', done: Boolean(String(form.sku || '').trim()), target: 'product-basics', icon: Hash },
    { id: 'category', label: 'Category', done: Boolean(form.category), target: 'product-pricing', icon: Tag },
    { id: 'price', label: 'Price', done: Number(form.price) > 0, target: 'product-pricing', icon: IndianRupee },
    { id: 'details', label: 'Details', done: String(form.description || '').trim().length >= 20, target: 'product-basics', icon: FileText },
  ];
  const readyCount = checklist.filter((item) => item.done).length;

  return (
    <form onSubmit={submit} className="admin-product-form">
      <div className="admin-form-guide" role="status">
        <div className="admin-form-guide__progress">
          <span className={`admin-form-guide__count${readyCount === checklist.length ? ' is-ready' : ''}`}>
            {readyCount === checklist.length ? <CircleCheck className="h-4 w-4" /> : `${readyCount}/${checklist.length}`}
          </span>
          <span>{readyCount === checklist.length ? 'Ready to save' : 'Still needed'}</span>
        </div>
        <div className="admin-form-guide__chips">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-form-chip${item.done ? ' is-done' : ''}`}
                title={item.done ? `${item.label} added` : `Jump to ${item.label.toLowerCase()}`}
                aria-label={item.done ? `${item.label} added` : `${item.label} still needed`}
                onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <span className="admin-form-chip__icon">
                  {item.id === 'photo' && previewImage ? <img src={previewImage} alt="" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <Section id="product-basics" step="01" title="Basic Information" note="Name, SKU and the story customers will read.">
        <Input label="Product name" value={form.name} onChange={(value) => update('name', value)} error={errors.name} placeholder="Royal Zari Silk Saree" required />
        <Input label="Slug" value={form.slug} onChange={(value) => update('slug', value)} placeholder="leave blank for auto slug" />
        <Input label="SKU" value={form.sku} onChange={(value) => update('sku', value)} error={errors.sku} placeholder="SC-0101" />
        <Input label="Brand" value={form.brand} onChange={(value) => update('brand', value)} />
        <Input label="Short Description" value={form.shortDescription} onChange={(value) => update('shortDescription', value)} placeholder="Premium festive wear" />
        <label className="admin-field lg:col-span-2">
          <span>Full Description</span>
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            className={`admin-field__control${errors.description ? ' is-error' : ''}`}
            placeholder="Write fabric, fit, finish and occasion details"
          />
          {errors.description && <span className="admin-field__error">{errors.description}</span>}
        </label>
      </Section>

      <Section id="product-pricing" step="02" title="Category, Pricing and Inventory" note="Where it sits in the catalog and how it is sold.">
        <label className="admin-field">
          <span>Category<em>*</em></span>
          <select
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            className={`admin-field__control${errors.category ? ' is-error' : ''}`}
          >
            <option value="">Select category</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          {errors.category && <span className="admin-field__error">{errors.category}</span>}
        </label>
        <label className="admin-field">
          <span>Subcategory</span>
          <input
            list="product-subcategories"
            value={form.subCategory}
            onChange={(event) => update('subCategory', event.target.value)}
            className="admin-field__control"
            placeholder={subcategories.length ? 'Select or type a subcategory' : 'Festive Wear'}
          />
          <datalist id="product-subcategories">
            {subcategories.map((item) => <option key={item} value={item} />)}
          </datalist>
        </label>
        <Input label="Occasion" value={form.occasion} onChange={(value) => update('occasion', value)} placeholder="Wedding" />
        <Input label="Fabric" value={form.fabric} onChange={(value) => update('fabric', value)} placeholder="Silk" />
        <Input label="Original price" type="number" value={form.originalPrice} onChange={(value) => update('originalPrice', value)} error={errors.originalPrice} placeholder="2499" />
        <Input label="Selling price" type="number" value={form.price} onChange={(value) => update('price', value)} error={errors.price} placeholder="1299" />
        <Input label="Stock quantity" type="number" value={form.stock} onChange={(value) => update('stock', value)} error={errors.stock} placeholder="20" />
        <Input label="Low stock alert" type="number" value={form.lowStockAlert} onChange={(value) => update('lowStockAlert', value)} placeholder="5" />
        <label className={`admin-flag lg:col-span-2 w-fit${form.trackVariants ? ' is-on' : ''}`}>
          <input type="checkbox" checked={!!form.trackVariants} onChange={(event) => toggleTrackVariants(event.target.checked)} className="accent-rose" />
          Track stock by size and colour
        </label>
        {form.trackVariants ? (
          <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-[#eadfd5]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#fffaf4] text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr><th className="p-3">Size</th><th className="p-3">Colour</th><th className="p-3">Stock</th></tr>
              </thead>
              <tbody>
                {(form.variants || []).map((variant, index) => (
                  <tr key={`${variant.size}-${variant.color}-${index}`} className="border-t border-[#f3ebe3]">
                    <td className="p-3 font-bold">{variant.size}</td>
                    <td className="p-3">{variant.color}</td>
                    <td className="p-3">
                      <input type="number" min="0" value={variant.stock} onChange={(event) => updateVariantStock(index, event.target.value)} className="admin-field__control h-10 w-24 min-h-10 px-3" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-3 py-2 text-xs font-semibold text-slate-500">Total units: {form.stock || 0}. Leave a combination at 0 to hide it from checkout.</p>
          </div>
        ) : null}
      </Section>

      <Section id="product-media" step="03" title="Product Images, Sizes and Colors" note="Photos first, then the options customers pick.">
        <div className="lg:col-span-2">
          <div className="admin-form-hint mb-3">
            <h3>Product images</h3>
            <p>Click the upload box or drag images here. Upload 1 to 8 clear photos. JPG, JPEG, PNG or WEBP. Max 2MB each.</p>
          </div>
          <ImageUploader
            label="Choose Product Images"
            helpText="Uploaded images are saved on the backend and only image URLs are stored in MongoDB."
            multiple
            maxFiles={8}
            uploadContext="products"
            uploadPath={uploadPrefix}
            compressAboveMb={2}
            maxUploadMb={20}
            targetSizeMb={0.7}
            value={form.images}
            onChange={(images) => update('images', images)}
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">{form.images.length}/8 images uploaded. Mark one image as Main for product listing.</p>
          {errors.images && <p className="admin-field__error mt-2">{errors.images}</p>}
        </div>
        <div className="lg:col-span-2">
          <div className="admin-form-hint mb-3">
            <h3>Product videos</h3>
            <p>Optional. Upload up to 2 short videos. MP4, WEBM or MOV. Max 20MB each.</p>
          </div>
          <VideoUploader
            label="Choose Product Videos"
            helpText="Videos are uploaded to the backend and only video URLs are stored in MongoDB."
            multiple
            maxFiles={2}
            uploadContext="product-videos"
            uploadPath={`${uploadPrefix}/videos`}
            value={form.videos}
            onChange={(videos) => update('videos', videos)}
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">{form.videos.length}/2 videos uploaded.</p>
        </div>
        <Input label="Sizes" value={form.sizes} onChange={(value) => update('sizes', value)} placeholder="XS, S, M, L, XL, Free Size" />
        <Input label="Colors" value={form.colors} onChange={(value) => update('colors', value)} placeholder="Pink, Maroon, Gold" />
        <Input label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="festive, silk, wedding" />
        <Input label="Care Instructions" value={form.careInstructions} onChange={(value) => update('careInstructions', value)} placeholder="Dry clean preferred" />
      </Section>

      <Section step="04" title="Smart Product Assistant" note="Optional. Fill empty fields from a few basic details.">
        <div className="admin-form-hint lg:col-span-2">
          <h3>Generate title, description, tags and SEO</h3>
          <p>Use any details you know. Existing manual values stay unless you choose to replace them.</p>
        </div>
        <label className="admin-field">
          <span>Category</span>
          <select
            value={assistant.category}
            onChange={(event) => updateAssistant('category', event.target.value)}
            className="admin-field__control"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Subcategory</span>
          <input
            list="assistant-subcategories"
            value={assistant.subCategory}
            onChange={(event) => updateAssistant('subCategory', event.target.value)}
            className="admin-field__control"
            placeholder={subcategories.length ? 'Select or type a subcategory' : 'Optional'}
          />
          <datalist id="assistant-subcategories">
            {subcategories.map((item) => <option key={`assistant-${item}`} value={item} />)}
          </datalist>
        </label>
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
            className="admin-btn"
          >
            Generate Smart Details
          </button>
          <button
            type="button"
            onClick={generateAssistant}
            className="admin-btn-ghost"
          >
            Preview Suggestions
          </button>
        </div>
      </Section>

      <Section step="05" title="Highlights, Policy and SEO" note="Storefront extras and catalog flags.">
        <Input label="Highlights" value={form.highlights.join(', ')} onChange={(value) => update('highlights', splitList(value))} placeholder="Premium fabric, Easy wash care" />
        <Input label="Return Policy" value={form.returnPolicy} onChange={(value) => update('returnPolicy', value)} placeholder="7 days return/exchange" />
        <Input label="Meta Title" value={form.metaTitle} onChange={(value) => update('metaTitle', value)} />
        <Input label="Meta Keywords" value={form.metaKeywords} onChange={(value) => update('metaKeywords', value)} />
        <label className="admin-field lg:col-span-2">
          <span>Meta Description</span>
          <textarea value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} className="admin-field__control" />
        </label>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          {[
            ['isFeatured', 'Featured'],
            ['isNewArrival', 'New Arrival'],
            ['isBestSeller', 'Best Seller'],
            ['showOnHomepage', 'Homepage'],
            ['showInTrending', 'Trending'],
            ['showInFestive', 'Festive'],
            ['isActive', 'Active'],
          ].map(([field, label]) => (
            <label key={field} className={`admin-flag${form[field] ? ' is-on' : ''}`}>
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

      {message && <p className="rounded-2xl border border-[#eadfd5] bg-white px-4 py-3 text-sm font-semibold text-wine">{message}</p>}
      <div className="admin-form-actions">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="admin-btn-ghost">
            Cancel
          </button>
        ) : (
          <a href={cancelPath} className="admin-btn-ghost">Cancel</a>
        )}
        <button type="button" onClick={() => setForm(emptyProduct)} className="admin-btn-ghost">Reset</button>
        <button type="button" onClick={() => { update('isActive', false); setTimeout(() => document.querySelector('form')?.requestSubmit(), 0); }} className="admin-btn-ghost">Save Draft</button>
        <button disabled={saving} className="admin-btn disabled:opacity-60">{saving ? 'Saving...' : `${mode} Product`}</button>
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

function Section({ id, title, note, step, children }) {
  return (
    <section id={id} className="admin-form-card">
      <header className="admin-form-card__head">
        {step ? <span className="admin-form-card__step">{step}</span> : null}
        <div>
          <h2>{title}</h2>
          {note ? <p className="admin-form-card__note">{note}</p> : null}
        </div>
      </header>
      <div className="admin-form-grid">{children}</div>
    </section>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', required = false, error }) {
  return (
    <label className="admin-field">
      <span>{label}{required ? <em>*</em> : null}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`admin-field__control${error ? ' is-error' : ''}`}
        placeholder={placeholder}
      />
      {error && <span className="admin-field__error">{error}</span>}
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
