import { useEffect, useState } from 'react';
import ProductImageGallery from '../../components/product/ProductImageGallery';
import SizeChartModal from '../../components/product/SizeChartModal';
import ProductGrid from '../../components/product/ProductGrid';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../services/api';
import { normalizeProduct, normalizeProducts } from '../../services/normalize';

export default function ProductDetail({ navigate, route = '' }) {
  const productKey = new URLSearchParams(route.split('?')[1] || '').get('id');
  const cart = useCart();
  const wishlist = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [openSizeChart, setOpenSizeChart] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productKey) return setError('Product not found.');
    api.get(`/products/${productKey}`).then((data) => {
      const item = normalizeProduct(data);
      setProduct(item);
      setSize(item.sizes?.[0] || 'Free Size');
      setColor(item.colors?.[0] || 'Wine');
      return api.get(`/products?category=${item.categoryId || ''}`);
    }).then((items) => setRelated(normalizeProducts(items).filter((item) => (item._id || item.id) !== productKey).slice(0, 4))).catch((err) => setError(err.message));
  }, [productKey]);

  if (error) return <section className="container-page py-10"><div className="rounded-2xl bg-white p-8 text-center font-bold text-rose">{error}</div></section>;
  if (!product) return <section className="container-page py-10"><div className="rounded-2xl bg-white p-8 text-center font-bold">Loading product...</div></section>;

  const add = () => cart.addToCart(product, size, color);

  return (
    <section className="container-page pb-24 pt-6 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <ProductImageGallery product={product} />
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-wine">{product.brand || 'Samira Collection'}</p>
            <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{product.description}</p>
            <p className="mt-5 text-3xl font-black">Rs. {product.price} <span className="text-base text-slate-400 line-through">Rs. {product.originalPrice}</span> <span className="text-base text-rose">({product.discountPercentage}% OFF)</span></p>
            <p className="mt-1 text-xs font-bold text-emerald-600">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          </div>
          <Panel title="Select Size" action={<button onClick={() => setOpenSizeChart(true)} className="text-sm font-black text-rose">Size Chart</button>}>
            <div className="flex flex-wrap gap-2">{(product.sizes || ['Free Size']).map((item) => <button key={item} onClick={() => setSize(item)} className={`rounded-xl px-4 py-3 text-sm font-black ${size === item ? 'bg-charcoal text-white' : 'bg-slate-100'}`}>{item}</button>)}</div>
          </Panel>
          <Panel title="Select Color"><div className="flex flex-wrap gap-2">{(product.colors || ['Wine']).map((item) => <button key={item} onClick={() => setColor(item)} className={`rounded-xl px-4 py-3 text-sm font-black ${color === item ? 'bg-wine text-white' : 'bg-slate-100'}`}>{item}</button>)}</div></Panel>
          <Panel title="Product Details"><p className="text-sm leading-7 text-slate-600">Fabric: {product.fabric || '-'} Occasion: {product.occasion || '-'} Care: {product.careInstructions || '-'} Return: {product.returnPolicy || '-'}</p></Panel>
          <div className="hidden gap-3 md:flex">
            <button disabled={product.stock <= 0} onClick={add} className="h-12 flex-1 rounded-xl bg-rose text-sm font-black text-white disabled:opacity-50">Add to Bag</button>
            <button onClick={() => wishlist.toggleWishlist(product)} className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-black">Wishlist</button>
            <button disabled={product.stock <= 0} onClick={() => { add(); navigate('/checkout'); }} className="h-12 flex-1 rounded-xl bg-charcoal text-sm font-black text-white disabled:opacity-50">Buy Now</button>
          </div>
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 grid grid-cols-2 gap-2 bg-white p-3 md:hidden">
        <button disabled={product.stock <= 0} onClick={add} className="h-12 rounded-xl bg-rose text-sm font-black text-white disabled:opacity-50">Add to Bag</button>
        <button disabled={product.stock <= 0} onClick={() => { add(); navigate('/checkout'); }} className="h-12 rounded-xl bg-charcoal text-sm font-black text-white disabled:opacity-50">Buy Now</button>
      </div>
      {related.length > 0 && <div className="mt-10"><ProductGrid products={related} navigate={navigate} /></div>}
      <SizeChartModal open={openSizeChart} onClose={() => setOpenSizeChart(false)} />
    </section>
  );
}

function Panel({ title, action, children }) {
  return <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2>{action}</div>{children}</div>;
}
