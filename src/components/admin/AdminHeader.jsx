import { useAuth } from '../../context/AuthContext';
import Icon from '../layout/Icon';
import { Bell, Search } from 'lucide-react';
import { adminTitleFromPath } from './AdminSidebar';
import useAppPath from '../../hooks/useAppPath';

export default function AdminHeader({ onOpenSidebar }) {
  const { logout, user, switchMode } = useAuth();
  const path = useAppPath();
  const title = adminTitleFromPath(path);
  const initials = String(user?.name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="admin-header sticky top-0 z-40">
      <div className="admin-header__strip">
        <span>Samira Collection · Admin</span>
        <span className="admin-header__strip-note">Free shipping, returns and live catalog stay in sync</span>
      </div>

      <div className="admin-header__row admin-header__row--mobile">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="admin-header__icon-btn"
          aria-label="Open admin menu"
        >
          <Icon name="menu" />
        </button>
        <div className="admin-header__identity">
          <p className="admin-header__title">{title}</p>
        </div>
        <button type="button" onClick={logout} className="admin-btn admin-header__logout">
          Logout
        </button>
      </div>

      <div className="admin-header__row admin-header__row--desktop">
        <div className="admin-header__identity">
          <p className="admin-header__title">{title}</p>
          <p className="admin-header__subtitle">Welcome back, {user?.name?.split(' ')?.[0] || 'Admin'}</p>
        </div>
        <label className="admin-header__search">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-slate-400" placeholder="Search products, orders..." />
        </label>
        <div className="admin-header__actions">
          <button type="button" className="admin-header__icon-btn" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <div className="admin-header__user">
            <div className="admin-header__avatar">{initials || 'A'}</div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-charcoal">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-slate-500">Super Admin</p>
            </div>
          </div>
          <button type="button" onClick={() => switchMode('customer')} className="admin-btn-ghost">
            Storefront
          </button>
          <button type="button" onClick={logout} className="admin-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
