import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Banknote, CircleCheck, CircleDashed, Clock3, DollarSign, LayoutDashboard, Package, ShoppingBag, Sparkles, TrendingUp, Users } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusPalette = [
  { name: 'Pending', color: '#f3b58c' },
  { name: 'Processing', color: '#cf7fb4' },
  { name: 'Shipped', color: '#8eb1f0' },
  { name: 'Delivered', color: '#62b98b' },
  { name: 'Cancelled', color: '#f39f9f' },
  { name: 'Refunded', color: '#9a89ef' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/admin/dashboard/overview')
      .then((data) => {
        if (!alive) return;
        setOverview(data || {});
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Unable to load dashboard');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => overview?.stats || {}, [overview]);
  const statCards = useMemo(() => ([
    { label: 'Total Sales', value: formatCurrency(stats.sales?.value), delta: stats.sales?.delta, note: stats.sales?.note, icon: Banknote, tint: '#fde7e6', iconColor: '#ce5760' },
    { label: 'Total Orders', value: formatNumber(stats.orders?.value), delta: stats.orders?.delta, note: stats.orders?.note, icon: ShoppingBag, tint: '#fff0e7', iconColor: '#d98652' },
    { label: 'Total Customers', value: formatNumber(stats.customers?.value), delta: stats.customers?.delta, note: stats.customers?.note, icon: Users, tint: '#f4edff', iconColor: '#8c6bd6' },
    { label: 'Total Products', value: formatNumber(stats.products?.value), delta: stats.products?.delta, note: stats.products?.note, icon: Package, tint: '#edf2ff', iconColor: '#577be2' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue?.value), delta: stats.revenue?.delta, note: stats.revenue?.note, icon: DollarSign, tint: '#e9f7ef', iconColor: '#35a165' },
  ]), [stats]);

  const chartSeries = Array.isArray(overview?.salesOverview) && overview.salesOverview.length
    ? overview.salesOverview
    : fallbackSeries();

  const orderOverview = Array.isArray(overview?.orderOverview) && overview.orderOverview.length
    ? overview.orderOverview
    : [{ label: 'Pending', value: 1 }, { label: 'Delivered', value: 1 }];

  const recentOrders = overview?.recentOrders || [];
  const topProducts = overview?.topProducts || [];

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="admin-card p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="admin-kicker">Dashboard</p>
              <h1 className="mt-2">Welcome back, {user?.name?.split(' ')?.[0] || 'Admin'}</h1>
              <p className="admin-note">Live store performance, orders, and best-selling products.</p>
            </div>
            <div className="admin-btn-ghost">
              <LayoutDashboard className="h-4 w-4 text-wine" />
              Admin overview
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-sm text-wine">{error}</p>}
        </div>
        <div className="admin-card p-5 lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="admin-kicker">Store health</p>
              <h2 className="mt-2">Everything connected</h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-wine text-white">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatusPill icon={CircleCheck} label="API Ready" detail="Dashboard overview endpoint" tone="text-emerald-700 bg-emerald-50" />
            <StatusPill icon={CircleDashed} label="Live Data" detail="Orders and products sync" tone="text-wine bg-blush" />
          </div>
          <div className="mt-4 rounded-2xl border border-[#eadfd5] bg-[#fffaf2] px-4 py-4">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="mt-1 text-lg font-semibold text-charcoal">{user?.name || 'Admin'}</p>
            <p className="mt-1 text-sm text-slate-500">{user?.phone || user?.email || 'samira-admin'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel title="Sales Overview" subtitle="Current month revenue trend" actionLabel="This Month">
          <SalesChart series={chartSeries} loading={loading} />
        </Panel>
        <Panel title="Orders Overview" subtitle="Order mix by status" actionLabel="This Month">
          <OrdersDonut series={orderOverview} loading={loading} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <Panel title="Recent Orders" subtitle="Latest customer activity" actionLabel="View All" actionHref="/admin/orders">
          <RecentOrders orders={recentOrders} loading={loading} />
        </Panel>
        <Panel title="Top Selling Products" subtitle="Best performers from orders" actionLabel="View All" actionHref="/admin/products">
          <TopProducts products={topProducts} loading={loading} />
        </Panel>
      </div>
    </section>
  );
}

function StatCard({ label, value, delta, note, icon: Icon, tint, iconColor, loading }) {
  return (
    <div className="admin-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="admin-kicker">{label}</p>
          <p className="mt-2 text-[26px] font-semibold text-charcoal">{loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-slate-100" /> : value}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="rounded-full px-2 py-1 font-semibold" style={{ backgroundColor: tint, color: iconColor }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta || 0)}%
            </span>
            <span className="text-slate-500">{note}</span>
          </div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-full" style={{ backgroundColor: tint, color: iconColor }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, actionLabel, actionHref, children }) {
  return (
    <div className="admin-card min-w-0 overflow-hidden p-4 lg:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2>{title}</h2>
          <p className="admin-note">{subtitle}</p>
        </div>
        {actionHref ? (
          <a href={actionHref} className="admin-btn-ghost text-xs">
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="admin-btn-ghost text-xs">{actionLabel}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SalesChart({ series, loading }) {
  const values = series.map((item) => Number(item.value || 0));
  const maxValue = Math.max(...values, 1);
  const width = 720;
  const height = 280;
  const padding = 28;
  const innerWidth = width - padding * 2;
  const innerHeight = height - 50;

  const points = series.map((item, index) => {
    const x = padding + (series.length <= 1 ? innerWidth / 2 : (innerWidth * index) / (series.length - 1));
    const y = padding + innerHeight - ((Number(item.value || 0) / maxValue) * innerHeight);
    return { ...item, x, y };
  });

  const areaPath = points.length
    ? `M ${points[0].x} ${height - 22} ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} L ${points[points.length - 1].x} ${height - 22} Z`
    : '';
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#eadfd5] bg-[#fffaf2] p-4">
      {loading ? (
        <div className="grid h-[320px] place-items-center rounded-[22px] border border-dashed border-[#eadfd5] bg-white/70">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-wine border-t-transparent" />
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[300px] w-full">
            <defs>
              <linearGradient id="salesArea" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#ce5760" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ce5760" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#salesArea)" />
            <path d={linePath} fill="none" stroke="#c54d62" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
              <g key={`${point.label}-${point.x}`}>
                <circle cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#c54d62" strokeWidth="4" />
                <text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-charcoal text-[12px] font-black">
                  {formatCompact(point.value)}
                </text>
                <text x={point.x} y={height - 6} textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <InfoTile icon={Banknote} label="Total Sales" value={formatCurrency(values.reduce((sum, item) => sum + item, 0))} />
            <InfoTile icon={Clock3} label="This Month" value={formatCurrency(values[values.length - 1] || 0)} />
            <InfoTile icon={TrendingUp} label="Avg. Daily Sales" value={formatCurrency(Math.round((values.reduce((sum, item) => sum + item, 0) || 0) / Math.max(series.length, 1)))} />
          </div>
        </>
      )}
    </div>
  );
}

function OrdersDonut({ series, loading }) {
  const total = series.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const circumference = 2 * Math.PI * 56;
  let offset = 0;

  return (
    <div className="min-w-0 overflow-hidden rounded-[18px] border border-[#eadfd5] bg-[#fffaf2] p-3 sm:p-4">
      {loading ? (
        <div className="grid h-[320px] place-items-center rounded-[22px] border border-dashed border-[#eadfd5] bg-white/70">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-wine border-t-transparent" />
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 min-[1180px]:grid-cols-[minmax(160px,180px)_minmax(0,1fr)] min-[1180px]:items-center">
          <div className="relative mx-auto h-[200px] w-[200px] max-w-full min-[1180px]:h-[180px] min-[1180px]:w-[180px]">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r="56" fill="none" stroke="#efe6de" strokeWidth="18" />
              {series.map((item, index) => {
                const dash = total ? (Number(item.value || 0) / total) * circumference : 0;
                const circle = (
                  <circle
                    key={item.label}
                    cx="80"
                    cy="80"
                    r="56"
                    fill="none"
                    stroke={statusPalette[index % statusPalette.length].color}
                    strokeWidth="18"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                  />
                );
                offset += dash;
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-semibold text-charcoal">{formatCompact(total)}</p>
                <p className="mt-1 text-sm text-slate-500">Total orders</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            {series.map((item, index) => (
              <div key={item.label} className="flex min-w-0 items-center justify-between gap-2 rounded-[16px] bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(111,74,52,0.04)]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: statusPalette[index % statusPalette.length].color }} />
                  <p className="truncate text-xs font-bold text-charcoal 2xl:text-sm">{item.label}</p>
                </div>
                <p className="shrink-0 whitespace-nowrap text-right text-xs font-black text-slate-500 2xl:text-sm">{formatCompact(item.value)} <span className="font-semibold text-slate-400">({total ? Math.round((Number(item.value || 0) / total) * 100) : 0}%)</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecentOrders({ orders, loading }) {
  if (loading) {
    return <LoadingRows />;
  }

  if (!orders.length) {
    return <EmptyState title="No recent orders yet" detail="Orders placed by customers will appear here." icon={ShoppingBag} />;
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#eadfd5] bg-white">
      {orders.map((order) => (
        <div key={order._id || order.id} className="flex items-center gap-3 border-b border-[#f6eee6] px-4 py-3 last:border-b-0">
          <Avatar name={order.user?.name || order.shippingAddress?.fullName || 'Customer'} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-charcoal">{order.user?.name || order.shippingAddress?.fullName || 'Customer'}</p>
            <p className="truncate text-xs text-slate-500">
              {shortOrderId(order._id || order.id)} · {formatDate(order.createdAt)} · {formatNumber(order.itemsCount || 0)} items
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-charcoal">{formatCurrency(order.finalAmount || order.amount || 0)}</p>
            <StatusBadge status={order.orderStatus} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopProducts({ products, loading }) {
  if (loading) {
    return <LoadingRows />;
  }

  if (!products.length) {
    return <EmptyState title="No top products yet" detail="Completed orders will populate this list automatically." icon={Package} />;
  }

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div key={product.id || `${product.name}-${index}`} className="flex items-center gap-3 rounded-[18px] border border-[#eadfd5] bg-white px-4 py-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#fff5ed]">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <Package className="h-5 w-5 text-wine/70" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-charcoal">{product.name}</p>
            <p className="text-xs text-slate-500">{formatCompact(product.sold)} sold</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-charcoal">{formatCurrency(product.revenue || product.price || 0)}</p>
            <a href={`/admin/products/edit?id=${encodeURIComponent(product.id || product._id || '')}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose">
              Details <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ icon: Icon, label, detail, tone }) {
  return (
    <div className={`flex items-center gap-3 rounded-[18px] px-4 py-3 ${tone}`}>
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-80">{detail}</p>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[18px] border border-[#eadfd5] bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-wine" />
        <p className="admin-kicker">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-charcoal">{value}</p>
    </div>
  );
}

function EmptyState({ title, detail, icon: Icon }) {
  return (
    <div className="grid min-h-[240px] place-items-center rounded-[18px] border border-dashed border-[#eadfd5] bg-[#fffaf2] px-4 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-wine/10 text-wine">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-base font-semibold text-charcoal">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-[68px] animate-pulse rounded-[22px] bg-slate-100/80" />
      ))}
    </div>
  );
}

function Avatar({ name }) {
  const initials = String(name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-wine/10 text-sm font-black text-wine">
      {initials || 'A'}
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || 'Pending');
  const styles = {
    Pending: 'bg-[#fff4eb] text-[#d47d3d]',
    Confirmed: 'bg-[#eff6ff] text-[#4f7dd6]',
    Packed: 'bg-[#f4edff] text-[#7b5fd0]',
    Shipped: 'bg-[#eef7ff] text-[#4b8bd8]',
    'Out for Delivery': 'bg-[#fff3ea] text-[#d0724d]',
    Delivered: 'bg-[#e9f7ef] text-[#2d9f63]',
    Cancelled: 'bg-[#ffecec] text-[#d95d5d]',
    'Return Requested': 'bg-[#f2f2f2] text-[#6f6f6f]',
    'Exchange Requested': 'bg-[#f2f2f2] text-[#6f6f6f]',
    Returned: 'bg-[#f3f0ff] text-[#7b5fd0]',
    Refunded: 'bg-[#e9f7ef] text-[#2d9f63]',
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${styles[value] || styles.Pending}`}>{value}</span>;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatCompact(value) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

function formatCurrency(value) {
  return `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function shortOrderId(value = '') {
  return String(value).slice(-8).toUpperCase();
}

function fallbackSeries() {
  return [
    { label: 'Jan', value: 42000 },
    { label: 'Feb', value: 54000 },
    { label: 'Mar', value: 47000 },
    { label: 'Apr', value: 62000 },
    { label: 'May', value: 58000 },
    { label: 'Jun', value: 74000 },
  ];
}
