import CartItem from '../../components/cart/CartItem';
import PriceSummary from '../../components/cart/PriceSummary';
import { useCart } from '../../context/CartContext';
import { coupons } from '../../data/seedAdmin';

export default function Cart({ navigate }) {
  const cart = useCart();
  return (
    <section className="container-page py-8">
      <h1 className="mb-6 text-3xl font-black">Shopping Bag</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.map((item) => <CartItem key={item.product.id} item={item} updateQuantity={cart.updateQuantity} removeFromCart={cart.removeFromCart} />)}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Available Coupons</h2>
            <div className="mt-4 flex flex-wrap gap-2">{coupons.slice(0, 4).map((coupon) => <button key={coupon.code} onClick={() => cart.setCoupon(coupon)} className="rounded-xl border border-rose px-4 py-2 text-sm font-black text-rose">{coupon.code}</button>)}</div>
          </div>
        </div>
        <PriceSummary cart={cart} onAction={() => navigate('/checkout')} />
      </div>
    </section>
  );
}
