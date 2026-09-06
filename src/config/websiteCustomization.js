export const HOME_SECTION_DEFAULTS = [
  { id: 'hero', label: 'Hero Section', visible: true, order: 10, heading: 'Where Tradition Meets Modern Grace', description: 'Premium ethnic wear for every celebration.', buttonText: 'Shop New Arrivals', buttonLink: '/products?newArrival=true', image: '', backgroundImage: '' },
  { id: 'services', label: 'Service Highlights', visible: true, order: 15, heading: 'Why Shop With Us', description: 'Shipping, returns and secure payment benefits.', buttonText: '', buttonLink: '', image: '', backgroundImage: '' },
  { id: 'categories', label: 'Featured Categories', visible: true, order: 20, heading: 'Shop by Category', description: 'Curated styles for every occasion.', buttonText: '', buttonLink: '', image: '', backgroundImage: '' },
  { id: 'promotional', label: 'Promotional Banners', visible: true, order: 30, heading: 'Featured Collections', description: '', buttonText: 'Shop Now', buttonLink: '/products', image: '', backgroundImage: '' },
  { id: 'featured', label: 'Featured Products', visible: true, order: 40, heading: 'Featured Products', description: 'A curated edit from the collection.', buttonText: 'View All', buttonLink: '/products?featured=true', image: '', backgroundImage: '' },
  { id: 'newArrivals', label: 'New Arrivals', visible: true, order: 50, heading: 'New Arrivals', description: 'Fresh styles added to the collection.', buttonText: 'View All', buttonLink: '/products?newArrival=true', image: '', backgroundImage: '' },
  { id: 'bestSellers', label: 'Best Sellers', visible: true, order: 60, heading: 'Best Sellers', description: 'Customer favourites from Samira Collection.', buttonText: 'View All', buttonLink: '/products?bestSeller=true', image: '', backgroundImage: '' },
  { id: 'ethnicSets', label: 'Ethnic Sets', visible: true, order: 64, heading: 'Complete Occasion-Ready Looks', description: 'Coordinated silhouettes for weddings, celebrations, and everyday elegance.', buttonText: 'View All', buttonLink: '/products?search=Set', image: '', backgroundImage: '' },
  { id: 'accessories', label: 'Accessories', visible: true, order: 66, heading: 'The Finishing Touch', description: 'Complete every look with thoughtfully selected accessories.', buttonText: 'View All', buttonLink: '/products?search=Accessory', image: '', backgroundImage: '' },
  { id: 'trending', label: 'Trending Products', visible: true, order: 70, heading: 'Trending Now', description: 'Styles customers are discovering now.', buttonText: 'View All', buttonLink: '/products?trending=true', image: '', backgroundImage: '' },
  { id: 'sale', label: 'Sale Banner', visible: true, order: 80, heading: 'Season Sale', description: 'Discover current offers across the collection.', buttonText: 'View Offers', buttonLink: '/products?discount=20', image: '', backgroundImage: '' },
  { id: 'reviews', label: 'Customer Reviews', visible: true, order: 90, heading: 'Loved by Our Customers', description: 'Real stories from the Samira community.', buttonText: '', buttonLink: '', image: '', backgroundImage: '' },
  { id: 'newsletter', label: 'Newsletter', visible: true, order: 100, heading: 'Join Samira Circle', description: 'Get early access to new drops, offers, and styling updates.', buttonText: 'Subscribe', buttonLink: '', image: '', backgroundImage: '' },
  { id: 'instagram', label: 'Instagram / Social', visible: true, order: 110, heading: 'Style Inspiration', description: 'Discover more from our latest collection.', buttonText: 'Explore', buttonLink: '/products', image: '', backgroundImage: '' },
];

