import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import api from '../../services/api';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = () => {
    setLoading(true);
    api.get('/admin/products?admin=true').then((items) => {
      setProducts(items);
      setMessage('');
    }).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const matches = [product.name, product.sku, product.category?.name].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase());
    const low = product.stock > 0 && product.stock <= (product.lowStockAlert || 5);
    const out = product.stock === 0;
    return matches && (!filter || (filter === 'low' ? low : out));
  }), [filter, products, query]);

  const updateStock = async (product, stock) => {
    try {
      await api.patch(`/admin/products/${product._id}/stock`, { stock: Number(stock) });
      setProducts((items) => items.map((item) => item._id === product._id ? { ...item, stock: Number(stock) } : item));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const markOutOfStock = async (product) => {
    try {
      await api.patch(`/admin/products/${product._id}/mark-out-of-stock`, {});
      setProducts((items) => items.map((item) => item._id === product._id ? { ...item, stock: 0 } : item));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const hideProduct = async (product) => {
    const confirmed = window.confirm(`Hide ${product.name} from store?`);
    if (!confirmed) return;
    try {
      await api.patch(`/admin/products/${product._id}/hide`, {});
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
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"><option value="">All Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select>
      </SearchFilterBar>
      <DataTable loading={loading} emptyTitle="No inventory records" heads={['Product', 'SKU', 'Category', 'Current Stock', 'Low Alert', 'Status', 'Quick Update']} rows={filtered.map((product) => {
        const stockLabel = product.stock === 0 ? 'Out of Stock' : product.stock <= (product.lowStockAlert || 5) ? 'Pending' : 'Active';
        return (
          <tr key={product._id} className="border-t border-slate-100">
            <td className="px-4 py-4 font-black">{product.name}</td>
            <td className="px-4 py-4">{product.sku || '-'}</td>
            <td className="px-4 py-4">{product.category?.name || '-'}</td>
            <td className="px-4 py-4 font-black">{product.stock}</td>
            <td className="px-4 py-4">{product.lowStockAlert || 5}</td>
            <td className="px-4 py-4"><StatusBadge value={stockLabel} /></td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <input type="number" value={product.stock} onChange={(event) => updateStock(product, event.target.value)} className="h-10 w-24 rounded-lg border border-slate-200 px-3 font-bold" />
                <button type="button" onClick={() => markOutOfStock(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">OOS</button>
                <button type="button" onClick={() => hideProduct(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Hide</button>
              </div>
            </td>
          </tr>
        );
      })} />
    </section>
  );
}
