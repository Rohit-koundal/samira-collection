import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Banknote, Check, Package, PackageCheck, PackageSearch, Plus, SlidersHorizontal, Square, Trash2, PencilLine, X, Camera, MessageSquareText, PackageX, EyeOff } from 'lucide-react';
import api from '../../services/api';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import StatusBadge from '../../components/admin/StatusBadge';
import ProductForm from '../../components/admin/ProductForm';
import { Select as UiSelect } from '../../components/ui/Field';
import { asCatalogList, fetchCategories } from '../../utils/catalogOptions';
import { getPrimaryImageUrl } from '../../services/normalize';
import ProductPosterModal from '../../components/admin/ProductPosterModal';
import ProductCaptionModal from '../../components/admin/ProductCaptionModal';
import StockInput from '../../components/admin/StockInput';
import PageState from '../../components/ui/PageState';

const pageSize = 10;

export default function Products({ route = '/admin/products' }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const routeSearch = new URLSearchParams(route.split('?')[1] || '').get('search') || '';
  const [query, setQuery] = useState(routeSearch);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [stock, setStock] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('Add');
  const [editorProductId, setEditorProductId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [settings, setSettings] = useState(null);
  const [posterProduct, setPosterProduct] = useState(null);
  const [captionProduct, setCaptionProduct] = useState(null);
  const [loadError, setLoadError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [items, categoryItems] = await Promise.all([
        api.get('/admin/products?admin=true'),
        fetchCategories(api),
      ]);
      setProducts(asCatalogList(items));
      setCategories(categoryItems);
      setMessage('');
      api.get('/settings').then(setSettings).catch(() => setSettings(null));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setQuery(routeSearch);
    setPage(1);
  }, [routeSearch]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    const items = products.filter((product) => {
      const matchesSearch = [product.name, product.sku, product.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
      const matchesCategory = !category || product.category?._id === category || product.category === category;
      const matchesStatus = !status || (status === 'active' ? product.isActive : !product.isActive);
      const matchesStock = !stock || (stock === 'low'
        ? Number(product.stock || 0) > 0 && Number(product.stock || 0) <= Number(product.lowStockAlert || 5)
        : Number(product.stock || 0) === 0);
      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
    return [...items].sort((a, b) => {
      if (sort === 'price') return Number(b.price) - Number(a.price);
      if (sort === 'stock') return Number(a.stock) - Number(b.stock);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [category, products, query, sort, status, stock]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const catalogStats = useMemo(() => {
    const total = products.length;
    const active = products.filter((item) => item.isActive).length;
    const low = products.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= Number(item.lowStockAlert || 5)).length;
    const out = products.filter((item) => Number(item.stock || 0) <= 0).length;
    const value = products.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.stock || 0)), 0);
    return { total, active, low, out, value };
  }, [products]);

  useEffect(() => {
    setPage((value) => Math.min(value, pageCount));
  }, [pageCount]);

  const updateStock = async (product, nextStock) => {
    const value = Number(nextStock);
    try {
      const saved = await api.patch(`/admin/products/${product._id}/stock`, { stock: value });
      setProducts((current) => current.map((item) => item._id === product._id ? { ...item, stock: saved.stock, variants: saved.variants } : item));
      setMessage('');
    } catch (error) {
      setMessage(error.message);
      throw error;
    }
  };

  const toggleStatus = async (product) => {
    const isActive = !product.isActive;
    try {
      const saved = await api.patch(`/admin/products/${product._id}/status`, { isActive });
      setProducts((current) => current.map((item) => item._id === product._id ? { ...item, isActive: saved.isActive } : item));
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const markOutOfStock = async (product) => {
    try {
      const saved = await api.patch(`/admin/products/${product._id}/mark-out-of-stock`, {});
      setProducts((current) => current.map((item) => item._id === product._id ? { ...item, stock: saved.stock, variants: saved.variants } : item));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const hideProduct = async (product) => {
    const confirmed = window.confirm(`Hide ${product.name} from the store?`);
    if (!confirmed) return;
    try {
      await api.patch(`/admin/products/${product._id}/hide`, {});
      setProducts((current) => current.map((item) => (item._id === product._id ? { ...item, isActive: false } : item)));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeProduct = async () => {
    try {
      await api.delete(`/admin/products/${deleteTarget._id}`);
      setProducts((current) => current.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setStatus('');
    setStock('');
    setSort('newest');
    setPage(1);
  };

  const applyMetric = (key) => {
    setPage(1);
    if (key === 'total') {
      setStatus('');
      setStock('');
      setSort('newest');
      return;
    }
    if (key === 'active') {
      setStatus((current) => (current === 'active' && !stock ? '' : 'active'));
      setStock('');
      return;
    }
    if (key === 'low') {
      setStock((current) => (current === 'low' ? '' : 'low'));
      setStatus('');
      return;
    }
    if (key === 'out') {
      setStock((current) => (current === 'out' ? '' : 'out'));
      setStatus('');
      return;
    }
    setSort((current) => (current === 'price' ? 'newest' : 'price'));
  };

  const toggleSelected = (productId) => {
    setSelectedIds((current) => (current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]));
  };

  const toggleSelectAll = () => {
    const visibleIds = visible.map((product) => product._id);
    setSelectedIds((current) => visibleIds.every((id) => current.includes(id))
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };

  const openAddModal = () => {
    setEditorMode('Add');
    setEditorProductId('');
    setEditorOpen(true);
  };

  const openEditModal = (product) => {
    setEditorMode('Update');
    setEditorProductId(product._id);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorProductId('');
    setEditorMode('Add');
  };

  if (loadError) return <PageState error={loadError} onRetry={loadProducts} />;
  return (
    <section className="space-y-5">
      <PageHeader title="Products" note="Manage catalog, pricing, stock, visibility and featured collections.">
        <a href="/admin/social-import" className="admin-btn-ghost">Import social link</a>
        <a href="/admin/products/quick-add" className="admin-btn-ghost">
          <Plus className="h-4 w-4" />
          Quick Add
        </a>
        <button type="button" onClick={openAddModal} className="admin-btn">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </PageHeader>

      <div className="admin-kpi-strip">
        <KpiTile
          icon={Package}
          tone="wine"
          label="Total products"
          value={catalogStats.total}
          note="Click to view catalog"
          percent={100}
          active={!status && !stock}
          onClick={() => applyMetric('total')}
        />
        <KpiTile
          icon={PackageCheck}
          tone="green"
          label="Active products"
          value={catalogStats.active}
          note="Visible on storefront"
          percent={catalogStats.total ? (catalogStats.active / catalogStats.total) * 100 : 0}
          active={status === 'active' && !stock}
          onClick={() => applyMetric('active')}
        />
        <KpiTile
          icon={AlertTriangle}
          tone="amber"
          label="Low stock"
          value={catalogStats.low}
          note="Reorder these soon"
          percent={catalogStats.total ? (catalogStats.low / catalogStats.total) * 100 : 0}
          active={stock === 'low'}
          onClick={() => applyMetric('low')}
        />
        <KpiTile
          icon={PackageX}
          tone="rose"
          label="Out of stock"
          value={catalogStats.out}
          note="Needs restocking"
          percent={catalogStats.total ? (catalogStats.out / catalogStats.total) * 100 : 0}
          active={stock === 'out'}
          onClick={() => applyMetric('out')}
        />
        <KpiTile
          icon={Banknote}
          tone="gold"
          label="Inventory value"
          value={formatCurrency(catalogStats.value)}
          note="Click to sort by price"
          percent={100}
          active={sort === 'price'}
          onClick={() => applyMetric('value')}
        />
      </div>

      <div className="admin-card p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff3f1] text-wine">
              <PackageSearch className="h-4 w-4" />
            </span>
            Filters
          </div>
          <button type="button" onClick={clearFilters} className="admin-btn-ghost">
            <Trash2 className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.85fr))]">
          <div className="flex h-11 items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-4">
            <PackageSearch className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by product, SKU or category"
              className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-slate-400"
            />
          </div>
          <Select value={category} onChange={(value) => { setCategory(value); setPage(1); }} options={[['', 'All Categories'], ...categories.map((item) => [item._id, item.name])]} />
          <Select value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[['', 'All Status'], ['active', 'Active'], ['inactive', 'Inactive']]} />
          <Select value={stock} onChange={(value) => { setStock(value); setPage(1); }} options={[['', 'All Stock'], ['low', 'Low Stock'], ['out', 'Out of Stock']]} />
          <Select value={sort} onChange={(value) => setSort(value)} options={[['newest', 'Newest'], ['price', 'Price'], ['stock', 'Stock']]} />
        </div>
      </div>

      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message}</p>}

      <div className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd5] px-4 py-3 lg:px-5">
          <div>
            <h2>All products ({filtered.length})</h2>
            <p className="mt-1 text-xs text-slate-500">{page} of {pageCount} pages · {selectedIds.length} selected</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            Sort by
            <span className="rounded-full bg-[#fff6f1] px-3 py-1.5 text-charcoal">
              {sort === 'newest' ? 'Newest first' : sort}
            </span>
            <button
              type="button"
              onClick={() => { setQuery(''); setCategory(''); setStatus(''); setStock(''); setSort('newest'); setPage(1); }}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#eadfd5] text-slate-500"
              aria-label="Reset product filters"
              title="Reset product filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4 lg:p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[76px] animate-pulse rounded-[18px] bg-slate-100/80" />
            ))}
          </div>
        ) : visible.length ? (
          <div className="overflow-x-auto">
            <table className="admin-catalog-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <button type="button" onClick={toggleSelectAll} className="grid h-5 w-5 place-items-center rounded border border-[#d9cec3] bg-white" aria-label="Select all products">
                      {visible.length > 0 && visible.every((product) => selectedIds.includes(product._id)) ? <Check className="h-3 w-3 text-wine" /> : <Square className="h-3 w-3 text-slate-400" />}
                    </button>
                  </th>
                  <th className="admin-catalog-product">Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const stockValue = Number(product.stock || 0);
                  const lowStockAlert = Number(product.lowStockAlert || 5);
                  const stockState = stockValue <= 0 ? 'Out of stock' : stockValue <= lowStockAlert ? 'Low stock' : 'In stock';
                  const stockTone = stockValue <= 0
                    ? 'bg-rose-50 text-rose-700'
                    : stockValue <= lowStockAlert
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700';
                  const selected = selectedIds.includes(product._id);
                  const description = productDescription(product);

                  return (
                    <tr key={product._id} className={selected ? 'is-selected' : ''}>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleSelected(product._id)}
                          className={`grid h-5 w-5 place-items-center rounded border ${selected ? 'border-wine bg-wine text-white' : 'border-[#d9cec3] bg-white'}`}
                          aria-label={`Select ${product.name}`}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </button>
                      </td>
                      <td className="admin-catalog-product">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#fbf2eb]">
                            <img
                              src={getPrimaryImageUrl(product.images) || '/uploads/placeholder.jpg'}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="whitespace-nowrap text-[14px] font-semibold leading-5 text-charcoal"
                              title={productHoverDetails(product)}
                            >
                              {shortenText(product.name, 20)}
                            </p>
                            {description ? (
                              <p className="mt-1 whitespace-nowrap text-xs leading-4 text-slate-500" title={description}>
                                {shortenText(description, 20)}
                              </p>
                            ) : null}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {renderFeatureTag(product.isFeatured, 'Featured')}
                              {renderFeatureTag(product.isNewArrival, 'New')}
                              {renderFeatureTag(product.isBestSeller, 'Best Seller')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-catalog-sku" title={product.sku || ''}>
                          {product.sku ? shortenText(product.sku, 10) : '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-slate-700">{product.category?.name || 'Unassigned'}</td>
                      <td className="whitespace-nowrap">
                        <p className="text-[15px] font-semibold text-charcoal">Rs. {formatNumber(product.price)}</p>
                        {product.originalPrice > product.price && (
                          <p className="mt-0.5 text-xs text-slate-400 line-through">Rs. {formatNumber(product.originalPrice)}</p>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1.5">
                          {product.variants?.length ? <a href="/admin/inventory" className="admin-table-action-link" title="Update stock for each size and colour">{product.stock} · Edit variants</a> : <StockInput
                            value={product.stock}
                            onSave={(value) => updateStock(product, value)}
                            className="h-9 w-[72px] rounded-lg border border-[#eadfd5] bg-white px-2.5 text-sm font-semibold text-charcoal"
                            aria-label={`${product.name} stock`}
                          />}
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockTone}`}>
                            {stockState}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button type="button" onClick={() => toggleStatus(product)} aria-label={`Toggle ${product.name} status`}>
                          <StatusBadge value={product.isActive ? 'Active' : 'Inactive'} />
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => openEditModal(product)} className="admin-catalog-action" aria-label={`Edit ${product.name}`} title="Edit">
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setPosterProduct(product)} className="admin-catalog-action" aria-label={`Generate poster for ${product.name}`} title="Poster">
                            <Camera className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setCaptionProduct(product)} className="admin-catalog-action" aria-label={`Generate caption for ${product.name}`} title="Caption">
                            <MessageSquareText className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => markOutOfStock(product)} className="admin-catalog-action" aria-label={`Mark ${product.name} out of stock`} title="Out of stock">
                            <PackageX className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => hideProduct(product)} className="admin-catalog-action" aria-label={`Hide ${product.name}`} title="Hide">
                            <EyeOff className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(product)} className="admin-catalog-action is-danger" aria-label={`Delete ${product.name}`} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-[260px] place-items-center px-4 py-10 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-wine/10 text-wine">
                <PackageSearch className="h-6 w-6" />
              </div>
              <p className="mt-4 text-lg font-black text-charcoal">No products match your filters</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Try clearing the filters or adding a new product.</p>
              <button type="button" onClick={clearFilters} className="mt-5 rounded-full border border-[#eadfd5] bg-white px-5 py-2.5 text-sm font-black text-charcoal">
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="text-slate-600">Showing {visible.length} of {filtered.length} products</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="admin-btn-ghost min-h-9 px-3 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="min-w-12 text-center text-slate-600">{page} / {pageCount}</span>
          <button
            disabled={page === pageCount}
            onClick={() => setPage((value) => value + 1)}
            className="admin-btn-ghost min-h-9 px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[90] bg-black/45 p-3 sm:p-4 lg:p-6">
          <div className="mx-auto flex h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-[28px] bg-[#fbf7f3] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between border-b border-[#eadfd5] bg-white px-4 py-3 lg:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-wine/60">
                  {editorMode === 'Add' ? 'Create Product' : 'Edit Product'}
                </p>
                <h2 className="text-xl font-black text-charcoal">
                  {editorMode === 'Add' ? 'Add Product' : 'Edit Product'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#eadfd5] bg-white text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
              <ProductForm
                mode={editorMode}
                productId={editorProductId}
                onCancel={closeEditor}
                onSaved={() => {
                  closeEditor();
                  loadProducts();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete product?"
        message={`This will remove ${deleteTarget?.name} from the catalog.`}
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeProduct}
      />

      <ProductPosterModal open={!!posterProduct} product={posterProduct} settings={settings} onClose={() => setPosterProduct(null)} />
      <ProductCaptionModal open={!!captionProduct} product={captionProduct} settings={settings} onClose={() => setCaptionProduct(null)} />
    </section>
  );
}

function Select({ value, onChange, options }) {
  return (
    <UiSelect value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[16px]">
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>{label}</option>
      ))}
    </UiSelect>
  );
}

function KpiTile({ icon: Icon, tone, label, value, note, percent, active, onClick }) {
  const bar = Number(percent || 0);
  return (
    <button
      type="button"
      className={`admin-kpi-tile is-${tone}${active ? ' is-active' : ''}`}
      style={{ '--kpi-pct': `${bar <= 0 ? 0 : Math.max(10, Math.min(100, bar))}%` }}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="admin-kpi-tile__icon">
        <Icon className="h-4 w-4" />
      </span>
      <p className="admin-kpi-tile__value">{value}</p>
      <p className="admin-kpi-tile__label">{label}</p>
      <p className="admin-kpi-tile__note">{note}</p>
      <span className="admin-kpi-tile__bar"><span><i /></span></span>
    </button>
  );
}

function renderFeatureTag(enabled, label) {
  if (!enabled) return null;
  return (
    <span className="inline-flex rounded-full bg-[#fff4f7] px-2 py-0.5 text-[10px] font-semibold text-wine">
      {label}
    </span>
  );
}

function shortenText(value, max = 20) {
  const text = String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function productDescription(product) {
  return String(product?.shortDescription || product?.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productHoverDetails(product) {
  const description = productDescription(product);
  return [
    product?.name,
    description,
    product?.sku ? `SKU: ${product.sku}` : '',
    product?.category?.name ? `Category: ${product.category.name}` : '',
    [product?.fabric, product?.occasion].filter(Boolean).join(' · '),
  ].filter(Boolean).join('\n');
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatCurrency(value) {
  return `Rs. ${new Intl.NumberFormat('en-IN').format(Number(value || 0))}`;
}

export function AdminPage({ title, action, href, children }) {
  return (
    <section className="space-y-5">
      <PageHeader title={title} note="Live catalog records with quick admin controls." actionLabel={action} actionHref={href} />
      {children}
    </section>
  );
}

export function AdminTable({ heads, rows, title = 'Records', emptyTitle = `No ${title.toLowerCase()} found` }) {
  return (
    <DataTable
      title={title}
      emptyTitle={emptyTitle}
      heads={heads}
      rows={rows.map((row, i) => (
        <tr key={i} className="border-t border-slate-100">
          {row.map((cell, j) => (
            <td key={`${i}-${j}`} className="px-4 py-4 font-semibold text-slate-700">{cell}</td>
          ))}
        </tr>
      ))}
    />
  );
}
