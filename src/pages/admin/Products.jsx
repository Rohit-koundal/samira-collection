import { useEffect, useMemo, useState } from 'react';
import { Check, Filter, Layers3, PackageCheck, PackageSearch, Plus, SlidersHorizontal, Square, Trash2, PencilLine, X, Camera, MessageSquareText, PackageX, EyeOff } from 'lucide-react';
import api from '../../services/api';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ProductForm from '../../components/admin/ProductForm';
import { Select as UiSelect } from '../../components/ui/Field';
import { getPrimaryImageUrl } from '../../services/normalize';
import ProductPosterModal from '../../components/admin/ProductPosterModal';
import ProductCaptionModal from '../../components/admin/ProductCaptionModal';

const pageSize = 10;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
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

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [items, categoryItems] = await Promise.all([
        api.get('/admin/products?admin=true'),
        api.get('/admin/categories?admin=true'),
      ]);
      const settingsData = await api.get('/settings');
      setProducts(items);
      setCategories(categoryItems);
      setSettings(settingsData);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

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

  useEffect(() => {
    setPage((value) => Math.min(value, pageCount));
  }, [pageCount]);

  const updateStock = async (product, nextStock) => {
    const value = Number(nextStock);
    setProducts((current) => current.map((item) => (item._id === product._id ? { ...item, stock: value } : item)));
    try {
      await api.patch(`/admin/products/${product._id}/stock`, { stock: value });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleStatus = async (product) => {
    const isActive = !product.isActive;
    setProducts((current) => current.map((item) => (item._id === product._id ? { ...item, isActive } : item)));
    try {
      await api.patch(`/admin/products/${product._id}/status`, { isActive });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const markOutOfStock = async (product) => {
    try {
      await api.patch(`/admin/products/${product._id}/mark-out-of-stock`, {});
      setProducts((current) => current.map((item) => (item._id === product._id ? { ...item, stock: 0 } : item)));
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

  const toggleSelected = (productId) => {
    setSelectedIds((current) => (current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === visible.length) setSelectedIds([]);
    else setSelectedIds(visible.map((product) => product._id));
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

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-[#eadfd5] bg-white/90 p-5 shadow-[0_12px_40px_rgba(111,74,52,0.06)] lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-wine/60">Admin / Products</p>
            <h1 className="mt-2 text-[28px] font-black tracking-tight text-charcoal lg:text-[34px]">Products</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Manage catalog, pricing, stock, visibility and featured collections.</p>
          </div>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-full bg-wine px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(109,31,52,0.24)]">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={PackageSearch}
          label="Total Products"
          value={products.length}
          note="All products"
        />
        <SummaryCard
          icon={PackageCheck}
          label="Active Products"
          value={products.filter((item) => item.isActive).length}
          note="Visible to customers"
        />
        <SummaryCard
          icon={Filter}
          label="Low Stock"
          value={products.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= Number(item.lowStockAlert || 5)).length}
          note="Reorder soon"
        />
        <SummaryCard
          icon={Layers3}
          label="Out of Stock"
          value={products.filter((item) => Number(item.stock || 0) <= 0).length}
          note="Needs attention"
        />
        <SummaryCard
          icon={SlidersHorizontal}
          label="Inventory Value"
          value={formatCurrency(products.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.stock || 0)), 0))}
          note="Total catalog value"
        />
      </div>

      <div className="rounded-[26px] border border-[#eadfd5] bg-white/90 p-4 shadow-[0_12px_40px_rgba(111,74,52,0.06)] lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff3f1] text-wine">
              <PackageSearch className="h-4 w-4" />
            </span>
            Premium filters
          </div>
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-xs font-black text-slate-600">
            <Trash2 className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.85fr))]">
          <div className="flex h-12 items-center gap-2 rounded-[16px] border border-[#eadfd5] bg-[#fffaf7] px-4">
            <PackageSearch className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by product, SKU or category"
              className="w-full bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:text-slate-400"
            />
          </div>
          <Select value={category} onChange={(value) => { setCategory(value); setPage(1); }} options={[['', 'All Categories'], ...categories.map((item) => [item._id, item.name])]} />
          <Select value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[['', 'All Status'], ['active', 'Active'], ['inactive', 'Inactive']]} />
          <Select value={stock} onChange={(value) => { setStock(value); setPage(1); }} options={[['', 'All Stock'], ['low', 'Low Stock'], ['out', 'Out of Stock']]} />
          <Select value={sort} onChange={(value) => setSort(value)} options={[['newest', 'Newest'], ['price', 'Price'], ['stock', 'Stock']]} />
        </div>
      </div>

      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message}</p>}

      <div className="overflow-hidden rounded-[28px] border border-[#eadfd5] bg-white shadow-[0_12px_40px_rgba(111,74,52,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2e8df] px-4 py-3 lg:px-5">
          <div>
            <h2 className="text-base font-black text-charcoal">All Products ({filtered.length})</h2>
            <p className="text-xs font-semibold text-slate-500">{page} of {pageCount} pages · {selectedIds.length} selected</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            Sort by
            <span className="rounded-full bg-[#fff6f1] px-3 py-1.5 text-charcoal">
              {sort === 'newest' ? 'Newest First' : sort}
            </span>
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-[#eadfd5] text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4 lg:p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[92px] animate-pulse rounded-[22px] bg-slate-100/80" />
            ))}
          </div>
        ) : visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed text-left">
              <colgroup>
                <col style={{ width: '48px' }} />
                <col style={{ width: '360px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '120px' }} />
              </colgroup>
              <thead className="bg-[#fbf7f2] text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">
                    <button type="button" onClick={toggleSelectAll} className="grid h-5 w-5 place-items-center rounded border border-[#d9cec3] bg-white">
                      {selectedIds.length === visible.length && visible.length > 0 ? <Check className="h-3 w-3 text-wine" /> : <Square className="h-3 w-3 text-slate-400" />}
                    </button>
                  </th>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">SKU</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="px-4 py-4">Stock</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Features</th>
                  <th className="px-4 py-4 text-right">Actions</th>
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

                  return (
                    <tr key={product._id} className="border-t border-[#f3ebe2] align-top transition hover:bg-[#fffaf7]">
                      <td className="px-4 py-4 align-middle">
                        <button type="button" onClick={() => toggleSelected(product._id)} className="grid h-5 w-5 place-items-center rounded border border-[#d9cec3] bg-white">
                          {selectedIds.includes(product._id) ? <Check className="h-3 w-3 text-wine" /> : null}
                        </button>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#fbf2eb] shadow-[0_10px_24px_rgba(111,74,52,0.08)]">
                            <img
                              src={getPrimaryImageUrl(product.images) || '/uploads/placeholder.jpg'}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-[14px] font-black leading-5 text-charcoal">{product.name}</p>
                            <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                              {product.fabric || 'Fashion'} · {product.occasion || 'Collection'} · {product.category?.name || 'Unassigned'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {renderFeatureTag(product.isFeatured, 'Featured')}
                              {renderFeatureTag(product.isNewArrival, 'New')}
                              {renderFeatureTag(product.isBestSeller, 'Best Seller')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle font-semibold text-slate-700">{product.sku || '-'}</td>
                      <td className="px-4 py-4 align-middle font-semibold text-slate-700">{product.category?.name || 'Unassigned'}</td>
                      <td className="px-4 py-4 align-middle">
                        <div className="space-y-1">
                          <p className="text-[15px] font-black leading-tight text-wine">Rs. {formatNumber(product.price)}</p>
                          {product.originalPrice > product.price && (
                            <p className="text-xs font-semibold text-slate-400 line-through">Rs. {formatNumber(product.originalPrice)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(event) => updateStock(product, event.target.value)}
                            className="h-11 w-[104px] rounded-xl border border-[#eadfd5] bg-white px-3 font-bold text-charcoal shadow-[0_6px_18px_rgba(111,74,52,0.04)]"
                          />
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${stockTone}`}>
                            {stockState}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <button type="button" onClick={() => toggleStatus(product)}>
                          <StatusBadge value={product.isActive ? 'Active' : 'Inactive'} />
                        </button>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-wrap gap-1.5">
                          {featureLabels(product).length ? featureLabels(product).map((label) => (
                            <span key={label} className="inline-flex rounded-full bg-[#fff4f7] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-wine">
                              {label}
                            </span>
                          )) : <span className="text-sm font-bold text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="grid h-10 place-items-center rounded-xl border border-[#eadfd5] bg-white text-wine shadow-[0_8px_18px_rgba(111,74,52,0.04)]"
                            aria-label={`Edit ${product.name}`}
                          >
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPosterProduct(product)}
                            className="grid h-10 place-items-center rounded-xl border border-[#eadfd5] bg-white text-slate-600 shadow-[0_8px_18px_rgba(111,74,52,0.04)]"
                            aria-label={`Generate poster for ${product.name}`}
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCaptionProduct(product)}
                            className="grid h-10 place-items-center rounded-xl border border-[#eadfd5] bg-white text-slate-600 shadow-[0_8px_18px_rgba(111,74,52,0.04)]"
                            aria-label={`Generate caption for ${product.name}`}
                          >
                            <MessageSquareText className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="grid h-10 place-items-center rounded-xl border border-[#eadfd5] bg-white text-rose shadow-[0_8px_18px_rgba(111,74,52,0.04)]"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => markOutOfStock(product)} className="inline-flex items-center gap-1 rounded-full border border-[#eadfd5] bg-white px-3 py-1 text-[10px] font-black text-slate-600">
                            <PackageX className="h-3.5 w-3.5" />
                            Out of Stock
                          </button>
                          <button type="button" onClick={() => hideProduct(product)} className="inline-flex items-center gap-1 rounded-full border border-[#eadfd5] bg-white px-3 py-1 text-[10px] font-black text-slate-600">
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm font-bold shadow-sm">
        <span>Showing {visible.length} of {filtered.length} products</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
          >
            Prev
          </button>
          <span>{page} / {pageCount}</span>
          <button
            disabled={page === pageCount}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
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

function SummaryCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-[24px] border border-[#eadfd5] bg-white px-4 py-4 shadow-[0_10px_32px_rgba(111,74,52,0.06)]">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff3f1] text-wine">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-charcoal">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{note}</p>
        </div>
      </div>
    </div>
  );
}

function renderFeatureTag(enabled, label) {
  if (!enabled) return null;
  return (
    <span className="inline-flex rounded-full bg-[#fff4f7] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-wine">
      {label}
    </span>
  );
}

function featureLabels(product) {
  return [
    product.isFeatured && 'Featured',
    product.isNewArrival && 'New',
    product.isBestSeller && 'Best Seller',
  ].filter(Boolean);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.18em]">Admin / {title}</p>
          <h1 className="mt-1 text-xl font-black text-charcoal md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Live MongoDB records with quick admin controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {children}
          {action && <a href={href} className="rounded-xl bg-wine px-4 py-2.5 text-sm font-black text-white md:px-5 md:py-3">{action}</a>}
        </div>
      </div>
    </section>
  );
}

export function AdminTable({ heads, rows }) {
  return (
    <DataTable
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
