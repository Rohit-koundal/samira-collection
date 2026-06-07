import AddressSelector from '../../components/checkout/AddressSelector';
import PaymentMethod from '../../components/checkout/PaymentMethod';
import OrderSummary from '../../components/checkout/OrderSummary';
import PriceSummary from '../../components/cart/PriceSummary';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Checkout({ navigate }) {
  const cart = useCart();
  const { setToast } = useAuth();
  return (
    <section className="container-page py-8">
      <h1 className="mb-6 text-3xl font-black">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5"><AddressSelector /><OrderSummary items={cart.items} /><PaymentMethod /></div>
        <PriceSummary cart={cart} cta="Place Order" onAction={() => { setToast('Order placed successfully'); navigate('/orders'); }} />
      </div>
    </section>
  );
}
