import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { DEFAULT_WEBSITE_CONFIG, mergeWebsiteConfig } from '../config/websiteCustomization';
import { normalizeImageUrl } from '../services/normalize';

const WebsiteCustomizationContext = createContext(null);

export function WebsiteCustomizationProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_WEBSITE_CONFIG);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/website-config');
      setConfig(mergeWebsiteConfig(data.config));
      setTheme(data.theme || null);
      return data;
    } catch {
      setConfig((current) => mergeWebsiteConfig(current));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const name = String(config.branding.websiteName || '').trim();
    if (name) document.title = name;
    const href = normalizeImageUrl(config.branding.favicon);
    let favicon = document.querySelector('link[rel="icon"]');
    if (!href) {
      if (favicon?.dataset.originalHref) favicon.href = favicon.dataset.originalHref;
      return;
    }
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    if (!favicon.dataset.originalHref) favicon.dataset.originalHref = favicon.getAttribute('href') || '/favicon.ico';
    favicon.href = href;
  }, [config.branding.favicon, config.branding.websiteName]);

  const value = useMemo(() => ({ config, theme, loading, refresh }), [config, loading, refresh, theme]);
  return <WebsiteCustomizationContext.Provider value={value}>{children}</WebsiteCustomizationContext.Provider>;
}

export function useWebsiteCustomization() {
  const value = useContext(WebsiteCustomizationContext);
  if (!value) throw new Error('useWebsiteCustomization must be used inside WebsiteCustomizationProvider');
  return value;
}
