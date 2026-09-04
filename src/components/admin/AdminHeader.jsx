import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { pushAppRoute } from '../../utils/routing';
import Icon from '../layout/Icon';
import { Bell, Search } from 'lucide-react';
import { adminTitleFromPath } from './AdminSidebar';
import useAppPath from '../../hooks/useAppPath';

export default function AdminHeader({ onOpenSidebar }) {
  const { logout, user, switchMode } = useAuth();
  const path = useAppPath();
  const title = adminTitleFromPath(path);
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const headerRef = useRef(null);
  const initials = String(user?.name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const close = (event) => {
      if (!headerRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [notificationsOpen]);

  const openNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (!nextOpen) return;
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const data = await api.get('/notifications?limit=8');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotificationsError(error.message || 'Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const openNotification = async (item) => {
    if (!item.readAt) {
      try {
        const updated = await api.patch(`/notifications/${item._id}/read`, {});
        setNotifications((current) => current.map((entry) => (entry._id === item._id ? updated : entry)));
      } catch {
        // Navigation remains available if the read receipt cannot be saved.
      }
    }
    setNotificationsOpen(false);
    if (item.metadata?.orderId) pushAppRoute(`/admin/orders/detail?id=${encodeURIComponent(item.metadata.orderId)}`);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const term = search.trim();
    pushAppRoute(term ? `/admin/products?search=${encodeURIComponent(term)}` : '/admin/products');
  };

  return (
    <header ref={headerRef} className="admin-header sticky top-0 z-40">
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
        <NotificationMenu
          open={notificationsOpen}
          unreadCount={unreadCount}
          loading={notificationsLoading}
          error={notificationsError}
          notifications={notifications}
          onToggle={openNotifications}
          onOpen={openNotification}
        />
        <button type="button" onClick={logout} className="admin-btn admin-header__logout">
          Logout
        </button>
      </div>

      <div className="admin-header__row admin-header__row--desktop">
        <div className="admin-header__identity">
          <p className="admin-header__title">{title}</p>
          <p className="admin-header__subtitle">Welcome back, {user?.name?.split(' ')?.[0] || 'Admin'}</p>
        </div>
        <form className="admin-header__search" onSubmit={submitSearch} role="search">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-slate-400" placeholder="Search products..." aria-label="Search admin products" />
        </form>
        <div className="admin-header__actions">
          <NotificationMenu
            open={notificationsOpen}
            unreadCount={unreadCount}
            loading={notificationsLoading}
            error={notificationsError}
            notifications={notifications}
            onToggle={openNotifications}
            onOpen={openNotification}
          />
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

function NotificationMenu({ open, unreadCount, loading, error, notifications, onToggle, onOpen }) {
  return (
    <div className="admin-header__notifications">
      <button type="button" onClick={onToggle} className="admin-header__icon-btn" aria-label="Notifications" aria-expanded={open}>
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount ? <span className="admin-header__notification-count">{Math.min(unreadCount, 9)}</span> : null}
      </button>
      {open ? (
        <div className="admin-header__notification-panel">
          <div className="admin-header__notification-title"><strong>Notifications</strong><span>{unreadCount} unread</span></div>
          {loading ? <p className="admin-header__notification-state">Loading...</p> : null}
          {error ? <p className="admin-header__notification-state admin-header__notification-state--error">{error}</p> : null}
          {!loading && !error && !notifications.length ? <p className="admin-header__notification-state">You are all caught up.</p> : null}
          {!loading && !error ? notifications.map((item) => (
            <button key={item._id} type="button" onClick={() => onOpen(item)} className={`admin-header__notification-item${item.readAt ? '' : ' is-unread'}`}>
              <strong>{item.title || 'Update'}</strong>
              <span>{item.message || item.event}</span>
            </button>
          )) : null}
        </div>
      ) : null}
    </div>
  );
}
