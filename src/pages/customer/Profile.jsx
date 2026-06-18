import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, FileText, Heart, MapPin, Package, ShieldCheck } from 'lucide-react';

const accountLinks = [
  { title: 'Orders', subtitle: 'Check your order status', icon: Package, action: '/orders' },
  { title: 'Collections & Wishlist', subtitle: 'All your curated product collections', icon: Heart, action: '/wishlist' },
  { title: 'Addresses', subtitle: 'Save addresses for a hassle-free checkout', icon: MapPin, action: '/profile/addresses' },
  { title: 'Coupons', subtitle: 'Manage coupons for additional discounts', icon: ShieldCheck },
  { title: 'Profile Details', subtitle: 'Change your profile details', icon: FileText, action: '/profile/details' },
];

const footerLinks = ['FAQs', 'ABOUT US', 'TERMS OF USE', 'CUSTOMER POLICIES', 'USEFUL LINKS'];

export default function Profile({ navigate }) {
  const { user, logout, switchMode } = useAuth();
  const displayName = useMemo(() => {
    return user?.name || user?.fullName || user?.email || user?.phone || 'Account';
  }, [user]);

  return (
    <section className="min-h-screen bg-[#f6f7fb] pb-10 md:pb-8">
      <div className="mx-auto w-full max-w-[470px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)] md:max-w-none md:bg-transparent md:shadow-none">
        <div className="hidden md:block">
          <div className="container-page py-6">
            <h1 className="page-title">My Profile</h1>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden bg-[#f1f1f1]">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[#f1f1f1]">
                  <div className="h-14 w-14 rounded-full bg-[#d9d9d9]" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="small-text uppercase tracking-[0.18em] text-slate-400">Logged in as</p>
              <h1 className="mt-1 truncate text-[16px] font-bold text-[#2f3851] sm:text-[18px]">{displayName}</h1>
              <p className="mt-1 truncate text-[12px] text-slate-500 sm:text-[13px]">
                {user?.phone || user?.email || 'Manage your account and orders'}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 bg-white">
          {accountLinks.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => item.action && navigate?.(item.action)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center text-slate-400">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold leading-[1.15] text-[#182033]">{item.title}</h2>
                <p className="mt-1 text-[11px] leading-[1.35] text-slate-400 sm:text-[12px]">{item.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>

        <div className="border-t-8 border-slate-100 bg-white px-4 py-4">
          <div className="grid gap-4">
            {footerLinks.map((label) => (
              <button key={label} type="button" className="text-left text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-[#f8f2f2] p-4">
          <button
            type="button"
            onClick={logout}
            className="h-12 w-full rounded-lg bg-[#ff5b5b] text-[14px] font-bold text-white transition hover:bg-[#f24a4a]"
          >
            LOGOUT
          </button>
          {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
            <button
              type="button"
              onClick={() => switchMode('admin')}
              className="mt-3 h-11 w-full rounded-lg border border-wine bg-white text-[13px] font-bold text-wine"
            >
              Switch to Admin
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
