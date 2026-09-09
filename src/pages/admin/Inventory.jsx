import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';
import StockInput from '../../components/admin/StockInput';
import { Clock3 } from 'lucide-react';

export default function Inventory({ route = '' }) {
  const base = route.startsWith('/seller') ? '/seller' : '/admin';
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(() => new URLSearchParams(route.split('?')[1] || '').get('filter') || '');
  useEffect(() => { setFilter(new URLSearchParams(route.split('?')[1] || '').get('filter') || ''); }, [route]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get(`${base}/products?admin=true`), api.get(`${base}/inventory/history?limit=30`)]).then(([productData, movements]) => {
      setProducts(Array.isArray(productData) ? productData : productData.items || []);
      setHistory(movements.items || []);
      setMessage('');
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, [base]);
  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => products.filter((product) => {
    const matches = [product.name, product.sku, product.category?.name].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase());
    const activeVariants = product.variants?.filter(variant => variant.isActive !== false) || [];
    const stock = product.variants?.length ? activeVariants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0) : Number(product.stock || 0);
    const threshold = product.lowStockAlert ?? 5;
    const low = stock > 0 && stock <= threshold;
    const out = stock === 0;
    const warning = stock <= threshold || activeVariants.some(variant => variant.stock <= threshold);
    return matches && (!filter || (filter === 'attention' ? product.isActive && !product.isArchived && warning : filter === 'low' ? low : out));
  }), [filter, products, query]);

  const updateStock = async (product, stock, variantId) => {
    try {
      const saved = await api.patch(`${base}/products/${product._id}/stock`, { stock: Number(stock), ...(variantId ? { variantId } : {}) });
      setProducts((items) => items.map((item) => item._id === product._id ? { ...item, stock: saved.stock, variants: saved.variants } : item));
      const movements = await api.get(`${base}/inventory/history?limit=30`);
      setHistory(movements.items || []);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
      throw error;
    }
  };

  const markOutOfStock = async (product) => {
    try {
      const saved = await api.patch(`${base}/products/${product._id}/mark-out-of-stock`, {});
      setProducts((items) => items.map((item) => item._id === product._id ? { ...item, stock: saved.stock, variants: saved.variants } : item));
      const movements = await api.get(`${base}/inventory/history?limit=30`);
      setHistory(movements.items || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const hideProduct = async (product) => {
    const confirmed = window.confirm(`Hide ${product.name} from store?`);
    if (!confirmed) return;
    try {
      await api.patch(`${base}/products/${product._id}/hide`, {});
      setProducts((items) => items.map((item) => item._id === product._id ? { ...item, isActive: false } : item));
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Inventory" note="Quickly update stock and track low-stock alerts." />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>}
      <SearchFilterBar search={query} onSearch={setQuery} placeholder="Search product or SKU">
        <select aria-label="Stock filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"><option value="">All Stock</option><option value="attention">Needs stock attention</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No inventory records" heads={['Product', 'SKU', 'Category', 'Current Stock', 'Low Alert', 'Status', 'Quick Update']} rows={filtered.map((product) => {
        const stockLabel = product.stock === 0 ? 'Out of Stock' : product.stock <= (product.lowStockAlert ?? 5) ? 'Pending' : 'Active';
        return (
          <tr key={product._id} className="border-t border-slate-100">
            <td className="px-4 py-4 font-black">{product.name}</td>
            <td className="px-4 py-4">{product.sku || '-'}</td>
            <td className="px-4 py-4">{product.category?.name || '-'}</td>
            <td className="px-4 py-4 font-black">{product.stock}</td>
            <td className="px-4 py-4">{product.lowStockAlert ?? 5}</td>
            <td className="px-4 py-4"><StatusBadge value={stockLabel} /></td>
            <td className="px-4 py-4">
              <div className="flex flex-col gap-2">
                {Array.isArray(product.variants) && product.variants.length ? product.variants.map((variant) => (
                  <label key={variant._id} className="flex items-center gap-2 text-xs font-bold">
                    <span className="min-w-24">{variant.size} / {variant.color}</span>
                    <StockInput aria-label={`${product.name} ${variant.size} ${variant.color} stock`} value={variant.stock} onSave={(value) => updateStock(product, value, variant._id)} className="h-10 w-24 rounded-lg border border-slate-200 px-3 font-bold" />
                  </label>
                )) : (
                  <StockInput aria-label={`${product.name} stock`} value={product.stock} onSave={(value) => updateStock(product, value)} className="h-10 w-24 rounded-lg border border-slate-200 px-3 font-bold" />
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => markOutOfStock(product)} className="admin-table-action-link is-danger">Out of stock</button>
                  <button type="button" onClick={() => hideProduct(product)} className="admin-table-action-link">Hide</button>
                </div>
              </div>
            </td>
          </tr>
        );
      })} />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b bg-[#fffaf7] px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f4e5e9] text-[#751d39]"><Clock3 size={17} /></span><div><h2 className="font-black">Inventory history</h2><p className="text-xs text-slate-500">Latest sales, returns and manual stock changes.</p></div></header>
        {!history.length ? <p className="p-6 text-sm text-slate-500">Stock movements will appear here after an order or stock update.</p> : <div className="divide-y">{history.map((movement) => <div key={movement._id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[minmax(180px,1fr)_140px_90px_140px] sm:items-center"><div className="min-w-0"><p className="truncate font-black">{movement.product?.name || movement.sku || 'Removed product'}</p><p className="text-xs text-slate-500">{movement.reason || movement.type}{movement.variantId ? ` · Variant ${movement.variantId.slice(-6)}` : ''}</p></div><span className="text-xs font-bold text-slate-500">{movement.type.replaceAll('_', ' ')}</span><strong className={movement.quantity < 0 ? 'text-rose-700' : 'text-emerald-700'}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</strong><time className="text-xs text-slate-500">{new Date(movement.createdAt).toLocaleString('en-IN')}</time></div>)}</div>}
      </section>
    </section>
  );
}
