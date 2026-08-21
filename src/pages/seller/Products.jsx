import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';

export default function SellerProducts({ navigate }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/seller/products')
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <PageState loading loadingLabel="Loading products..." />;
  if (error) return <PageState error={error} onRetry={load} />;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Catalog</h1>
        <button type="button" className="h-11 rounded-xl bg-wine px-5 text-sm font-black text-white" onClick={() => navigate('/seller/products/add')}>Add product</button>
      </div>
      {!items.length ? <PageState empty emptyTitle="No products yet" emptyNote="Add your first product. Reel drafts never auto-publish." /> : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {items.map((product) => (
            <button
              key={product._id}
              type="button"
              className="flex w-full items-center justify-between border-b px-5 py-4 text-left last:border-0"
              onClick={() => navigate(`/seller/products/edit?id=${product._id}`)}
            >
              <div>
                <p className="font-black">{product.name}</p>
                <p className="text-sm text-slate-500">{product.sku} · stock {product.stock} · {product.isActive ? 'Active' : 'Hidden'}</p>
              </div>
              <p className="font-black">Rs. {product.price}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
