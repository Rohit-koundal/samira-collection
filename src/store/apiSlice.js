import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiBaseUrl } from './apiBaseUrl';
import { compressImageFile, isSupportedImageFile } from '../services/imageCompression';
import { logout, setCredentials } from './authSlice';
import { startMobileLoader, stopMobileLoader } from '../utils/mobileLoader';
import { getOrCreateSessionId } from '../utils/attribution';
import { isWebsitePreview } from '../config/websiteDesigner';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState, arg }) => {
    if (isWebsitePreview()) return headers;
    const token = getState().auth.token || localStorage.getItem('samira_token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    try {
      const sessionId = getOrCreateSessionId();
      if (sessionId) headers.set('x-session-id', sessionId);
    } catch {
      // ignore
    }
    try {
      const queryScope = new URLSearchParams(String(typeof arg === 'string' ? arg : arg?.url || '').split('?')[1] || '');
      const hasParamScope = arg?.params && Object.prototype.hasOwnProperty.call(arg.params, 'store');
      const hasStoreScope = hasParamScope || queryScope.has('store');
      const storeSlug = hasParamScope ? arg.params.store : queryScope.has('store') ? queryScope.get('store') : sessionStorage.getItem('samira_store_slug');
      if (storeSlug) headers.set('x-store-slug', storeSlug);
      else if (hasStoreScope) headers.delete('x-store-slug');
    } catch {
      // ignore
    }
    return headers;
  },
});

function requestUrl(args) {
  if (typeof args === 'string') return args;
  return String(args?.url || args?.path || '');
}

function isCredentialAuthRequest(args) {
  return /\/(?:auth\/(?:register|send-otp|resend-otp|verify-otp|refresh)|admin\/login)\b/.test(requestUrl(args));
}

// Every protected request can expire together when a saved tab is reopened.
// Share refresh work for that session so a slower failure cannot erase a login
// that another request has already restored.
const sessionRefreshes = new WeakMap();

function sessionCredentials(api) {
  return {
    userId: String(api.getState().auth.user?._id || api.getState().auth.user?.id || ''),
    token: api.getState().auth.token || localStorage.getItem('samira_token') || '',
    refreshToken: api.getState().auth.refreshToken || localStorage.getItem('samira_refresh_token') || '',
  };
}

function sameSession(left, right) {
  return left.userId === right.userId && left.token === right.token && left.refreshToken === right.refreshToken;
}

async function baseQueryWithRefresh(args, api, extraOptions) {
  const silent = typeof args === 'object' && args.silent;
  if (typeof args === 'object') { const { silent: _silent, ...requestArgs } = args; args = requestArgs; }
  if (isWebsitePreview()) {
    const method = typeof args === 'string' ? 'GET' : (args.method || 'GET').toUpperCase();
    if (method !== 'GET') return { error: { status: 403, data: { message: 'Storefront preview is read-only.' } } };
    return rawBaseQuery(args, api, extraOptions);
  }
  if (!silent) startMobileLoader();
  try {
    const requestedSession = sessionCredentials(api);
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401 && !isCredentialAuthRequest(args)) {
      const currentSession = sessionCredentials(api);
      if (!sameSession(requestedSession, currentSession)) {
        // A concurrent refresh, mode switch or sign-in already replaced the
        // token. Never use this old response to invalidate the new session.
        return currentSession.token && currentSession.userId === requestedSession.userId
          ? rawBaseQuery(args, api, extraOptions)
          : { error: { status: 409, data: { message: 'Your session changed. Please try again.' } } };
      }
      if (currentSession.refreshToken) {
        let pending = sessionRefreshes.get(api.dispatch);
        if (!pending || !sameSession(pending.session, currentSession)) {
          pending = { session: currentSession };
          pending.promise = (async () => {
            const refreshed = await rawBaseQuery({
              url: '/auth/refresh',
              method: 'POST',
              body: { refreshToken: currentSession.refreshToken },
            }, api, extraOptions);
            if (!sameSession(currentSession, sessionCredentials(api))) return { stale: true };
            if (refreshed.data?.token && refreshed.data?.user) {
              api.dispatch(setCredentials(refreshed.data));
              window.dispatchEvent(new CustomEvent('samira:session-refreshed', { detail: refreshed.data.user }));
            } else if ([401, 403].includes(refreshed.error?.status)) {
              api.dispatch(logout());
              window.dispatchEvent(new Event('samira:session-expired'));
            }
            return refreshed;
          })();
          sessionRefreshes.set(api.dispatch, pending);
        }
        const refreshResult = await pending.promise;
        if (sessionRefreshes.get(api.dispatch) === pending) sessionRefreshes.delete(api.dispatch);
        if (refreshResult.data?.token && refreshResult.data?.user) {
          if (sessionCredentials(api).token === refreshResult.data.token) result = await rawBaseQuery(args, api, extraOptions);
          else result = { error: { status: 409, data: { message: 'Your session changed. Please try again.' } } };
        } else if (refreshResult.error) {
          // A network outage or unavailable database is recoverable. Return
          // that error instead of the initial 401 so profile loading can retry
          // without deleting the saved account and shopping data.
          result = refreshResult;
        } else if (!refreshResult.stale) {
          result = { error: { status: 503, data: { message: 'Unable to restore your session. Please try again.' } } };
        } else {
          result = { error: { status: 409, data: { message: 'Your session changed. Please try again.' } } };
        }
      } else if (requestedSession.token) {
        api.dispatch(logout());
        window.dispatchEvent(new Event('samira:session-expired'));
      }
    }

    return result;
  } finally {
    if (!silent) stopMobileLoader();
  }
}

