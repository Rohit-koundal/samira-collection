import { createSelector, createSlice } from '@reduxjs/toolkit';

const sortOptions = ['newest', 'priceLowHigh', 'priceHighLow', 'discount', 'rating'];
export const clearableCatalogFilterKeys = ['search', 'category', 'size', 'color', 'fabric', 'occasion', 'discount', 'rating', 'stock', 'minPrice', 'maxPrice', 'featured', 'newArrival', 'bestSeller', 'trending'];

const initialState = {
  search: '',
  sort: 'newest',
  category: '',
  size: '',
  color: '',
  fabric: '',
  occasion: '',
  discount: '',
  rating: '',
  stock: '',
  minPrice: '',
  maxPrice: '',
  featured: '',
  newArrival: '',
  bestSeller: '',
  trending: '',
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    replaceCatalogFilters(_state, action) {
      return normalizeCatalogQuery(action.payload);
    },
  },
});

export const { replaceCatalogFilters } = catalogSlice.actions;
export default catalogSlice.reducer;

export const selectCatalogFilters = (state) => state.catalog;

export const selectVisibleProducts = createSelector(
  [
    selectCatalogFilters,
    (_state, products = []) => products,
    (_state, _products, categories = []) => categories,
  ],
  (filters, products, categories) => sortProducts(
    products.filter((product) => matchesFilters(product, filters, categories)),
    filters.sort,
  ),
);

export function normalizeCatalogQuery(query = {}) {
  const source = query instanceof URLSearchParams ? Object.fromEntries(query.entries()) : query;
  return {
    search: normalizeText(source.search),
    sort: normalizeSort(source.sort),
    category: normalizeText(source.category),
    size: normalizeText(source.size),
    color: normalizeText(source.color),
    fabric: normalizeText(source.fabric),
    occasion: normalizeText(source.occasion),
    discount: normalizeNumberValue(source.discount),
    rating: normalizeNumberValue(source.rating),
    stock: normalizeStock(source.stock),
    minPrice: normalizeNumberValue(source.minPrice),
    maxPrice: normalizeNumberValue(source.maxPrice),
    featured: normalizeToggle(source.featured),
    newArrival: normalizeToggle(source.newArrival),
    bestSeller: normalizeToggle(source.bestSeller),
    trending: normalizeToggle(source.trending),
  };
}

export function createCatalogSearchParams(filters = initialState) {
  const normalized = normalizeCatalogQuery(filters);
  const params = new URLSearchParams();

  Object.entries(normalized).forEach(([key, value]) => {
    if (!value || (key === 'sort' && value === initialState.sort)) return;
    params.set(key, value);
  });

  return params;
}

export function setCatalogFilterValue(filters, key, value) {
  return normalizeCatalogQuery({
    ...normalizeCatalogQuery(filters),
    [key]: value,
  });
}

export function clearCatalogFilters(filters) {
  const next = normalizeCatalogQuery(filters);
  clearableCatalogFilterKeys.forEach((key) => {
    next[key] = initialState[key];
  });
  return next;
}

function matchesFilters(product, filters, categories) {
  if (!matchesSearch(product, filters.search)) return false;
  if (!matchesCategory(product, filters.category, categories)) return false;
  if (!matchesArrayValue(product.sizes, filters.size)) return false;
  if (!matchesArrayValue(product.colors, filters.color)) return false;
  if (!matchesTextValue(product.fabric, filters.fabric)) return false;
  if (!matchesTextValue(product.occasion, filters.occasion)) return false;
  if (!matchesMinimumValue(product.discountPercentage, filters.discount)) return false;
  if (!matchesMinimumValue(product.rating, filters.rating)) return false;
  if (!matchesStock(product.stock, filters.stock)) return false;
  if (!matchesMinimumValue(product.price, filters.minPrice)) return false;
  if (!matchesMaximumValue(product.price, filters.maxPrice)) return false;
  if (filters.featured === 'true' && !product.isFeatured) return false;
  if (filters.newArrival === 'true' && !product.isNewArrival) return false;
  if (filters.bestSeller === 'true' && !product.isBestSeller) return false;
  if (filters.trending === 'true' && !product.showInTrending) return false;
  return true;
}

