import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';

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

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [items, categoryItems] = await Promise.all([
        api.get('/admin/products?admin=true'),
        api.get('/admin/categories?admin=true'),
      ]);
      setProducts(items);
      setCategories(categoryItems);
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
      const matchesSearch = [product.name, product.sku, product.category?.name].filter(Boolean).join(' ').toLowerCase().includes(term);
      const matchesCategory = !category || product.category?._id === category || product.category === category;
      const matchesStatus = !status || (status === 'active' ? product.isActive : !product.isActive);
      const matchesStock = !stock || (stock === 'low' ? product.stock > 0 && product.stock <= (product.lowStockAlert || 5) : product.stock === 0);
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

  const updateStock = async (product, nextStock) => {
    const value = Number(nextStock);
    setProducts((current) => current.map((item) => item._id === product._id ? { ...item, stock: value } : item));
    try {
      await api.patch(`/admin/products/${product._id}/stock`, { stock: value });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleStatus = async (product) => {
    const isActive = !product.isActive;
    setProducts((current) => current.map((item) => item._id === product._id ? { ...item, isActive } : item));
    try {
      await api.patch(`/admin/products/${product._id}/status`, { isActive });
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

  return (
    <section className="space-y-5">
      <PageHeader title="Products" note="Manage catalog, pricing, stock and storefront visibility." actionLabel="Add Product" actionHref="#/admin/products/add" />
      <SearchFilterBar search={query} onSearch={(value) => { setQuery(value); setPage(1); }} placeholder="Search by product, SKU or category">
        <Select value={category} onChange={setCategory} options={[['', 'All Categories'], ...categories.map((item) => [item._id, item.name])]} />
        <Select value={status} onChange={setStatus} options={[['', 'All Status'], ['active', 'Active'], ['inactive', 'Inactive']]} />
        <Select value={stock} onChange={setStock} options={[['', 'All Stock'], ['low', 'Low Stock'], ['out', 'Out of Stock']]} />
        <Select value={sort} onChange={setSort} options={[['newest', 'Newest'], ['price', 'Price'], ['stock', 'Stock']]} />
      </SearchFilterBar>
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message}</p>}
      <DataTable
        loading={loading}
        emptyTitle="No products match your filters"
        heads={['Product', 'SKU', 'Category', 'Price', 'Stock', 'Flags', 'Status', 'Actions']}
        rows={visible.map((product) => (
          <tr key={product._id} className="border-t border-slate-100 align-top">
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <img src={product.images?.[0]?.url || '/uploads/placeholder.jpg'} alt="" className="h-12 w-12 rounded-xl bg-[#f7f2eb] object-cover" />
                <div>
                  <p className="font-black text-charcoal">{product.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{product.fabric || 'Fashion'} | {product.occasion || 'Collection'}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-4 font-semibold">{product.sku || '-'}</td>
            <td className="px-4 py-4 font-semibold">{product.category?.name || 'Unassigned'}</td>
            <td className="px-4 py-4 font-black">Rs. {product.price}</td>
            <td className="px-4 py-4">
              <input type="number" value={product.stock} onChange={(event) => updateStock(product, event.target.value)} className="h-10 w-24 rounded-lg border border-slate-200 px-3 font-bold" />
            </td>
            <td className="px-4 py-4 text-xs font-bold text-slate-600">{[product.isFeatured && 'Featured', product.isNewArrival && 'New', product.isBestSeller && 'Best'].filter(Boolean).join(', ') || 'None'}</td>
            <td className="px-4 py-4"><button onClick={() => toggleStatus(product)}><StatusBadge value={product.isActive ? 'Active' : 'Inactive'} /></button></td>
            <td className="px-4 py-4">
              <div className="flex gap-3">
                <a href={`#/admin/products/edit?id=${product._id}`} className="font-black text-wine">Edit</a>
                <button onClick={() => setDeleteTarget(product)} className="font-black text-rose">Delete</button>
              </div>
            </td>
          </tr>
        ))}
      />
      <div className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm font-bold shadow-sm">
        <span>{filtered.length} products</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Prev</button>
          <span>{page} / {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button>
        </div>
      </div>
      <ConfirmModal open={!!deleteTarget} title="Delete product?" message={`This will remove ${deleteTarget?.name} from the catalog.`} confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={removeProduct} />
    </section>
  );
}

function Select({ value, onChange, options }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select>;
}

export function AdminPage({ title, action, href, children }) {
  return <section className="space-y-5"><PageHeader title={title} note="Live MongoDB records with quick admin controls." actionLabel={action} actionHref={href} />{children}</section>;
}

export function AdminTable({ heads, rows }) {
  return <DataTable heads={heads} rows={rows.map((row, i) => <tr key={i} className="border-t border-slate-100">{row.map((cell, j) => <td key={`${i}-${j}`} className="px-4 py-4 font-semibold text-slate-700">{cell}</td>)}</tr>)} />;
}
