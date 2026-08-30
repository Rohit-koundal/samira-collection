import { useEffect, useState } from 'react';
import { ChevronRight, CircleX, PackageCheck, RefreshCcw, Sparkles, Truck } from 'lucide-react';
import { Card, CardContent } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { normalizeImageUrl } from '../../services/normalize';
import api from '../../services/api';
import { canCancelOrder } from '../../utils/orderActions';

export default function MyOrders({ navigate }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    if (!user?._id && !user?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    api.get('/orders/my-orders')
      .then(setOrders)
      .catch((err) => {
        setOrders([]);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [user?._id, user?.id]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = (event) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    setIsMobile(media.matches);
    return () => media.removeEventListener('change', onChange);
  }, []);

  if (!isMobile) {
    return (
      <section className="container-page py-6 md:py-8">
        <h1 className="page-title mb-5 md:mb-6 md:text-3xl">My Orders</h1>
        {loading && <Card><CardContent className="section-title p-6 text-center md:p-8">Loading orders...</CardContent></Card>}
        {error && <Card><CardContent className="section-title p-6 text-center text-rose md:p-8">{error}</CardContent></Card>}
        {!loading && !orders.length && <Card><CardContent className="section-title p-6 text-center md:p-8">No orders yet.</CardContent></Card>}
        <div className="space-y-3 md:space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="w-full text-left">
              <CardContent className="flex items-center justify-between gap-3 p-4 md:p-5">
                <button type="button" onClick={() => navigate(`/order-detail?id=${order._id}`)} className="min-w-0 text-left">
                  <b>{order._id.slice(-8).toUpperCase()}</b><br />
                  <span className="body-text text-slate-500">{order.orderStatus}</span>
                </button>
                <span className="price shrink-0">Rs. {order.finalAmount}</span>
              </CardContent>
              {canCancelOrder(order) ? (
                <div className="border-t border-slate-100 px-4 pb-4">
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#6d1f34]"
                    onClick={() => navigate(`/order-detail?id=${order._id}`)}
                  >
                    Cancel order
                  </button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fffaf7_0%,#f7f3fb_45%,#f6f7fb_100%)] pb-24">
      <div className="mx-auto w-full max-w-[470px] overflow-hidden bg-transparent">
        <div className="border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(255,248,245,0.94)_100%)] px-4 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b76e79]">Samira Collection</p>
              <h1 className="mt-1 text-[24px] font-bold leading-none text-[#1f2a44]">My Orders</h1>
              <p className="mt-2 max-w-[260px] text-[13px] leading-[1.45] text-slate-500">Track deliveries, exchanges and completed purchases in one elegant view.</p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-white/80 shadow-[0_10px_24px_rgba(31,42,68,0.08)]">
              <Sparkles className="h-5 w-5 text-[#c54c71]" />
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4 px-4 py-5">
            <LuxuryOrderSkeleton />
            <LuxuryOrderSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-8">
            <div className="rounded-[30px] border border-[#f3d6db] bg-[linear-gradient(180deg,#fff8f8_0%,#fff2f4_100%)] px-6 py-7 text-center shadow-[0_14px_30px_rgba(197,76,113,0.08)]">
              <p className="text-[16px] font-bold text-[#c54c71]">Unable to load orders</p>
              <p className="mt-2 text-[13px] leading-[1.45] text-slate-500">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && !orders.length && (
          <div className="px-4 py-8">
            <div className="rounded-[30px] border border-[#ece6e0] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f4_100%)] px-6 py-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
              <p className="text-[18px] font-bold text-[#1f2a44]">No orders yet</p>
              <p className="mt-2 text-[13px] leading-[1.45] text-slate-500">Once you place an order, your purchase journey will appear here.</p>
            </div>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4 px-4 py-5">
            {orders.map((order) => <LuxuryMobileOrderCard key={order._id} order={order} navigate={navigate} />)}
            <div className="px-2 py-4 text-center text-[13px] text-slate-500">
              You have reached the end of your orders
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LuxuryMobileOrderCard({ order, navigate }) {
  const meta = getOrderMeta(order);
  const primaryItem = order.orderItems?.[0];
  const image = primaryItem?.image ? normalizeImageUrl(primaryItem.image) : '';
  const helperText = getHelperText(order);
  const purchaser = order.shippingAddress?.fullName || 'You';

  return (
    <article className="overflow-hidden rounded-[32px] border border-[#efe7e3] bg-[linear-gradient(180deg,#ffffff_0%,#fffdfb_58%,#faf7ff_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] ${meta.iconWrapClass}`}>
          <meta.icon className={`h-5 w-5 ${meta.iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[18px] font-bold leading-none ${meta.titleClass}`}>{meta.title}</p>
          <p className="mt-1 text-[13px] leading-[1.35] text-slate-500">{meta.dateText}</p>
        </div>
        <span className="rounded-full border border-[#eadad4] bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b8192]">
          {order.paymentMethod || 'Prepaid'}
        </span>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate(`/order-detail?id=${order._id}`)}
          className="w-full rounded-[26px] border border-[#ece8f2] bg-white/95 p-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start gap-3">
            <div className="h-[94px] w-[68px] shrink-0 overflow-hidden rounded-[20px] bg-[#f3eee7]">
              {image ? (
                <img src={image} alt={primaryItem?.name || 'Order item'} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#ebe4db]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-bold leading-[1.15] text-[#1f2a44]">{primaryItem?.name || 'Order item'}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-[1.45] text-slate-500">
                    {buildItemSubtitle(primaryItem, order.orderItems)}
                  </p>
                  <p className="mt-2 text-[13px] text-slate-500">
                    Qty <span className="font-semibold text-[#1f2a44]">{primaryItem?.quantity || 1}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    Total <span className="font-semibold text-[#1f2a44]">Rs. {order.finalAmount}</span>
                  </p>
                </div>
                <ChevronRight className="mt-8 h-5 w-5 shrink-0 text-[#1f2a44]" />
              </div>
            </div>
          </div>

          {helperText ? (
            <div className="mt-3 flex items-center gap-2 border-t border-[#f1edf6] pt-3 text-[12px] leading-[1.4] text-slate-500">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ece7ef] text-[#6f7481]">×</span>
              <span>{helperText}</span>
            </div>
          ) : null}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/60 bg-[linear-gradient(180deg,#faf7ff_0%,#f8f4fb_100%)] px-4 py-3">
        <p className="text-[13px] text-[#4b5565]">
          Purchased for <span className="font-bold text-[#1f2a44]">{purchaser}</span>
        </p>
        {canCancelOrder(order) ? (
          <button
            type="button"
            onClick={() => navigate(`/order-detail?id=${order._id}`)}
            className="rounded-[14px] bg-white px-3 py-2 text-[12px] font-semibold text-[#6d1f34] shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            Cancel order
          </button>
        ) : (
          <span className="rounded-[14px] bg-white px-3 py-2 text-[12px] font-semibold text-[#6c7484] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            {order._id.slice(-6).toUpperCase()}
          </span>
        )}
      </div>
    </article>
  );
}

function LuxuryOrderSkeleton() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#efe7e3] bg-[linear-gradient(180deg,#ffffff_0%,#fffdfb_58%,#faf7ff_100%)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-[18px] bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-36 rounded bg-slate-100" />
          <div className="h-3 w-40 rounded bg-slate-100" />
        </div>
        <div className="h-8 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 rounded-[26px] border border-[#ece8f2] bg-white/95 p-3">
        <div className="flex items-start gap-3">
          <div className="h-[94px] w-[68px] rounded-[20px] bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-36 rounded bg-slate-100" />
            <div className="h-3 w-44 rounded bg-slate-100" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="h-8 w-20 rounded-[14px] bg-slate-100" />
      </div>
    </div>
  );
}

function getOrderMeta(order) {
  const timeline = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];
  const latest = timeline[timeline.length - 1];
  const status = String(order.orderStatus || latest?.status || '').toLowerCase();
  const dateSource = latest?.date || order.updatedAt || order.createdAt;
  const dateText = dateSource
    ? new Date(dateSource).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Status updated recently';

  if (status.includes('cancel')) {
    return {
      title: 'Cancelled',
      dateText,
      icon: CircleX,
      iconWrapClass: 'bg-[linear-gradient(135deg,#fff3f4_0%,#ffe4e8_100%)]',
      iconClass: 'text-[#d94b6d]',
      titleClass: 'text-[#25314a]',
    };
  }

  if (status.includes('exchange') || status.includes('return') || status.includes('refund')) {
    return {
      title: order.orderStatus || 'Exchange in progress',
      dateText,
      icon: RefreshCcw,
      iconWrapClass: 'bg-[linear-gradient(135deg,#eefcf7_0%,#def7ee_100%)]',
      iconClass: 'text-[#11a56f]',
      titleClass: 'text-[#11a56f]',
    };
  }

  if (status.includes('deliver')) {
    return {
      title: 'Delivered',
      dateText,
      icon: PackageCheck,
      iconWrapClass: 'bg-[linear-gradient(135deg,#effcf7_0%,#dcf7ed_100%)]',
      iconClass: 'text-[#10a56e]',
      titleClass: 'text-[#10a56e]',
    };
  }

  return {
    title: order.orderStatus || 'Order Placed',
    dateText,
    icon: Truck,
    iconWrapClass: 'bg-[linear-gradient(135deg,#f7f0ff_0%,#ede7ff_100%)]',
    iconClass: 'text-[#7765c4]',
    titleClass: 'text-[#1f2a44]',
  };
}

function getHelperText(order) {
  const status = String(order.orderStatus || '').toLowerCase();
  if (status.includes('cancel')) return '';
  if (status.includes('exchange') || status.includes('return')) return 'Return or exchange updates will continue here.';
  if (status.includes('deliver')) return 'Exchange/Return window details are available inside this order.';
  return 'We will keep you updated as your order moves forward.';
}

function buildItemSubtitle(primaryItem, items = []) {
  const secondaryText = Array.isArray(items) && items.length > 1 ? ` • +${items.length - 1} more` : '';
  const parts = [];
  if (primaryItem?.color) parts.push(primaryItem.color);
  if (primaryItem?.size) parts.push(`Size: ${primaryItem.size}`);
  return parts.length ? `${parts.join(' • ')}${secondaryText}` : `Order details${secondaryText}`;
}