function matchesSearch(product, search) {
  if (!search) return true;
  const haystack = [
    product.name,
    product.brand,
    getSearchableText(product.category),
    product.fabric,
    product.occasion,
    product.sku,
    product.description,
    ...(product.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return String(search)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => getSearchTermVariants(term).some((variant) => haystack.includes(variant)));
}

function getSearchableText(value) {
  if (!value || typeof value !== 'object') return value;
  return [value.name, value.title, value.slug].filter(Boolean).join(' ');
}

function getSearchTermVariants(term) {
  if (term === 'accessory') return ['accessory', 'accessories'];
  if (term === 'accessories') return ['accessories', 'accessory'];
  return [term];
}

function matchesCategory(product, category, categories) {
  if (!category) return true;
  const productAliases = new Set([
    normalizeKey(product.categoryId),
    normalizeKey(product.category),
    normalizeKey(product.subCategory),
  ].filter(Boolean));

  return splitFilterValues(category).some((selected) => {
    const categoryAliases = resolveCategoryAliases(normalizeKey(selected), categories);
    return Array.from(categoryAliases).some((alias) => productAliases.has(alias));
  });
}

export function splitFilterValues(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toggleFilterValue(activeValue, value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) return normalizeText(activeValue);
  const selected = splitFilterValues(activeValue);
  const exists = selected.includes(nextValue);
  return (exists ? selected.filter((item) => item !== nextValue) : [...selected, nextValue]).join(',');
}

function resolveCategoryAliases(value, categories) {
  const aliases = new Set([value]);
  (categories || []).forEach((category) => {
    const categoryValues = [
      normalizeKey(category?._id),
      normalizeKey(category?.id),
      normalizeKey(category?.slug),
      normalizeKey(category?.name),
    ].filter(Boolean);

    if (categoryValues.includes(value)) {
      categoryValues.forEach((item) => aliases.add(item));
    }
  });
  return aliases;
}

function matchesArrayValue(values, activeValue) {
  if (!activeValue) return true;
  return (values || []).some((value) => normalizeKey(value) === normalizeKey(activeValue));
}

function matchesTextValue(value, activeValue) {
  if (!activeValue) return true;
  return normalizeKey(value) === normalizeKey(activeValue);
}

function matchesMinimumValue(value, minimum) {
  if (isEmptyValue(minimum)) return true;
  return Number(value || 0) >= Number(minimum);
}

function matchesMaximumValue(value, maximum) {
  if (isEmptyValue(maximum)) return true;
  return Number(value || 0) <= Number(maximum);
}

function matchesStock(stock, activeStock) {
  if (!activeStock) return true;
  return activeStock === 'in' ? Number(stock || 0) > 0 : Number(stock || 0) <= 0;
}

function sortProducts(products, sort) {
  const items = [...products];
  if (sort === 'priceLowHigh') return items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sort === 'priceHighLow') return items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (sort === 'discount') return items.sort((a, b) => Number(b.discountPercentage || 0) - Number(a.discountPercentage || 0));
  if (sort === 'rating') return items.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function normalizeSort(value) {
  if (isEmptyValue(value)) return '';
  return sortOptions.includes(value) ? value : initialState.sort;
}

function normalizeStock(value) {
  return value === 'in' || value === 'out' ? value : '';
}

function normalizeToggle(value) {
  return value === 'true' ? 'true' : '';
}

function normalizeText(value) {
  return isEmptyValue(value) ? '' : String(value).trim();
}

function normalizeNumberValue(value) {
  return isEmptyValue(value) ? '' : String(value).trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function isEmptyValue(value) {
  return value === undefined || value === null || value === '';
}
