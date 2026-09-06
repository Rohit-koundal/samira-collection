import { mergeWebsiteConfig, buildWebsiteCssVariables } from './websiteCustomization';
import { applyAppearancePreset, changedConfigGroups, exportThemeFile, parseThemeFile, validateDesignerConfig, websiteDataAttributes } from './websiteDesigner';

test('oversized or malformed imported selections are rejected before mounting expensive controls', () => {
  const oversized = mergeWebsiteConfig({ homepage: { featuredCategoryIds: Array.from({ length: 10000 }, (_, i) => String(i)) } });
  expect(() => parseThemeFile(exportThemeFile(oversized, 'Oversized'))).toThrow('at most 8');
  const malformed = mergeWebsiteConfig({ homepage: { categoryImages: [null] } });
  expect(() => parseThemeFile(exportThemeFile(malformed, 'Malformed'))).toThrow('Category image overrides');
  const products = mergeWebsiteConfig({ homepage: { sectionProductIds: { featured: [{}] } } });
  expect(() => parseThemeFile(exportThemeFile(products, 'Bad product'))).toThrow('valid product IDs');
});

test('legacy themes preserve mobile, tablet and existing desktop appearance', () => {
  const config = mergeWebsiteConfig({ schemaVersion: 2, header: { sticky: false } });
  expect(config.mobile.enabled).toBe(false);
  expect(config.tablet.enabled).toBe(false);
  expect(config.theme.enhancedStyles).toBe(false);
  expect(config.header.sticky).toBe(false);
  expect(websiteDataAttributes(config)['data-mobile-custom']).toBe(false);
  expect(validateDesignerConfig(config)).toEqual([]);
});

test('applying a preset changes appearance without replacing business content or handheld settings', () => {
  const original = mergeWebsiteConfig({
    branding: { websiteName: 'My store', logo: '/uploads/logo.png' },
    mobile: { enabled: true, columns: 1 },
    tablet: { enabled: true, columns: 4 },
    header: { announcementText: 'My announcement', sticky: false },
    footer: { contactEmail: 'support@example.com', menus: { shopping: [{ label: 'All', path: '/products' }] } },
    homepage: { sectionProductIds: { featured: ['product-1'] } },
  });
  const before = JSON.stringify(original);
  const result = applyAppearancePreset(original, { colors: { primary: '#31594c' }, theme: { preset: 'sage' } });
  for (const key of ['branding', 'mobile', 'tablet', 'homepage', 'layout']) expect(result[key]).toEqual(original[key]);
  expect(result.footer.contactEmail).toBe(original.footer.contactEmail);
  expect(result.footer.menus).toEqual(original.footer.menus);
  expect(result.header.announcementText).toBe('My announcement');
  expect(result.header.sticky).toBe(original.header.sticky);
  expect(result.colors.primary).toBe('#31594c');
  expect(JSON.stringify(original)).toBe(before);
});

test('mobile settings are separately merged and exported as device-specific variables', () => {
  const config = mergeWebsiteConfig({ mobile: { enabled: true, columns: 1, sections: [{ id: 'hero', visible: false, order: 0 }] } });
  expect(config.mobile.sections).toHaveLength(9);
  expect(config.mobile.sections.find((section) => section.id === 'hero').visible).toBe(false);
  expect(config.homepage.sections.find((section) => section.id === 'hero').visible).toBe(true);
  const vars = buildWebsiteCssVariables(config);
  expect(vars['--site-mobile-columns']).toBe(1);
  expect(vars['--site-products-desktop']).toBe(4);
});

test('export and import round trip without publishing or unknown keys', () => {
  const config = mergeWebsiteConfig({ colors: { primary: '#abcdef' } });
  expect(parseThemeFile(exportThemeFile(config, 'Export'))).toEqual(config);
  expect(() => parseThemeFile('{}')).toThrow('exported from Website Designer');
  expect(() => parseThemeFile('x'.repeat(512001))).toThrow('500 KB');
  const file = JSON.parse(exportThemeFile(config, 'Export'));
  file.config.unknown = { script: '<script>unsafe</script>' };
  expect(parseThemeFile(JSON.stringify(file)).unknown).toBeUndefined();
});

test('invalid colors, links, image schemes and unsafe layout values cannot be previewed or saved', () => {
  const config = mergeWebsiteConfig({
    colors: { primary: 'red' },
    footer: { menus: { shopping: [{ label: 'Bad', path: '/\\evil.test' }, { label: 12, path: '/products' }] }, socialLinks: { instagram: 'javascript:alert(1)' } },
    branding: { logo: 'data:image/svg+xml,unsafe' },
    mobile: { columns: 100 },
  });
  const issues = validateDesignerConfig(config);
  expect(issues.some((item) => item.includes('six-digit'))).toBe(true);
  expect(issues.some((item) => item.includes('internal path'))).toBe(true);
  expect(issues.some((item) => item.includes('Images'))).toBe(true);
  expect(issues.some((item) => item.includes('mobile.columns'))).toBe(true);
  expect(() => parseThemeFile(exportThemeFile(config, 'Bad'))).toThrow();
});

test('malformed section arrays and primitive values cannot crash normal default merging', () => {
  const config = mergeWebsiteConfig({ homepage: { sections: {} }, mobile: { sections: [null], enabled: 'true' }, colors: { primary: { invalid: true } } });
  expect(config.mobile.enabled).toBe(false);
  expect(config.homepage.sections).toHaveLength(14);
  expect(validateDesignerConfig(config)).toEqual([]);
  expect(changedConfigGroups(config, config)).toEqual([]);
});
