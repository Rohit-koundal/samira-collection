import { useEffect, useState } from 'react';
import api from '../../services/api';
import { OrderItem, OrderShell, OrderState } from '../../components/order/OrderUi';
import { orderDate } from '../../utils/orderPresentation';

export default function MyReturns({ navigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/returns/my-requests').then((data) => { if (active) setRequests(data); })
      .catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  return <OrderShell title="Returns & exchanges" breadcrumb="Returns & exchanges" detail navigate={navigate}>
    {loading ? <OrderState loading /> : error ? <OrderState title="Unable to load requests" error={error} retry={() => setReload((value) => value + 1)} />
      : !requests.length ? <OrderState title="No requests yet"><p>Eligible items can be returned or exchanged from their order details.</p><button className="sc-orders__button" onClick={() => navigate('/orders')}>View orders</button></OrderState>
        : <div className="sc-orders__list">{requests.map((request) => <article className="sc-order-panel" key={request._id}>
          <header><h2>{request.type === 'exchange' ? 'Exchange' : 'Return'} request</h2><span className="sc-order-status sc-order-status--return">{request.status}</span></header>
          <OrderItem item={{ name: request.product?.name || 'Ordered product', image: request.product?.images?.[0]?.url || request.product?.images?.[0] || '', size: request.size, color: request.color, quantity: request.quantity }} />
          <p>{request.reason}</p><p className="sc-orders__muted">Requested {orderDate(request.createdAt)} ? #{String(request._id).slice(-8).toUpperCase()}</p>
          {request.exchangeSize && <p className="sc-orders__muted">Replacement: {request.exchangeSize} {request.exchangeColor}</p>}
          {request.pickupScheduledAt && <p className="sc-orders__muted">Pickup scheduled {orderDate(request.pickupScheduledAt)}</p>}
          {request.adminComment && <p className="sc-orders__muted">{request.adminComment}</p>}
          <button className="sc-orders__text" onClick={() => navigate(`/order-detail?id=${request.order?._id || request.order}`)}>View order & request details ?</button>
        </article>)}</div>}
  </OrderShell>;
}