function params(query) {
  return query && Object.keys(query).length ? { params: query } : undefined;
}

export const samiraApi = createApi({
  reducerPath: 'samiraApi',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Auth', 'Products', 'Categories', 'Banners', 'Settings', 'Cart', 'Wishlist', 'Addresses', 'Coupons', 'Orders', 'Payments', 'Returns', 'Reviews', 'AdminDashboard', 'AdminProducts', 'AdminCategories', 'AdminOrders', 'AdminCustomers', 'AdminSettings', 'ProductDrafts', 'VariantGroups', 'Inventory', 'Contact', 'Newsletter', 'Notifications', 'WebsiteCustomization', 'ReelImports'],
  keepUnusedDataFor: 120,
  endpoints: (builder) => ({
    request: builder.query({
      query: ({ path, query, silent }) => ({ url: path, ...params(query), silent }),
      providesTags: (_result, _error, arg) => tagsForPath(arg.path),
    }),
    mutate: builder.mutation({
      query: ({ path, method = 'POST', body }) => ({ url: path, method, body }),
      invalidatesTags: (_result, _error, arg) => tagsForPath(arg.path, true),
    }),
    upload: builder.mutation({
      query: ({ path, files, fieldName = 'images' }) => {
        const formData = new FormData();
        Array.from(files || []).forEach((file) => formData.append(fieldName, file));
        return { url: path, method: 'POST', body: formData };
      },
      invalidatesTags: ['AdminProducts', 'Products'],
    }),
    sendOtp: builder.mutation({ query: (body) => ({ url: '/auth/send-otp', method: 'POST', body }) }),
    resendOtp: builder.mutation({ query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }) }),
    verifyOtp: builder.mutation({ query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }), invalidatesTags: ['Auth'] }),
    getCurrentUser: builder.query({ query: () => '/auth/me', providesTags: ['Auth'] }),
    switchMode: builder.mutation({ query: (body) => ({ url: '/auth/switch-mode', method: 'POST', body }), invalidatesTags: ['Auth', 'AdminDashboard'] }),
    getProducts: builder.query({ query: (query) => ({ url: '/products', ...params(query) }), providesTags: ['Products'] }),
    getProduct: builder.query({ query: (value) => typeof value === 'object' ? { url: `/products/${encodeURIComponent(value.id)}`, params: { store: value.store || '' } } : `/products/${encodeURIComponent(value)}`, providesTags: ['Products'] }),
    getCategories: builder.query({ query: (query) => ({ url: '/categories', ...params(query) }), providesTags: ['Categories'] }),
    getBanners: builder.query({ query: (query) => ({ url: '/banners', ...params(query) }), providesTags: ['Banners'] }),
    getSettings: builder.query({ query: () => '/settings', providesTags: ['Settings'] }),
    getCart: builder.query({ query: () => '/cart', providesTags: ['Cart'] }),
    getWishlist: builder.query({ query: () => '/wishlist', providesTags: ['Wishlist'] }),
    getAddresses: builder.query({ query: () => '/user/addresses', providesTags: ['Addresses'] }),
    getCoupons: builder.query({ query: () => '/coupons', providesTags: ['Coupons'] }),
    getOrders: builder.query({ query: () => '/orders/my-orders', providesTags: ['Orders'] }),
    getReviews: builder.query({ query: (productId) => `/reviews/${productId}`, providesTags: ['Reviews'] }),
    getFeaturedReviews: builder.query({ query: (query) => ({ url: '/reviews/featured', ...params(query) }), providesTags: ['Reviews'] }),
    getAdminStats: builder.query({ query: () => '/admin/dashboard/stats', providesTags: ['AdminDashboard'] }),
    getAdminProducts: builder.query({ query: () => '/admin/products', providesTags: ['AdminProducts'] }),
    getAdminCategories: builder.query({ query: () => '/admin/categories', providesTags: ['AdminCategories'] }),
    getAdminOrders: builder.query({ query: () => '/admin/orders', providesTags: ['AdminOrders'] }),
    getAdminCustomers: builder.query({ query: () => '/admin/customers', providesTags: ['AdminCustomers'] }),
    getAdminSettings: builder.query({ query: () => '/admin/settings', providesTags: ['AdminSettings'] }),
    getAdminLowStock: builder.query({ query: () => '/admin/dashboard/low-stock', providesTags: ['Inventory'] }),
    getProductDrafts: builder.query({ query: () => '/admin/product-drafts', providesTags: ['ProductDrafts'] }),
    getVariantGroups: builder.query({ query: () => '/variant-groups', providesTags: ['VariantGroups'] }),
    getVariantGroup: builder.query({ query: (id) => `/variant-groups/${id}`, providesTags: ['VariantGroups'] }),
    bulkUploadProductDrafts: builder.mutation({
      async queryFn({ files }, api, extraOptions, baseQuery) {
        const preparedFiles = [];
        for (const file of Array.from(files || [])) {
          if (!file) continue;
          if (file.__compressionMeta) {
            preparedFiles.push(file);
            continue;
          }
          if (!isSupportedImageFile(file)) {
            return { error: { status: 400, data: { message: 'Only JPG, JPEG, PNG, and WEBP images are allowed.' } } };
          }
          preparedFiles.push(await compressImageFile(file, {
            maxOriginalSizeMb: 2,
            targetMaxSizeMb: 0.7,
            maxWidthOrHeight: 1600,
          }));
        }
        const formData = new FormData();
        preparedFiles.forEach((file) => formData.append('images', file));
        const result = await baseQuery({ url: '/admin/product-drafts/bulk-upload', method: 'POST', body: formData }, api, extraOptions);
        if (result.error) return { error: result.error };
        return { data: result.data };
      },
      invalidatesTags: ['ProductDrafts'],
    }),
    updateProductDraft: builder.mutation({
      query: ({ id, body }) => ({ url: `/admin/product-drafts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ProductDrafts'],
    }),
    deleteProductDraft: builder.mutation({
      query: (id) => ({ url: `/admin/product-drafts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ProductDrafts'],
    }),
    publishSelectedDrafts: builder.mutation({
      query: (body) => ({ url: '/admin/product-drafts/publish-selected', method: 'POST', body }),
      invalidatesTags: ['ProductDrafts', 'Products', 'AdminProducts', 'AdminDashboard', 'Inventory'],
    }),
    createVariantGroup: builder.mutation({
      query: (body) => ({ url: '/admin/variant-groups', method: 'POST', body }),
      invalidatesTags: ['VariantGroups', 'Products', 'AdminProducts'],
    }),
    updateVariantGroup: builder.mutation({
      query: ({ id, body }) => ({ url: `/admin/variant-groups/${id}`, method: 'PUT', body }),
      invalidatesTags: ['VariantGroups', 'Products', 'AdminProducts'],
    }),
    deleteVariantGroup: builder.mutation({
      query: (id) => ({ url: `/admin/variant-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['VariantGroups', 'Products', 'AdminProducts'],
    }),
    addVariantGroupProducts: builder.mutation({
      query: ({ id, body }) => ({ url: `/admin/variant-groups/${id}/add-products`, method: 'POST', body }),
      invalidatesTags: ['VariantGroups', 'Products', 'AdminProducts'],
    }),
    removeVariantGroupProducts: builder.mutation({
      query: ({ id, body }) => ({ url: `/admin/variant-groups/${id}/remove-products`, method: 'POST', body }),
      invalidatesTags: ['VariantGroups', 'Products', 'AdminProducts'],
    }),
  }),
});

function tagsForPath(path = '', mutation = false) {
  if (path.includes('/admin/social-imports')) return mutation && path.endsWith('/draft') ? ['ProductDrafts'] : [];
  if (path.includes('/admin/reel-imports')) return ['ReelImports'];
  if (path.includes('/admin/customization') || path.includes('/website-config')) return ['WebsiteCustomization'];
  if (path.includes('/auth/')) return ['Auth'];
  if (path.includes('/admin/dashboard')) return ['AdminDashboard'];
  if (path.includes('/quick-analyze')) return [];
  if (path.includes('/admin/products')) return mutation ? ['AdminProducts', 'Products', 'AdminDashboard'] : ['AdminProducts'];
  if (path.includes('/admin/categories')) return mutation ? ['AdminCategories', 'Categories'] : ['AdminCategories'];
  if (path.includes('/admin/orders')) return mutation ? ['AdminOrders', 'Orders', 'AdminDashboard'] : ['AdminOrders'];
  if (path.includes('/admin/customers') || path.includes('/admin/users')) return ['AdminCustomers'];
  if (path.includes('/admin/settings')) return mutation ? ['AdminSettings', 'Settings'] : ['AdminSettings'];
  if (path.includes('/admin/product-drafts')) return mutation ? ['ProductDrafts', 'Products', 'AdminProducts', 'AdminDashboard'] : ['ProductDrafts'];
  if (path.includes('/admin/variant-groups') || path.includes('/variant-groups')) return mutation ? ['VariantGroups', 'Products', 'AdminProducts'] : ['VariantGroups'];
  if (path.includes('/admin/dashboard/low-stock') || path.includes('/admin/inventory/low-stock')) return ['Inventory', 'AdminDashboard'];
  if (path.includes('/products')) return ['Products'];
  if (path.includes('/categories')) return ['Categories'];
  if (path.includes('/banners')) return ['Banners'];
  if (path.includes('/settings')) return ['Settings'];
  if (path.includes('/cart')) return ['Cart'];
  if (path.includes('/wishlist')) return ['Wishlist'];
  if (path.includes('/user/addresses')) return ['Addresses'];
  if (path.includes('/coupons')) return ['Coupons'];
  if (path.includes('/orders')) return mutation ? ['Orders', 'Cart', 'Products', 'AdminDashboard'] : ['Orders'];
  if (path.includes('/payments')) return ['Payments', 'Orders'];
  if (path.includes('/reviews')) return ['Reviews'];
  if (path.includes('/returns')) return mutation ? ['Returns', 'Orders'] : ['Returns'];
  if (path.includes('/contact')) return mutation ? ['Contact'] : ['Contact'];
  if (path.includes('/newsletter')) return mutation ? ['Newsletter'] : ['Newsletter'];
  if (path.includes('/notifications')) return ['Notifications'];
  return [];
}

export const {
  useGetAdminCategoriesQuery,
  useGetAdminCustomersQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminSettingsQuery,
  useGetAdminLowStockQuery,
  useGetAdminStatsQuery,
  useGetAddressesQuery,
  useGetBannersQuery,
  useGetCartQuery,
  useGetCategoriesQuery,
  useGetCouponsQuery,
  useGetCurrentUserQuery,
  useGetOrdersQuery,
  useGetProductQuery,
  useGetProductDraftsQuery,
  useGetProductsQuery,
  useGetVariantGroupQuery,
  useGetVariantGroupsQuery,
  useGetReviewsQuery,
  useGetFeaturedReviewsQuery,
  useGetSettingsQuery,
  useGetWishlistQuery,
  useBulkUploadProductDraftsMutation,
  useCreateVariantGroupMutation,
  useDeleteProductDraftMutation,
  useDeleteVariantGroupMutation,
  usePublishSelectedDraftsMutation,
  useResendOtpMutation,
  useSendOtpMutation,
  useAddVariantGroupProductsMutation,
  useSwitchModeMutation,
  useRemoveVariantGroupProductsMutation,
  useUpdateProductDraftMutation,
  useUpdateVariantGroupMutation,
  useVerifyOtpMutation,
} = samiraApi;
