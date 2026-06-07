import { useState } from 'react';
import products from '../../data/seedProducts';
import ProductImageGallery from '../../components/product/ProductImageGallery';
import SizeChartModal from '../../components/product/SizeChartModal';
import ProductGrid from '../../components/product/ProductGrid';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductDetail({ navigate }) {
  const product = products[0];
  const cart = useCart();
  const wishlist = useWishlist();
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [openSizeChart, setOpenSizeChart] = useState(false);

  return (
    <section className="container-page py-6 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <ProductImageGallery product={product} />
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-wine">Samira Collection</p>
            <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{product.description}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{product.rating} star</span>
              <span className="text-sm font-semibold text-slate-500">{product.numReviews} reviews</span>
            </div>
            <p className="mt-5 text-3xl font-black">Rs. {product.price} <span className="text-base text-slate-400 line-through">Rs. {product.originalPrice}</span> <span className="text-base text-rose">({product.discountPercentage}% OFF)</span></p>
            <p className="mt-1 text-xs font-bold text-emerald-600">Inclusive of all taxes</p>
          </div>
          <Panel title="Select Size" action={<button onClick={() => setOpenSizeChart(true)} className="text-sm font-black text-rose">Size Chart</button>}>
            <div className="flex flex-wrap gap-2">{product.sizes.map((item) => <button key={item} onClick={() => setSize(item)} className={`rounded-xl px-4 py-3 text-sm font-black ${size === item ? 'bg-charcoal text-white' : 'bg-slate-100'}`}>{item}</button>)}</div>
          </Panel>
          <Panel title="Select Color"><div className="flex gap-2">{product.colors.map((item) => <button key={item} onClick={() => setColor(item)} className={`rounded-xl px-4 py-3 text-sm font-black ${color === item ? 'bg-wine text-white' : 'bg-slate-100'}`}>{item}</button>)}</div></Panel>
          <Panel title="Delivery Check"><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Enter pincode" /><p className="mt-3 text-sm font-semibold text-slate-500">Express delivery, COD, and easy return eligibility will appear here.</p></Panel>
          <Panel title="Product Details"><p className="text-sm leading-7 text-slate-600">Fabric: {product.fabric}. Occasion: {product.occasion}. Care: {product.careInstructions} Return: {product.returnPolicy}</p></Panel>
          <div className="hidden gap-3 md:flex">
            <button onClick={() => cart.addToCart(product, size, color)} className="h-12 flex-1 rounded-xl bg-rose text-sm font-black text-white">Add to Bag</button>
            <button onClick={() => wishlist.toggleWishlist(product)} className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-black">Wishlist</button>
            <button onClick={() => navigate('/checkout')} className="h-12 flex-1 rounded-xl bg-charcoal text-sm font-black text-white">Buy Now</button>
          </div>
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 grid grid-cols-2 gap-2 bg-white p-3 md:hidden">
        <button onClick={() => cart.addToCart(product, size, color)} className="h-12 rounded-xl bg-rose text-sm font-black text-white">Add to Bag</button>
        <button onClick={() => navigate('/checkout')} className="h-12 rounded-xl bg-charcoal text-sm font-black text-white">Buy Now</button>
      </div>
      <ProductGrid products={products.slice(1, 5)} navigate={navigate} />
      <SizeChartModal open={openSizeChart} onClose={() => setOpenSizeChart(false)} />
    </section>
  );
}

function Panel({ title, action, children }) {
  return <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2>{action}</div>{children}</div>;
}