export const DEFAULT_WEBSITE_CONFIG = {
  schemaVersion: 2,
  branding: { websiteName: 'Samira Collection', tagline: 'Elegance for every celebration', logo: '', favicon: '' },
  colors: { primary: '#6d1f34', secondary: '#fff0f4', accent: '#b8914a', background: '#fffaf2', surface: '#ffffff', text: '#17161a', mutedText: '#6f6470' },
  header: { background: '#fffaf2', textColor: '#17161a', logoSize: 72, menuAlignment: 'left', sticky: true, announcementEnabled: true, announcementText: 'Free Shipping Above ₹999', announcementBackground: '#830b31', announcementTextColor: '#ffffff' },
  homepage: {
    sections: HOME_SECTION_DEFAULTS,
    featuredCategoryIds: [],
    categoryImages: [],
    sectionProductIds: { featured: [], newArrivals: [], bestSellers: [], trending: [], ethnicSets: [], accessories: [] },
  },
  typography: { headingFont: 'Playfair Display', bodyFont: 'Inter', headingScale: 1, bodyScale: 1, headingWeight: 700, bodyWeight: 400, buttonFont: 'Inter', buttonWeight: 700 },
  buttons: { background: '#6d1f34', textColor: '#ffffff', borderRadius: 8, style: 'solid', size: 'medium', hoverEffect: 'lift' },
  productCards: { layout: 'classic', imageRatio: '4/5', borderRadius: 12, shadow: 'soft', showTitle: true, showPrice: true, showDiscount: true, showRating: true, showWishlist: true, showAddToCart: true, quickView: false },
  footer: {
    enabled: true, background: '#4b071b', textColor: '#ffffff', logo: '', description: 'Crafted with elegance, designed for you. Premium ethnic wear for every celebration.', showContact: true, showSocialLinks: true, showNewsletter: true,
    contactEmail: '', contactPhone: '', contactAddress: '', socialLinks: { instagram: '', facebook: '', youtube: '', pinterest: '' },
    menus: {
      shopping: [{ label: 'New Arrivals', path: '/products?newArrival=true' }, { label: 'Sarees', path: '/products?search=Saree' }, { label: 'Suits', path: '/products?search=Suit' }, { label: 'Accessories', path: '/products?search=Accessory' }, { label: 'Sale', path: '/products?discount=20' }],
      policies: [{ label: 'Track Your Order', path: '/orders' }, { label: 'Returns & Refunds', path: '/returns' }, { label: 'Shipping Policy', path: '/shipping-policy' }, { label: 'Contact Us', path: '/contact' }],
      about: [{ label: 'Our Story', path: '/our-story' }, { label: 'Reviews', path: '/products?bestSeller=true' }],
    },
    copyrightText: '© Samira Collection. All rights reserved.',
  },
  layout: { mode: 'full', maxWidth: 1520, sectionSpacing: 72, gridGap: 20, productsPerRow: { desktop: 4, tablet: 3, mobile: 2 } },
  mobile: {
    enabled: false,
    headerBackground: '#ffffff', headerText: '#334155',
    pageBackground: '#fcfaf7', gridGap: 12, cardRadius: 14, imageRatio: 'original',
    columns: 2, useDesktopCatalog: false,
    sections: ['hero', 'services', 'categories', 'sale', 'promotional', 'trending', 'newArrivals', 'ethnicSets', 'accessories']
      .map((id, index) => ({ id, visible: true, order: index * 10, heading: '' })),
  },
  tablet: { enabled: false, columns: 3, gridGap: 16 },
  theme: { preset: 'default', enhancedStyles: false },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeKnown(base, incoming) {
  if (Array.isArray(base)) return Array.isArray(incoming) ? clone(incoming) : clone(base);
  if (!base || typeof base !== 'object') {
    if (typeof base === 'boolean') return typeof incoming === 'boolean' ? incoming : base;
    if (typeof base === 'number') return typeof incoming === 'number' && Number.isFinite(incoming) ? incoming : base;
    return typeof incoming === 'string' ? incoming.slice(0, 5000) : base;
  }
  const source = incoming && typeof incoming === 'object' && !Array.isArray(incoming) ? incoming : {};
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, mergeKnown(value, source[key])]));
}

export function mergeWebsiteConfig(config = {}) {
  const sourceVersion = Number(config?.schemaVersion || 0);
  const merged = mergeKnown(DEFAULT_WEBSITE_CONFIG, config);
  // Version 2 makes the desktop header sticky by default. Migrate published
  // version-1 themes in memory so the improvement takes effect immediately;
  // after an admin saves the v2 theme, the switch remains configurable.
  if (sourceVersion < 2) merged.header.sticky = true;
  merged.schemaVersion = 2;
  const incoming = new Map((Array.isArray(config?.homepage?.sections) ? config.homepage.sections : []).filter(Boolean).map((section) => [section.id, section]));
  merged.homepage.sections = HOME_SECTION_DEFAULTS.map((section) => mergeKnown(section, incoming.get(section.id)))
    .sort((a, b) => Number(a.order) - Number(b.order));
  const mobileSections = new Map((Array.isArray(config?.mobile?.sections) ? config.mobile.sections : []).filter(Boolean).map((section) => [section.id, section]));
  merged.mobile.sections = DEFAULT_WEBSITE_CONFIG.mobile.sections.map((section) => mergeKnown(section, mobileSections.get(section.id))).sort((a, b) => a.order - b.order);
  return merged;
}

