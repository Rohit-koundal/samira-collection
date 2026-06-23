import { useAuth } from '../../context/AuthContext';
import Icon from '../layout/Icon';
import { Bell, ChevronDown, Search, ShieldCheck } from 'lucide-react';

export default function AdminHeader({ onOpenSidebar }) {
  const { logout, user, switchMode } = useAuth();
  const initials = String(user?.name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[rgba(255,250,245,0.9)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4 lg:px-5">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid h-9 w-9 place-items-center rounded-[14px] border border-[#eadfd5] bg-white text-charcoal lg:hidden"
          aria-label="Open admin sidebar"
        >
          <Icon name="menu" />
        </button>
        <div className="min-w-0">
          <p className="text-[15px] font-black leading-tight text-charcoal sm:text-[17px]">Dashboard</p>
          <p className="truncate text-[11px] font-semibold text-slate-500 sm:text-[12px]">Welcome back, Admin 👋</p>
        </div>
        <div className="order-3 hidden min-w-[220px] flex-1 md:block lg:order-none lg:max-w-[320px]">
          <div className="flex h-10 items-center gap-2 rounded-[16px] border border-[#eadfd5] bg-white px-3.5 shadow-[0_8px_20px_rgba(111,74,52,0.04)]">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              className="w-full bg-transparent text-[13px] font-semibold text-charcoal outline-none placeholder:text-slate-400"
              placeholder="Search here..."
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <button className="grid h-9 w-9 place-items-center rounded-full border border-[#eadfd5] bg-white text-charcoal" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <div className="hidden items-center gap-2.5 rounded-[18px] border border-[#eadfd5] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(111,74,52,0.04)] sm:flex">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-wine text-[13px] font-black text-white">
              {initials || 'A'}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-black text-charcoal">{user?.name || 'Admin'}</p>
              <p className="text-[11px] font-semibold text-slate-500">{user?.role === 'admin' ? 'Super Admin' : 'Admin'}</p>
            </div>
            <ChevronDown className="h-[14px] w-[14px] text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => switchMode('customer')} className="hidden rounded-full border border-[#eadfd5] px-3.5 py-2 text-[12px] font-bold text-charcoal lg:inline-flex">
              Customer Mode
            </button>
            <button onClick={logout} className="rounded-full bg-wine px-3.5 py-2 text-[12px] font-black text-white">
              Logout
            </button>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 md:hidden">
          <div className="flex items-center gap-2 rounded-[18px] border border-[#eadfd5] bg-white px-3 py-2 text-[11px] font-bold text-charcoal">
            <ShieldCheck className="h-4 w-4 text-rose" />
            {user?.role === 'admin' ? 'Admin Mode' : 'Customer Mode'}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => switchMode('customer')} className="rounded-full border border-[#eadfd5] px-3 py-2 text-[11px] font-black text-charcoal">Customer</button>
            <button onClick={logout} className="rounded-full bg-wine px-3 py-2 text-[11px] font-black text-white">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}
