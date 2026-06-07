import { useState } from 'react';
import DesktopHeader from './components/DesktopHeader';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import OfferBanners from './components/OfferBanners';
import FeaturedProducts from './components/FeaturedProducts';
import TrendingSection from './components/TrendingSection';
import NewArrivals from './components/NewArrivals';
import WhyChooseUs from './components/WhyChooseUs';
import Reviews from './components/Reviews';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import products from './data/products';
import categories from './data/categories';
import suitImage from './assets/product-suit.svg';
import sareeImage from './assets/product-saree.svg';
import kurtiImage from './assets/product-kurti.svg';
import gownImage from './assets/product-gown.svg';
import lehengaImage from './assets/product-lehenga.svg';
import dressImage from './assets/product-dress.svg';

const productImages = {
  'product-suit.svg': suitImage,
  'product-saree.svg': sareeImage,
  'product-kurti.svg': kurtiImage,
  'product-gown.svg': gownImage,
  'product-lehenga.svg': lehengaImage,
  'product-dress.svg': dressImage,
};

function MobileSearchPanel() {
  return (
    <section className="md:hidden py-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#8a4a42]">Search styles</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Find your perfect look</h2>
          </div>
          <div className="rounded-3xl bg-[#f7e6e2] p-4 text-2xl text-[#8a4a42] shadow-sm">🔎</div>
        </div>
        <label className="mt-6 block">
          <span className="sr-only">Search fashion, sarees, suits, dresses</span>
          <input
            type="search"
            placeholder="Search fashion, sarees, suits..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#c69d72] focus:ring-2 focus:ring-[#f5e1d9]/80"
          />
        </label>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Popular search categories</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.slice(0, 6).map((category) => (
            <button
              key={category.id}
              type="button"
              className="min-w-max rounded-full border border-slate-200 bg-[#fff5f2] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#c69d72] hover:bg-[#f5e1d9]"
            >
              {category.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileWishlist({ items }) {
  return (
    <section className="md:hidden py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#8a4a42]">Wishlist</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Saved styles</h2>
        </div>
        <span className="rounded-full bg-[#f7e6e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">
          {items.length} items
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {items.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
            <div className="relative overflow-hidden bg-slate-100 p-3">
              <img src={productImages[product.image]} alt={product.name} className="h-28 w-full object-contain" />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#8a4a42]">Wishlist</p>
                <button className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4a42]">Remove</button>
              </div>
              <h3 className="text-sm font-semibold text-slate-950">{product.name}</h3>
              <p className="text-xs text-slate-500">{product.category}</p>
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                <span>₹{product.price}</span>
                <span className="text-xs text-slate-500 line-through">₹{product.original}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileCart({ items }) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const savings = items.reduce((sum, item) => sum + (item.original - item.price), 0);

  return (
    <section className="md:hidden py-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#8a4a42]">Your cart</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Ready to checkout</h2>
          </div>
          <span className="rounded-full bg-[#f7e6e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">
            {items.length} items
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((product) => (
            <div key={product.id} className="flex items-center gap-4 rounded-[28px] border border-slate-200 p-4">
              <div className="h-20 w-20 overflow-hidden rounded-[26px] bg-slate-100">
                <img src={productImages[product.image]} alt={product.name} className="h-full w-full object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-950">{product.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>₹{product.price}</span>
                  <span className="text-xs text-slate-500 line-through">₹{product.original}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[32px] bg-[#f8f0ec] p-5 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span>Savings</span>
            <span className="text-[#8a4a42]">₹{savings}</span>
          </div>
          <button className="mt-6 w-full rounded-full bg-[#8a4a42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7a413d]">
            Checkout now
          </button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [activeNav, setActiveNav] = useState('home');
  const wishlistItems = products.filter((_, index) => index % 2 === 0).slice(0, 4);
  const cartItems = products.slice(0, 3);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf5f1] text-slate-900 antialiased">
      <DesktopHeader />
      <MobileHeader activeNav={activeNav} onAction={setActiveNav} />
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-28 md:pb-16">
        {activeNav === 'home' ? (
          <>
            <Hero />
            <CategorySection />
            <OfferBanners />
            <FeaturedProducts />
            <TrendingSection />
            <NewArrivals />
            <WhyChooseUs />
            <Reviews />
            <Newsletter />
          </>
        ) : activeNav === 'categories' ? (
          <CategorySection />
        ) : activeNav === 'search' ? (
          <MobileSearchPanel />
        ) : activeNav === 'wishlist' ? (
          <MobileWishlist items={wishlistItems} />
        ) : (
          <MobileCart items={cartItems} />
        )}
      </main>
      <Footer />
      <MobileBottomNav active={activeNav} onChange={setActiveNav} />
    </div>
  );
}

export default App;
