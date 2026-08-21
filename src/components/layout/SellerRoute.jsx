import { useAuth } from '../../context/AuthContext';
import SellerLayout from '../seller/SellerLayout';

export default function SellerRoute({ children }) {
  const { user, switchMode } = useAuth();
  if (!user) {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black">Seller login required</h1>
          <p className="mt-3 text-sm text-slate-600">Sign in to open your boutique dashboard.</p>
          <a href="/login" className="mt-6 inline-flex rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Login</a>
        </div>
      </section>
    );
  }

  const canSell = user.availableModes?.includes('seller') || (user.stores || []).length > 0;
  if (!canSell) {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black">Start your boutique</h1>
          <p className="mt-3 text-sm text-slate-600">Create a store to sell from Instagram and WhatsApp.</p>
          <a href="/seller/onboarding" className="mt-6 inline-flex rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Create store</a>
        </div>
      </section>
    );
  }

  if (user.activeMode !== 'seller') {
    return (
      <section className="grid min-h-screen place-items-center bg-[#f7f2eb] px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black">Switch to Seller Mode</h1>
          <p className="mt-3 text-sm text-slate-600">Your boutique tools stay separate from shopping.</p>
          <button type="button" onClick={() => switchMode('seller')} className="mt-6 rounded-full bg-wine px-6 py-3 text-sm font-black text-white">Switch to Seller</button>
        </div>
      </section>
    );
  }

  return <SellerLayout>{children}</SellerLayout>;
}
