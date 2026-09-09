import { useEffect, useRef, useState } from 'react';
import { CircleCheck, FileText, Hash, ImagePlus, IndianRupee, Tag, Type, X } from 'lucide-react';
import api from '../../services/api';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import ProductSmartFill from './ProductSmartFill';
import { applySmartPatch } from '../../utils/productSmartFill';
import { normalizeImageEntries, normalizeVideoEntries } from '../../services/normalize';
import {
  applyAssistantSuggestions,
  buildAssistantSuggestions,
} from '../../utils/productAssistant';
import { fetchCategories, fetchSubcategories } from '../../utils/catalogOptions';
import { buildVariantMatrix, hasManagedVariants } from '../../utils/variants';
import {
  buildSizeChartPayload,
  getSelectableSizes,
  getSizeChartColumns,
  getSizeChartValidation,
  inferSizeChartProfile,
  reconcileSizeChartRows,
  resolveSizingMode,
  SIZE_CHART_PROFILES,
} from '../../utils/productSizing';

const DRAFT_PREFIX = 'samira-admin-product-draft';

const emptyProduct = {
  name: '',
  slug: '',
  shortDescription: '',
  price: '',
  originalPrice: '',
  costPrice: 0,
  gstRate: 0,
  hsnCode: '',
  barcode: '',
  sku: '',
  brand: 'Samira Collection',
  category: '',
  subCategory: '',
  categoryDefinitionKey: '',
  stock: 0,
  lowStockAlert: 5,
  reorderQuantity: 0,
  shippingWeightKg: 0,
  packageDimensions: { lengthCm: 0, widthCm: 0, heightCm: 0 },
  countryOfOrigin: 'India',
  manufacturerDetails: '',
  warranty: '',
  supplierName: '',
  supplierSku: '',
  restockAt: '',
  publishAt: '',
  saleStartAt: '',
  saleEndAt: '',
  sizes: '',
  sizingMode: 'auto',
  sizeChartProfile: 'auto',
  sizeChart: { unit: 'in', columns: [], rows: [] },
  sizeFitNotes: '',
  colors: '',
  tags: '',
  fabric: '',
  occasion: '',
  description: '',
  attributeValues: {},
  images: [],
  videos: [],
  highlights: [],
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
  variantOptionValues: {},
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
  const [structure, setStructure] = useState(null);
  const [structureError, setStructureError] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState(() => (productId ? emptyProduct : (readDraftForm(productId, apiPrefix) || emptyProduct)));
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
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [errors, setErrors] = useState({});
  const [draftReady, setDraftReady] = useState(() => !productId);
  const [smartFillReset, setSmartFillReset] = useState(0);
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
  const [baseUpdatedAt, setBaseUpdatedAt] = useState('');
  const [recoveryDraft, setRecoveryDraft] = useState(null);
  const baselineRef = useRef(JSON.stringify(emptyProduct));
  const draftKey = getDraftKey(productId, apiPrefix);
  const reloadStructure = () => { setStructureError(''); return api.get('/catalog-configuration').then(setStructure).catch((error) => setStructureError(error.message)); };
  useEffect(() => {
    let alive = true;
    api.get('/catalog-configuration').then((value) => { if (alive) setStructure(value); }).catch((error) => { if (alive) setStructureError(error.message); });
    return () => { alive = false; };
  }, []);
  const productForSizing = (source) => structure?.features?.sizing === false
    ? { ...withCategoryName(source, categories), sizingMode: 'free-size', sizeChartProfile: 'free-size' }
    : withCategoryName(source, categories);

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
    let alive = true;
    if (!productId) {
      setDraftReady(true);
      return;
    }

    setDraftReady(false);
    setLoadError('');
    api.get(`${apiPrefix}/products/${productId}`).then((product) => {
      if (!alive) return;
      const savedDraft = readDraft(productId, apiPrefix);
      const cachedForm = draftFormOf(savedDraft);
      const mergedDraft = {};
      const serverForm = {
        ...emptyProduct,
        ...product,
        ...mergedDraft,
        category: mergedDraft.category ?? (product.category?._id || product.category || ''),
        sizes: mergedDraft.sizes || (product.sizes || []).join(', '),
        sizingMode: mergedDraft.sizingMode || product.sizingMode || 'auto',
        sizeChartProfile: mergedDraft.sizeChartProfile || product.sizeChartProfile || 'auto',
        sizeChart: mergedDraft.sizeChart || product.sizeChart || emptyProduct.sizeChart,
        sizeFitNotes: mergedDraft.sizeFitNotes ?? product.sizeFitNotes ?? '',
        colors: mergedDraft.colors || (product.colors || []).join(', '),
        tags: mergedDraft.tags || (product.tags || []).join(', '),
        highlights: Array.isArray(mergedDraft.highlights) && mergedDraft.highlights.length
          ? mergedDraft.highlights
          : (product.highlights?.length ? product.highlights : emptyProduct.highlights),
        images: normalizeImageEntries((Array.isArray(mergedDraft.images) && mergedDraft.images.length ? mergedDraft.images : product.images) || []),
        videos: normalizeVideoEntries((Array.isArray(mergedDraft.videos) && mergedDraft.videos.length ? mergedDraft.videos : product.videos) || []),
        packageDimensions: { ...emptyProduct.packageDimensions, ...(product.packageDimensions || {}), ...(mergedDraft.packageDimensions || {}) },
        restockAt: toDateTimeInput(mergedDraft.restockAt ?? product.restockAt),
        publishAt: toDateTimeInput(mergedDraft.publishAt ?? product.publishAt),
        saleStartAt: toDateTimeInput(mergedDraft.saleStartAt ?? product.saleStartAt),
        saleEndAt: toDateTimeInput(mergedDraft.saleEndAt ?? product.saleEndAt),
        trackVariants: hasManagedVariants(product) || Boolean(mergedDraft.trackVariants),
        variantOptionValues: Object.keys(mergedDraft.variantOptionValues || {}).length
          ? mergedDraft.variantOptionValues
          : readVariantOptionValues(product.variants || []),
        variants: Array.isArray(mergedDraft.variants) && mergedDraft.variants.length
          ? mergedDraft.variants
          : (product.variants || []),
      };
      setForm(serverForm);
      baselineRef.current = JSON.stringify(serverForm);
      setAssistant({
        category: product.category?.name || product.category || '',
        subCategory: product.subCategory || '',
        color: Array.isArray(product.colors) ? product.colors[0] : splitList(product.colors)[0] || '',
        secondaryColors: Array.isArray(product.colors) ? product.colors.slice(1).join(', ') : splitList(product.colors).slice(1).join(', '),
        fabric: product.fabric || '',
        occasion: product.occasion || '',
        style: product.shortDescription || '',
      });
      setBaseUpdatedAt(product.updatedAt || '');
      const recovery = JSON.stringify(cachedForm || {}) === JSON.stringify(serverForm)
        ? {}
        : mergeDraftIntoProduct(cachedForm);
      if (!Object.keys(recovery).length && savedDraft) clearDraft(productId, apiPrefix);
      setRecoveryDraft(Object.keys(recovery).length ? {
        form: cachedForm,
        savedAt: savedDraft?.__draftMeta?.savedAt || '',
        stale: Boolean(savedDraft?.__draftMeta?.baseUpdatedAt && product.updatedAt && savedDraft.__draftMeta.baseUpdatedAt !== product.updatedAt),
      } : null);
      setDraftReady(true);
    }).catch((error) => { if (alive) setLoadError(error.message); });
    return () => { alive = false; };
  }, [apiPrefix, productId, reload]);

  useEffect(() => {
    if (!draftReady || recoveryDraft) return undefined;
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    if (JSON.stringify(form) === baselineRef.current) return undefined;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({
          __draftMeta: { version: 2, savedAt: new Date().toISOString(), baseUpdatedAt },
          form,
        }));
      } catch {
        // ignore storage quota or privacy mode errors
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [baseUpdatedAt, draftKey, draftReady, form, recoveryDraft]);

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

  const updateVariant = (index, field, value) => {
    setForm((current) => {
      const variants = current.variants.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, [field]: value } : variant
      ));
      return {
        ...current,
        variants,
        stock: variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0),
      };
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

  const updateSizeMeasurement = (sizeLabel, field, value) => {
    setForm((current) => {
      const sizingProduct = withCategoryName(current, categories);
      const columns = getSizeChartColumns(sizingProduct);
      const rows = reconcileSizeChartRows(current.sizeChart?.rows, getSelectableSizes(sizingProduct), columns)
        .map((row) => row.size === sizeLabel ? { ...row, [field]: value } : row);
      return {
        ...current,
        sizeChart: {
          unit: current.sizeChart?.unit === 'cm' ? 'cm' : 'in',
          columns: columns.map((column) => column.key),
          rows,
        },
      };
    });
  };

  const updateSizeChartUnit = (unit) => {
    setForm((current) => ({
      ...current,
      sizeChart: { ...(current.sizeChart || {}), unit: unit === 'cm' ? 'cm' : 'in' },
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
    if (saving || !draftReady || loadError || (mode === 'Update' && !productId)) return;
    if (!structure) { setMessage('Load the store product configuration before saving.'); return; }
    const sizingProduct = productForSizing(form);
    const nextErrors = validate(form, sizingProduct, getActiveAttributeDefinitions(structure, categories, form));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.sizeChart) {
        const missingInput = Array.from(event.currentTarget.querySelectorAll('[data-garment-measurement]'))
          .find(input => !Number.isFinite(Number(input.value)) || Number(input.value) <= 0);
        missingInput?.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'center' });
        missingInput?.focus({ preventScroll: true });
      }
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const price = Number(form.price);
      const originalPrice = Number(form.originalPrice || form.price);
      const sizingMode = resolveSizingMode(sizingProduct);
      const selectableSizes = getSelectableSizes(sizingProduct);
      const tracksVariants = form.trackVariants && (sizingMode === 'sized' || getEffectiveVariantConfig(structure, categories, form).enabled);
      const selectedCategory = categories.find((category) => String(category._id) === String(form.category));
      const payload = {
        ...form,
        images: prepareImages(form.images),
        videos: prepareVideos(form.videos),
        price,
        originalPrice,
        costPrice: Number(form.costPrice || 0),
        gstRate: Number(form.gstRate || 0),
        reorderQuantity: Number(form.reorderQuantity || 0),
        lowStockAlert: Number(form.lowStockAlert),
        shippingWeightKg: Number(form.shippingWeightKg || 0),
        packageDimensions: {
          lengthCm: Number(form.packageDimensions?.lengthCm || 0),
          widthCm: Number(form.packageDimensions?.widthCm || 0),
          heightCm: Number(form.packageDimensions?.heightCm || 0),
        },
        restockAt: nullableDate(form.restockAt),
        publishAt: nullableDate(form.publishAt),
        saleStartAt: nullableDate(form.saleStartAt),
        saleEndAt: nullableDate(form.saleEndAt),
        sizes: sizingMode === 'sized' ? selectableSizes : [],
        sizingMode: structure.features.sizing ? form.sizingMode || 'auto' : 'free-size',
        sizeChartProfile: structure.features.sizing ? form.sizeChartProfile || 'auto' : 'free-size',
        sizeChart: buildSizeChartPayload(sizingProduct),
        colors: splitList(form.colors),
        tags: splitList(form.tags),
        variants: tracksVariants ? form.variants : [],
        stock: tracksVariants
          ? form.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0)
          : Number(form.stock),
        discountPercentage: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
        industry: structure.industry,
        industryRevision: structure.revision,
        categoryDefinitionKey: activeCategoryDefinition?.key || form.categoryDefinitionKey || selectedCategory?.definitionKey || definitionKey(form.subCategory || selectedCategory?.name),
      };
      if (productId && !tracksVariants && sizingMode !== 'sized' && !getEffectiveVariantConfig(structure, categories, form).enabled) delete payload.variants;
      if (!payload.category) delete payload.category;
      if (productId) await api.put(`${apiPrefix}/products/${productId}`, payload);
      else await api.post(`${apiPrefix}/products`, payload);
      if (!productId) setForm(emptyProduct);
      clearDraft(productId, apiPrefix);
      setMessage('Product saved successfully.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveServerDraft = async () => {
    if (saving || mode !== 'Add') return;
    setSaving(true);
    setMessage('');
    try {
      const sizingProduct = productForSizing(form);
      const sizingMode = resolveSizingMode(sizingProduct);
      const tracksVariants = form.trackVariants && (sizingMode === 'sized' || getEffectiveVariantConfig(structure, categories, form).enabled);
      const payload = {
        ...form,
        images: prepareImages(form.images),
        videos: prepareVideos(form.videos),
        price: Number(form.price || 0),
        sellingPrice: Number(form.price || 0),
        originalPrice: Number(form.originalPrice || form.price || 0),
        costPrice: Number(form.costPrice || 0),
        gstRate: Number(form.gstRate || 0),
        stock: tracksVariants ? form.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0) : Number(form.stock || 0),
        lowStockAlert: Number(form.lowStockAlert || 5),
        reorderQuantity: Number(form.reorderQuantity || 0),
        shippingWeightKg: Number(form.shippingWeightKg || 0),
        sizes: sizingMode === 'sized' ? getSelectableSizes(sizingProduct) : [],
        colors: splitList(form.colors),
        tags: splitList(form.tags),
        variants: tracksVariants ? form.variants : [],
        restockAt: nullableDate(form.restockAt),
        publishAt: nullableDate(form.publishAt),
        saleStartAt: nullableDate(form.saleStartAt),
        saleEndAt: nullableDate(form.saleEndAt),
      };
      if (!payload.category) delete payload.category;
      await api.post(`${apiPrefix}/product-drafts`, payload);
      clearDraft(productId, apiPrefix);
      setMessage('Draft saved safely. Open Product Drafts whenever you are ready to complete it.');
      onSaved?.({ draft: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const previewImage = (form.images || []).find((image) => image?.primary)?.url || form.images?.[0]?.url || '';
  const sizingProduct = productForSizing(form);
  const effectiveSizingMode = resolveSizingMode(sizingProduct);
  const inferredSizeProfile = inferSizeChartProfile(sizingProduct);
  const sizeChartColumns = getSizeChartColumns(sizingProduct);
  const selectableSizes = getSelectableSizes(sizingProduct);
  const sizeChartRows = reconcileSizeChartRows(form.sizeChart?.rows, selectableSizes, sizeChartColumns);
  const activeAttributeDefinitions = getActiveAttributeDefinitions(structure, categories, form);
  const effectiveVariantConfiguration = getEffectiveVariantConfig(structure, categories, form);
  const activeCategoryDefinition = findCategoryDefinition(structure, categories, form);
  const availableSubcategories = getConfiguredSubcategories(structure, categories, form, subcategories);
  const checklist = [
    { id: 'photo', label: 'Photo', done: Boolean(previewImage), target: 'product-media', icon: ImagePlus },
    { id: 'name', label: 'Name', done: String(form.name || '').trim().length >= 3, target: 'product-basics', icon: Type },
    { id: 'sku', label: 'SKU', done: Boolean(String(form.sku || '').trim()), target: 'product-basics', icon: Hash },
    { id: 'category', label: 'Category', done: Boolean(form.category), target: 'product-pricing', icon: Tag },
    { id: 'price', label: 'Price', done: Number(form.price) > 0, target: 'product-pricing', icon: IndianRupee },
    { id: 'details', label: 'Details', done: String(form.description || '').trim().length >= 20, target: 'product-basics', icon: FileText },
  ];
  const readyCount = checklist.filter((item) => item.done).length;

  if (mode === 'Update' && !productId) return <p role="alert" className="admin-card p-5">Choose a product from the catalog before editing. <a href={cancelPath} className="underline">Back to catalog</a></p>;
  if (loadError) return <div role="alert" className="admin-card p-5">{loadError} <button type="button" onClick={() => setReload(value => value + 1)} className="admin-btn-ghost">Retry loading product</button></div>;
  if (!draftReady) return <p role="status" className="admin-card p-5">Loading product...</p>;

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

      {recoveryDraft && <div role="alert" className={`admin-form-hint ${recoveryDraft.stale ? 'border-amber-300 bg-amber-50' : ''}`}>
        <div><h3>Unsaved browser draft found</h3><p>{recoveryDraft.stale ? 'The saved product changed after this browser draft was created. Review carefully before applying it.' : `Restore edits${recoveryDraft.savedAt ? ` saved ${new Date(recoveryDraft.savedAt).toLocaleString('en-IN')}` : ''}, or discard them and keep the latest server version.`}</p></div>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="admin-btn" onClick={() => { setForm((current) => ({ ...current, ...mergeDraftIntoProduct(recoveryDraft.form) })); setRecoveryDraft(null); }}>Restore browser edits</button><button type="button" className="admin-btn-ghost" onClick={() => { clearDraft(productId, apiPrefix); setRecoveryDraft(null); }}>Discard browser draft</button></div>
      </div>}

      {Object.keys(errors).length > 0 && <div role="status" aria-live="polite" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><strong>Review {Object.keys(errors).length} highlighted section{Object.keys(errors).length === 1 ? '' : 's'} before saving.</strong><ul className="mt-2 list-disc space-y-1 pl-5">{Object.values(errors).slice(0, 5).map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}

      {structureError && <div role="alert" className="admin-form-hint"><p>{structureError}</p><button type="button" onClick={reloadStructure}>Retry product configuration</button></div>}
      <ProductSmartFill key={`${apiPrefix}-${productId || 'new'}-${smartFillReset}`} form={form} categories={categories} structure={structure} apiPrefix={apiPrefix}
        disabled={saving || !draftReady || !!loadError || !structure}
        onApply={(patch, undo) => { setForm(current => applySmartPatch(current, patch, undo)); setErrors({}); }} />
      {structure?.attributes?.length > 0 && <Section id="product-specifications" title={`${structure.name || 'Product'} specifications`} note="These fields, validation and customer-facing sections come from the active industry and category definition.">
        {errors.attributes && <p role="alert" className="admin-form-hint lg:col-span-2">{errors.attributes}</p>}
        {activeAttributeDefinitions.map((attribute) => <DynamicAttributeField key={attribute.key} attribute={attribute} value={form.attributeValues?.[attribute.key] ?? attribute.defaultValue ?? ''} onChange={(value) => setForm((current) => ({ ...current, attributeValues: { ...current.attributeValues, [attribute.key]: value } }))} />)}
      </Section>}
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
            onChange={(event) => {
              const category = categories.find((item) => String(item._id) === String(event.target.value));
              setForm((current) => ({ ...current, category: event.target.value, subCategory: '', categoryDefinitionKey: category?.definitionKey || definitionKey(category?.name) }));
            }}
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
            onChange={(event) => {
              const subCategory = event.target.value;
              const definition = findCategoryDefinition(structure, categories, { ...form, subCategory, categoryDefinitionKey: '' });
              setForm((current) => ({ ...current, subCategory, categoryDefinitionKey: definition?.key || current.categoryDefinitionKey }));
            }}
            className="admin-field__control"
            placeholder={availableSubcategories.length ? 'Select or type a subcategory' : 'Optional subcategory'}
          />
          <datalist id="product-subcategories">
            {availableSubcategories.map((item) => <option key={item} value={item} />)}
          </datalist>
        </label>
        <Input label="Occasion" value={form.occasion} onChange={(value) => update('occasion', value)} placeholder="Wedding" />
        <Input label="Fabric" value={form.fabric} onChange={(value) => update('fabric', value)} placeholder="Silk" />
        <Input label="Original price" type="number" value={form.originalPrice} onChange={(value) => update('originalPrice', value)} error={errors.originalPrice} placeholder="2499" />
        <Input label="Selling price" type="number" value={form.price} onChange={(value) => update('price', value)} error={errors.price} placeholder="1299" />
        <Input label="Cost price" type="number" min="0" value={form.costPrice || 0} onChange={(value) => update('costPrice', value)} error={errors.costPrice} placeholder="700" />
        <Input label="GST rate (%)" type="number" min="0" max="100" step="0.01" value={form.gstRate || 0} onChange={(value) => update('gstRate', value)} error={errors.gstRate} placeholder="5" />
        <Input label="HSN code" value={form.hsnCode || ''} onChange={(value) => update('hsnCode', value)} placeholder="6204" />
        <Input label="Barcode / GTIN" value={form.barcode || ''} onChange={(value) => update('barcode', value)} placeholder="Scan or enter barcode" />
        <Input label="Stock quantity" type="number" value={form.stock} onChange={(value) => update('stock', value)} error={errors.stock} placeholder="20" />
        <Input label="Low stock alert" type="number" value={form.lowStockAlert} onChange={(value) => update('lowStockAlert', value)} placeholder="5" />
        <Input label="Suggested reorder quantity" type="number" min="0" step="1" value={form.reorderQuantity || 0} onChange={(value) => update('reorderQuantity', value)} error={errors.reorderQuantity} placeholder="10" />
        <Input label="Packed unit weight (kg, 0 uses store default)" type="number" value={form.shippingWeightKg || 0} onChange={value => update('shippingWeightKg', value)} placeholder="0.5" />
        {Number(form.costPrice || 0) > 0 && Number(form.price || 0) > 0 && <div className="admin-form-hint lg:col-span-2"><h3>Estimated gross margin</h3><p>Rs. {Math.max(0, Number(form.price) - Number(form.costPrice)).toLocaleString('en-IN')} per unit · {Math.round(((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100)}% before tax, shipping and payment charges.</p></div>}
        {effectiveSizingMode === 'sized' ? (
          <label className={`admin-flag lg:col-span-2 w-fit${form.trackVariants ? ' is-on' : ''}`}>
            <input type="checkbox" checked={!!form.trackVariants} onChange={(event) => toggleTrackVariants(event.target.checked)} className="accent-rose" />
            Track stock by size and colour
          </label>
        ) : effectiveVariantConfiguration.enabled ? (
          <DynamicVariantEditor
            variantConfiguration={effectiveVariantConfiguration}
            attributes={activeAttributeDefinitions}
            form={form}
            setForm={setForm}
            onUpdateVariant={updateVariant}
          />
        ) : (
          <div className="admin-form-hint lg:col-span-2">
            <h3>One-size inventory</h3>
            <p>This product does not require a size choice. Stock is tracked at product level and colour variants remain optional.</p>
          </div>
        )}
        {effectiveSizingMode === 'sized' && form.trackVariants ? (
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
            <p>Click the upload box or drag images here. Keep up to 20 clear product photos; add up to 8 at a time. JPG, JPEG, PNG or WEBP. Max 2MB each.</p>
          </div>
          <ImageUploader
            label="Choose Product Images"
            helpText="Uploaded images are saved on the backend and only image URLs are stored in MongoDB."
            multiple
            maxFiles={20}
            uploadContext="products"
            uploadPath={uploadPrefix}
            compressAboveMb={2}
            maxUploadMb={20}
            targetSizeMb={0.7}
            value={form.images}
            onChange={(images) => update('images', images)}
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">{form.images.length}/20 images saved. Mark one image as Main for product listing.</p>
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
        {structure?.features?.sizing !== false && <><label className="admin-field">
          <span>Customer sizing</span>
          <select value={form.sizingMode || 'auto'} onChange={(event) => update('sizingMode', event.target.value)} className="admin-field__control">
            <option value="auto">Automatic from product category</option>
            <option value="sized">Customer must select a size</option>
            <option value="free-size">No size selection / free size</option>
          </select>
          <small className="text-xs font-semibold text-slate-500">
            Current behaviour: {effectiveSizingMode === 'sized' ? 'show size choices and size chart' : 'hide size choices'}.
            {effectiveSizingMode === 'sized' && ' For sarees or products without size options, choose No size selection / free size.'}
          </small>
        </label>
        <label className="admin-field">
          <span>Measurement template</span>
          <select
            value={form.sizeChartProfile || 'auto'}
            onChange={(event) => update('sizeChartProfile', event.target.value)}
            disabled={effectiveSizingMode !== 'sized'}
            className="admin-field__control disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="auto">Automatic ({SIZE_CHART_PROFILES[inferredSizeProfile]?.label || 'category based'})</option>
            {Object.entries(SIZE_CHART_PROFILES).map(([value, profile]) => <option key={value} value={value}>{profile.label}</option>)}
          </select>
        </label>
        </>}
        {effectiveSizingMode === 'sized' ? (
          <Input label="Selectable sizes" value={form.sizes} onChange={(value) => update('sizes', value)} error={errors.sizes} placeholder="XS, S, M, L, XL, XXL" />
        ) : (
          <div className="admin-form-hint lg:col-span-2">
            <h3>No size chart required</h3>
            <p>This product does not require garment sizing. Customers can add it without choosing S, M, L or XL.</p>
          </div>
        )}
        <Input label="Colors" value={form.colors} onChange={(value) => update('colors', value)} placeholder="Pink, Maroon, Gold" />
        <Input label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="festive, silk, wedding" />
        <Input label="Care Instructions" value={form.careInstructions} onChange={(value) => update('careInstructions', value)} placeholder="Dry clean preferred" />

        {effectiveSizingMode === 'sized' ? (
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-[#eadfd5] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#f0e5dc] bg-[#fffaf6] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-charcoal">Garment size chart</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Enter the actual finished-garment measurements from your supplier for every available size. Size labels such as S or M do not determine these measurements.</p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-[#ead8cb] bg-white p-1" aria-label="Size chart unit">
                {['in', 'cm'].map((unit) => (
                  <button key={unit} type="button" onClick={() => updateSizeChartUnit(unit)} className={`h-8 rounded-full px-4 text-xs font-black uppercase ${form.sizeChart?.unit === unit ? 'bg-wine text-white' : 'text-slate-500'}`}>{unit}</button>
                ))}
              </div>
            </div>
            {selectableSizes.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-xs">
                  <thead className="bg-[#fbf7f3] text-[10px] uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="sticky left-0 z-10 min-w-20 bg-[#fbf7f3] p-3">Size</th>
                      {sizeChartColumns.map((column) => <th key={column.key} className="min-w-32 p-3">{column.label}<span className="ml-1 normal-case">({form.sizeChart?.unit || 'in'})</span></th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChartRows.map((row) => (
                      <tr key={row.size} className="border-t border-[#f3ebe3]">
                        <th className="sticky left-0 z-10 bg-white p-3 text-sm font-black text-charcoal">{row.size}</th>
                        {sizeChartColumns.map((column) => (
                          <td key={column.key} className="p-2">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={row[column.key] ?? ''}
                              onChange={(event) => updateSizeMeasurement(row.size, column.key, event.target.value)}
                              aria-label={`${row.size} ${column.label}`}
                              data-garment-measurement="true"
                              aria-invalid={!!errors.sizeChart && (!Number.isFinite(Number(row[column.key])) || Number(row[column.key]) <= 0)}
                              className="h-10 w-28 rounded-lg border border-[#e5d8cf] px-3 font-bold outline-none focus:border-wine focus:ring-2 focus:ring-wine/10"
                              placeholder="0.0"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-4 text-xs font-semibold text-amber-700">Add the selectable sizes above to generate measurement rows.</p>
            )}
            <div className="border-t border-[#f0e5dc] p-4">
              <label className="admin-field">
                <span>Fit and measurement note</span>
                <textarea value={form.sizeFitNotes || ''} onChange={(event) => update('sizeFitNotes', event.target.value)} className="admin-field__control min-h-20" placeholder="Example: Garment measurements. Choose one size larger for a relaxed fit." />
              </label>
              {errors.sizeChart ? <p role="alert" className="admin-field__error mt-2">{errors.sizeChart}</p> : null}
            </div>
          </div>
        ) : null}
      </Section>

      <Section id="product-fulfilment" step="04" title="Shipping, Supplier and Schedule" note="Operational details used for courier planning, restocking and controlled publishing.">
        <Input label="Package length (cm)" type="number" min="0" step="0.1" value={form.packageDimensions?.lengthCm || 0} onChange={(value) => updateNested(setForm, 'packageDimensions', 'lengthCm', value)} error={errors.packageDimensions} />
        <Input label="Package width (cm)" type="number" min="0" step="0.1" value={form.packageDimensions?.widthCm || 0} onChange={(value) => updateNested(setForm, 'packageDimensions', 'widthCm', value)} />
        <Input label="Package height (cm)" type="number" min="0" step="0.1" value={form.packageDimensions?.heightCm || 0} onChange={(value) => updateNested(setForm, 'packageDimensions', 'heightCm', value)} />
        <Input label="Country of origin" value={form.countryOfOrigin || ''} onChange={(value) => update('countryOfOrigin', value)} placeholder="India" />
        <Input label="Supplier name" value={form.supplierName || ''} onChange={(value) => update('supplierName', value)} placeholder="Optional internal reference" />
        <Input label="Supplier SKU" value={form.supplierSku || ''} onChange={(value) => update('supplierSku', value)} placeholder="Supplier item code" />
        <Input label="Expected restock" type="datetime-local" value={form.restockAt || ''} onChange={(value) => update('restockAt', value)} />
        <Input label="Publish on" type="datetime-local" value={form.publishAt || ''} onChange={(value) => update('publishAt', value)} />
        <Input label="Sale starts" type="datetime-local" value={form.saleStartAt || ''} onChange={(value) => update('saleStartAt', value)} />
        <Input label="Sale ends" type="datetime-local" value={form.saleEndAt || ''} onChange={(value) => update('saleEndAt', value)} error={errors.saleEndAt} />
        <label className="admin-field lg:col-span-2"><span>Manufacturer / importer details</span><textarea value={form.manufacturerDetails || ''} onChange={(event) => update('manufacturerDetails', event.target.value)} className="admin-field__control" placeholder="Name and address shown where legally required" /></label>
        <Input label="Warranty / guarantee" value={form.warranty || ''} onChange={(value) => update('warranty', value)} placeholder="Example: 6 months manufacturer warranty" />
      </Section>

      {structure?.industry !== 'fashion' ? null : <details className="admin-form-card"><summary className="cursor-pointer font-bold text-wine">Manual copy builder</summary><Section step="05" title="Build copy from your details" note="Optional templates. Review generated wording and product options before applying.">
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
      </Section></details>}

      <Section step="06" title="Highlights, Policy and SEO" note="Storefront extras and catalog flags.">
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
        <button type="button" onClick={() => { setForm(JSON.parse(baselineRef.current)); clearDraft(productId, apiPrefix); setRecoveryDraft(null); setSmartFillReset(value => value + 1); }} className="admin-btn-ghost">Reset</button>
        {mode === 'Add' && apiPrefix === '/admin' && <button type="button" disabled={saving || !structure} onClick={saveServerDraft} className="admin-btn-ghost disabled:opacity-60">Save Draft</button>}
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

function Input({ label, value, onChange, placeholder, type = 'text', required = false, error, min, max, step }) {
  return (
    <label className="admin-field">
      <span>{label}{required ? <em>*</em> : null}</span>
      <input
        required={required}
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`admin-field__control${error ? ' is-error' : ''}`}
        placeholder={placeholder}
      />
      {error && <span className="admin-field__error">{error}</span>}
    </label>
  );
}

function DynamicAttributeField({ attribute, value, onChange }) {
  const label = (
    <span>
      {attribute.label}{attribute.unit ? ` (${attribute.unit})` : ''}{attribute.required ? <em>*</em> : null}
    </span>
  );
  const common = {
    value: value ?? '',
    required: Boolean(attribute.required),
    onChange: (event) => onChange(event.target.value),
    className: 'admin-field__control',
  };

  if (attribute.type === 'boolean') {
    return <label className="admin-field">{label}<select {...common}><option value="">Choose</option><option value="Yes">Yes</option><option value="No">No</option></select></label>;
  }
  if (attribute.type === 'dropdown') {
    return <label className="admin-field">{label}<select {...common}><option value="">Choose {attribute.label.toLowerCase()}</option>{(attribute.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  }
  if (attribute.type === 'multi_select') {
    const selected = new Set(splitList(value));
    if (attribute.options?.length) {
      return (
        <fieldset className="admin-field">
          <legend>{label}</legend>
          <div className="flex flex-wrap gap-2 rounded-xl border border-[#eadfd5] bg-white p-3">
            {attribute.options.map((option) => (
              <label key={option} className={`admin-flag ${selected.has(option) ? 'is-on' : ''}`}>
                <input type="checkbox" checked={selected.has(option)} onChange={() => {
                  const next = new Set(selected);
                  if (next.has(option)) next.delete(option); else next.add(option);
                  onChange(Array.from(next).join(', '));
                }} />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    return <label className="admin-field">{label}<input {...common} placeholder="Enter comma-separated values" /></label>;
  }
  if (attribute.type === 'textarea') {
    return <label className="admin-field lg:col-span-2">{label}<textarea {...common} rows={4} /></label>;
  }
  const numeric = ['number', 'measurement', 'range'].includes(attribute.type);
  return (
    <label className="admin-field">
      {label}
      <input
        {...common}
        type={attribute.type === 'date' ? 'date' : attribute.type === 'color' ? 'text' : numeric ? 'number' : 'text'}
        min={numeric ? attribute.validation?.min : undefined}
        max={numeric ? attribute.validation?.max : undefined}
        minLength={!numeric ? attribute.validation?.minLength : undefined}
        maxLength={!numeric ? attribute.validation?.maxLength : undefined}
        placeholder={attribute.type === 'color' ? 'Example: Midnight Blue or #14213d' : ''}
      />
    </label>
  );
}

function DynamicVariantEditor({ variantConfiguration, attributes, form, setForm, onUpdateVariant }) {
  const variantKeys = variantConfiguration?.attributes || [];
  const definitions = variantKeys.map((key) => attributes.find((item) => item.key === key)).filter(Boolean);
  const optionValues = form.variantOptionValues || {};
  const maxCombinations = Number(variantConfiguration?.maxCombinations || 120);
  const generate = () => {
    const variants = buildDynamicVariantMatrix(definitions, optionValues, form.variants, form.sku, maxCombinations);
    setForm((current) => ({
      ...current,
      trackVariants: true,
      variants,
      stock: variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0),
    }));
  };

  return (
    <div className="lg:col-span-2 rounded-2xl border border-[#eadfd5] bg-[#fffaf6] p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h3 className="font-bold text-charcoal">Variant inventory</h3><p className="mt-1 text-xs text-slate-500">Create only the combinations you sell. Every row can have its own SKU, price and stock.</p></div>
        <button type="button" onClick={generate} className="admin-btn-secondary h-10">Generate combinations</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {definitions.map((definition) => (
          <label key={definition.key} className="admin-field">
            <span>{definition.label} options</span>
            <input
              value={optionValues[definition.key] || ''}
              onChange={(event) => setForm((current) => ({ ...current, variantOptionValues: { ...(current.variantOptionValues || {}), [definition.key]: event.target.value } }))}
              className="admin-field__control"
              placeholder={(definition.options || []).slice(0, 3).join(', ') || 'Comma-separated values'}
            />
          </label>
        ))}
      </div>
      {form.trackVariants && form.variants?.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {form.variants.map((variant, index) => (
            <article key={dynamicVariantKey(variant.optionValues)} className="rounded-xl border border-[#eadfd5] bg-white p-3">
              <strong className="block truncate text-sm text-charcoal" title={formatVariantOptions(variant.optionValues)}>{formatVariantOptions(variant.optionValues)}</strong>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CompactVariantInput label="SKU" value={variant.sku} onChange={(value) => onUpdateVariant(index, 'sku', value)} />
                <CompactVariantInput label="Stock" type="number" value={variant.stock} onChange={(value) => onUpdateVariant(index, 'stock', Math.max(0, Number(value || 0)))} />
                <CompactVariantInput label="Selling price" type="number" value={variant.price} onChange={(value) => onUpdateVariant(index, 'price', value)} />
                <CompactVariantInput label="MRP" type="number" value={variant.originalPrice} onChange={(value) => onUpdateVariant(index, 'originalPrice', value)} />
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={variant.isActive !== false} onChange={(event) => onUpdateVariant(index, 'isActive', event.target.checked)} /> Available for sale</label>
            </article>
          ))}
        </div>
      ) : <p className="mt-4 text-xs font-semibold text-slate-500">Add option values and generate combinations. Nothing is created automatically.</p>}
    </div>
  );
}

function CompactVariantInput({ label, value, onChange, type = 'text' }) {
  return <label className="grid gap-1 text-[11px] font-semibold text-slate-500"><span>{label}</span><input type={type} min={type === 'number' ? 0 : undefined} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-0 rounded-lg border border-[#eadfd5] px-2 text-xs text-charcoal" /></label>;
}

function getActiveAttributeDefinitions(structure, categories = [], form = {}) {
  const categoryDefinition = findCategoryDefinition(structure, categories, form);
  const merged = new Map((structure?.attributes || []).map((item) => [item.key, item]));
  const chain = [];
  let cursor = categoryDefinition;
  while (cursor && chain.length < 12) {
    chain.unshift(cursor);
    const parentKey = cursor.parentKey;
    cursor = parentKey ? (structure?.categoryDefinitions || []).find((item) => item.key === parentKey) : null;
  }
  chain.forEach((layer) => (layer.attributes || []).forEach((item) => {
    if (typeof item === 'object' && item.key) merged.set(item.key, { ...(merged.get(item.key) || {}), ...item });
  }));
  return Array.from(merged.values()).filter((item) => item.active !== false).sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
}

function getEffectiveVariantConfig(structure, categories = [], form = {}) {
  const attributes = getActiveAttributeDefinitions(structure, categories, form);
  const categoryDefinition = findCategoryDefinition(structure, categories, form);
  const inheritedVariantKeys = [];
  let cursor = categoryDefinition;
  while (cursor && inheritedVariantKeys.length < 12) {
    if (cursor.variantAttributes?.length) inheritedVariantKeys.unshift(...cursor.variantAttributes);
    const parentKey = cursor.parentKey;
    cursor = parentKey ? (structure?.categoryDefinitions || []).find((item) => item.key === parentKey) : null;
  }
  const requested = inheritedVariantKeys.length ? Array.from(new Set(inheritedVariantKeys)) : (structure?.variantConfig?.attributes || []);
  const allowed = new Set(attributes.filter((attribute) => attribute.variant).map((attribute) => attribute.key));
  const selected = requested.filter((key) => allowed.has(key));
  return { ...(structure?.variantConfig || {}), enabled: selected.length > 0, attributes: selected };
}

function findCategoryDefinition(structure, categories = [], form = {}) {
  const definitions = structure?.categoryDefinitions || [];
  const selectedCategory = categories.find((category) => String(category._id) === String(form.category));
  const subcategory = String(form.subCategory || '').trim().toLowerCase();
  if (subcategory) {
    const child = definitions.find((item) => item.key === definitionKey(subcategory) || String(item.name || '').trim().toLowerCase() === subcategory);
    if (child) return child;
  }
  const lookupKeys = [form.categoryDefinitionKey, selectedCategory?.definitionKey, definitionKey(selectedCategory?.name)].filter(Boolean);
  for (const lookupKey of lookupKeys) {
    const match = definitions.find((item) => item.key === lookupKey);
    if (match) return match;
  }
  return null;
}

function getConfiguredSubcategories(structure, categories = [], form = {}, saved = []) {
  const selectedCategory = categories.find((category) => String(category._id) === String(form.category));
  const parent = (structure?.categoryDefinitions || []).find((item) => (
    item.key === selectedCategory?.definitionKey
    || item.key === definitionKey(selectedCategory?.name)
  ));
  const configured = parent
    ? (structure?.categoryDefinitions || []).filter((item) => item.parentKey === parent.key && item.active !== false).map((item) => item.name)
    : [];
  return Array.from(new Set([...(saved || []), ...configured].map((item) => String(item || '').trim()).filter(Boolean)));
}

function buildDynamicVariantMatrix(definitions, values, existing = [], baseSku = '', max = 120) {
  const lists = definitions.map((definition) => splitList(values[definition.key]));
  if (!lists.length || lists.some((list) => !list.length)) return [];
  const combinations = lists.reduce((rows, options, index) => rows.flatMap((row) => options.map((option) => ({ ...row, [definitions[index].key]: option }))), [{}]).slice(0, max);
  const byKey = new Map((existing || []).map((variant) => [dynamicVariantKey(variant.optionValues || {}), variant]));
  return combinations.map((optionValues) => {
    const current = byKey.get(dynamicVariantKey(optionValues));
    const suffix = Object.values(optionValues).map((value) => String(value).replace(/[^a-z0-9]+/gi, '').toUpperCase()).filter(Boolean).join('-');
    const colour = optionValues.colour || optionValues.color || optionValues.shade || '';
    const size = optionValues.size || '';
    return {
      ...(current?._id ? { _id: current._id } : {}),
      optionValues,
      size,
      color: colour,
      sku: current?.sku || [baseSku, suffix].filter(Boolean).join('-'),
      stock: current?.stock ?? 0,
      price: current?.price ?? '',
      originalPrice: current?.originalPrice ?? '',
      images: current?.images || [],
      isActive: current?.isActive !== false,
    };
  });
}

function readVariantOptionValues(variants = []) {
  const result = {};
  variants.forEach((variant) => Object.entries(variant.optionValues || {}).forEach(([key, value]) => {
    result[key] = Array.from(new Set([...(splitList(result[key])), String(value || '').trim()].filter(Boolean))).join(', ');
  }));
  return result;
}

function dynamicVariantKey(values = {}) {
  return Object.entries(values).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${String(value).trim().toLowerCase()}`).join('|');
}

function formatVariantOptions(values = {}) {
  return Object.values(values || {}).filter(Boolean).join(' · ') || 'Variant';
}

function definitionKey(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function validate(form, sizingProduct = form, attributes = []) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Product name must be at least 3 characters.';
  if (!form.sku.trim()) errors.sku = 'SKU is required.';
  if (!form.category) errors.category = 'Category is required.';
  if (!Number(form.originalPrice)) errors.originalPrice = 'Original price is required.';
  if (!Number(form.price)) errors.price = 'Selling price is required.';
  if (Number(form.price) > Number(form.originalPrice)) errors.price = 'Selling price cannot exceed original price.';
  if (Number(form.stock) < 0) errors.stock = 'Stock cannot be negative.';
  if (!Number.isFinite(Number(form.costPrice || 0)) || Number(form.costPrice || 0) < 0) errors.costPrice = 'Cost price must be zero or more.';
  if (!Number.isFinite(Number(form.gstRate || 0)) || Number(form.gstRate || 0) < 0 || Number(form.gstRate || 0) > 100) errors.gstRate = 'GST rate must be between 0 and 100.';
  if (!Number.isSafeInteger(Number(form.reorderQuantity || 0)) || Number(form.reorderQuantity || 0) < 0) errors.reorderQuantity = 'Use a whole number of zero or more.';
  if (Object.values(form.packageDimensions || {}).some((value) => !Number.isFinite(Number(value || 0)) || Number(value || 0) < 0 || Number(value || 0) > 1000)) errors.packageDimensions = 'Package dimensions must be between 0 and 1000 cm.';
  if (form.saleStartAt && form.saleEndAt && new Date(form.saleStartAt) >= new Date(form.saleEndAt)) errors.saleEndAt = 'Sale end must be after sale start.';
  if (!form.images.length) errors.images = 'Upload at least one product image.';
  if (form.description.trim().length < 20) errors.description = 'Description must be at least 20 characters.';
  const missingAttribute = attributes.find((attribute) => attribute.required && !String(form.attributeValues?.[attribute.key] ?? '').trim());
  if (missingAttribute) errors.attributes = `Enter ${missingAttribute.label}.`;
  if (resolveSizingMode(sizingProduct) === 'sized') {
    const sizeValidation = getSizeChartValidation(sizingProduct);
    if (!getSelectableSizes(sizingProduct).length) errors.sizes = 'Add at least one selectable size.';
    if (!sizeValidation.valid && sizeValidation.missing.length) {
      const sample = sizeValidation.missing.slice(0, 3).join(', ');
      errors.sizeChart = `Complete every measurement before saving. Missing: ${sample}${sizeValidation.missing.length > 3 ? ` and ${sizeValidation.missing.length - 3} more` : ''}.`;
    }
  }
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
    ...(image.sourceFrame ? { sourceFrame: image.sourceFrame } : {}),
  }));
}

function updateNested(setter, parent, field, value) {
  setter((current) => ({ ...current, [parent]: { ...(current[parent] || {}), [field]: value } }));
}

function nullableDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getDraftKey(productId, apiPrefix = '/admin') {
  return `${DRAFT_PREFIX}${apiPrefix === '/admin' ? '' : ':' + apiPrefix}:${productId || 'new'}`;
}

function readDraft(productId, apiPrefix) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getDraftKey(productId, apiPrefix));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function draftFormOf(record) {
  return record?.__draftMeta && record.form && typeof record.form === 'object' ? record.form : record;
}

function readDraftForm(productId, apiPrefix) {
  return draftFormOf(readDraft(productId, apiPrefix));
}

function clearDraft(productId, apiPrefix) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getDraftKey(productId, apiPrefix));
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
      continue;
    }

    if (value && typeof value === 'object') {
      merged[key] = value;
    }
  }

  return merged;
}

function withCategoryName(form, categories = []) {
  const selected = categories.find((category) => String(category._id) === String(form.category));
  return { ...form, category: selected?.name || form.category || '' };
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

    if (value && typeof value === 'object') {
      return JSON.stringify(value) !== JSON.stringify(defaultValue);
    }

    return false;
  });
}
