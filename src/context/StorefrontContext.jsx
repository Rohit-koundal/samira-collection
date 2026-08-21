import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  captureAttribution,
  getOrCreateSessionId,
  parseStoreSlug,
  setStoreSlug,
} from '../utils/attribution';
import { trackEvent } from '../utils/analytics';

const StorefrontContext = createContext({
  store: null,
  storeSlug: '',
  loading: false,
  isHostStore: false,
});

export function StorefrontProvider({ route, children }) {
  const pathSlug = parseStoreSlug(route);
  const [pathStore, setPathStore] = useState(null);
  const [hostStore, setHostStore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOrCreateSessionId();
    const attribution = captureAttribution(route);
    if (attribution?.source === 'instagram') {
      try {
        if (!sessionStorage.getItem('samira_ig_source_sent')) {
          sessionStorage.setItem('samira_ig_source_sent', '1');
          trackEvent('INSTAGRAM_SOURCE', { reelId: attribution.reelId, campaign: attribution.campaign });
        }
      } catch {
        // ignore storage failures
      }
    }
  }, [route]);

  useEffect(() => {
    if (pathSlug) {
      setHostStore(null);
      return undefined;
    }
    let cancelled = false;
    api.get(`/stores/resolve?host=${encodeURIComponent(window.location.host)}`)
      .then((data) => {
        if (!cancelled) setHostStore(data?.slug && !data.isDefault ? data : null);
      })
      .catch(() => {
        if (!cancelled) setHostStore(null);
      });
    return () => { cancelled = true; };
  }, [pathSlug]);

  useEffect(() => {
    if (!pathSlug) {
      setPathStore(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    api.get(`/stores/${pathSlug}`)
      .then((data) => {
        if (!cancelled) setPathStore(data);
      })
      .catch(() => {
        if (!cancelled) setPathStore(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pathSlug]);

  const store = pathStore || hostStore;
  const storeSlug = pathSlug || hostStore?.slug || '';
  const isHostStore = Boolean(hostStore?.slug && !pathSlug);

  useEffect(() => {
    setStoreSlug(storeSlug);
  }, [storeSlug]);

  const value = useMemo(
    () => ({ store, storeSlug, loading, isHostStore }),
    [isHostStore, loading, store, storeSlug],
  );
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront() {
  return useContext(StorefrontContext);
}
