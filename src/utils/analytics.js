import api from '../services/api';
import { getOrCreateSessionId, readAttribution } from './attribution';

export function trackEvent(name, extra = {}) {
  const attribution = readAttribution();
  const payload = {
    name,
    sessionId: getOrCreateSessionId(),
    path: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` || '/' : '',
    ...attribution,
    ...extra,
  };
  delete payload.razorpay_signature;
  delete payload.razorpay_payment_id;
  delete payload.razorpay_order_id;
  delete payload.token;
  delete payload.password;
  api.post('/analytics/events', payload).catch(() => null);
}
