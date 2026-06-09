import CartItem from '../../components/cart/CartItem';
import PriceSummary from '../../components/cart/PriceSummary';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import api from '../../services/api';

export default function Cart({ navigate }) {
  const cart = useCart();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const applyCoupon = async () => {
    try {
      const data = await api.post('/coupons/apply', { code, amount: cart.sellingTotal });
      cart.setCoupon({ code: data.coupon.code, discount: data.discount });
      setMessage(`${data.coupon.code} applied`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="container-page py-8">
      <h1 className="mb-6 text-3xl font-black">Shopping Bag</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.length === 0 && <div className="rounded-2xl bg-white p-8 text-center font-bold">Your cart is empty.</div>}
          {cart.items.map((item) => <CartItem key={`${item.product._id || item.product.id}-${item.size}-${item.color}`} item={item} updateQuantity={cart.updateQuantity} removeFromCart={cart.removeFromCart} />)}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Apply Coupon</h2>
            <div className="mt-4 flex gap-2">
              <input value={code} onChange={(event) => setCode(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder="Coupon code" />
              <button onClick={applyCoupon} className="rounded-xl bg-wine px-4 text-sm font-black text-white">Apply</button>
            </div>
            {message && <p className="mt-3 text-sm font-bold text-wine">{message}</p>}
          </div>
        </div>
        <PriceSummary cart={cart} onAction={() => navigate('/checkout')} />
      </div>
    </section>
  );
}