export function getHomepageSection(config, id) {
  // Section rendering must not normalize/copy the entire theme for every title,
  // button and wrapper. Keep the same default/type handling for partial configs.
  const fallback = HOME_SECTION_DEFAULTS.find((section) => section.id === id);
  if (!fallback) return undefined;
  const sections = Array.isArray(config?.homepage?.sections) ? config.homepage.sections : [];
  // The last occurrence wins, matching mergeWebsiteConfig's Map semantics.
  const incoming = sections.reduce((match, section) => section?.id === id ? section : match, undefined);
  return mergeKnown(fallback, incoming);
}

const fontStacks = {
  'Playfair Display': '"Playfair Display", Georgia, serif',
  Inter: 'Inter, "Segoe UI", Arial, sans-serif',
  Figtree: 'Figtree, Inter, Arial, sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  Arial: 'Arial, sans-serif',
};

export function buildWebsiteCssVariables(input) {
  const config = mergeWebsiteConfig(input);
  const shadows = { none: 'none', soft: '0 8px 24px rgba(22, 14, 17, .08)', elevated: '0 16px 36px rgba(22, 14, 17, .16)' };
  const buttonSizes = { small: ['36px', '12px'], medium: ['44px', '18px'], large: ['52px', '24px'] };
  const [buttonHeight, buttonPadding] = buttonSizes[config.buttons.size] || buttonSizes.medium;
  return {
    '--site-primary': config.colors.primary,
    '--site-secondary': config.colors.secondary,
    '--site-accent': config.colors.accent,
    '--site-background': config.colors.background,
    '--site-surface': config.colors.surface,
    '--site-text': config.colors.text,
    '--site-muted': config.colors.mutedText,
    '--site-header-background': config.header.background,
    '--site-header-text': config.header.textColor,
    '--site-heading-font': fontStacks[config.typography.headingFont] || fontStacks['Playfair Display'],
    '--site-body-font': fontStacks[config.typography.bodyFont] || fontStacks.Inter,
    '--site-button-font': fontStacks[config.typography.buttonFont] || fontStacks.Inter,
    '--site-heading-scale': config.typography.headingScale,
    '--designer-heading-scale': config.theme.enhancedStyles ? config.typography.headingScale : 1,
    '--designer-body-scale': config.theme.enhancedStyles ? config.typography.bodyScale : 1,
    '--site-body-scale': config.typography.bodyScale,
    '--site-heading-weight': config.typography.headingWeight,
    '--site-body-weight': config.typography.bodyWeight,
    '--site-button-weight': config.typography.buttonWeight,
    '--site-button-bg': config.buttons.background,
    '--site-button-text': config.buttons.textColor,
    '--site-button-radius': `${config.buttons.borderRadius}px`,
    '--site-button-height': buttonHeight,
    '--site-button-padding': buttonPadding,
    '--site-content-max': `${config.layout.maxWidth}px`,
    '--site-section-spacing': `${config.layout.sectionSpacing}px`,
    '--site-grid-gap': `${config.layout.gridGap}px`,
    '--designer-grid-gap': config.theme.enhancedStyles ? `${config.layout.gridGap}px` : undefined,
    '--site-card-radius': `${config.productCards.borderRadius}px`,
    '--site-card-ratio': config.productCards.imageRatio,
    '--site-card-shadow': shadows[config.productCards.shadow] || shadows.soft,
    '--site-products-desktop': config.layout.productsPerRow.desktop,
    '--site-products-tablet': config.layout.productsPerRow.tablet,
    '--site-products-mobile': config.layout.productsPerRow.mobile,
    '--site-mobile-bg': config.mobile.pageBackground,
    '--site-mobile-header-bg': config.mobile.headerBackground,
    '--site-mobile-header-text': config.mobile.headerText,
    '--site-mobile-gap': `${config.mobile.gridGap}px`,
    '--site-mobile-radius': `${config.mobile.cardRadius}px`,
    '--site-mobile-ratio': config.mobile.imageRatio === 'original' ? undefined : config.mobile.imageRatio,
    '--site-mobile-columns': config.mobile.columns,
    '--site-tablet-columns': config.tablet.columns,
    '--site-tablet-gap': `${config.tablet.gridGap}px`,
  };
}
