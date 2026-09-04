import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiBaseUrl } from './apiBaseUrl';
import { compressImageFile, isSupportedImageFile } from '../services/imageCompression';
import { logout, setCredentials } from './authSlice';
import { startMobileLoader, stopMobileLoader } from '../utils/mobileLoader';
import { getOrCreateSessionId } from '../utils/attribution';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('samira_token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    try {
      const sessionId = getOrCreateSessionId();
      if (sessionId) headers.set('x-session-id', sessionId);
    } catch {
      // ignore
    }
    try {
      const storeSlug = sessionStorage.getItem('samira_store_slug');
      if (storeSlug) headers.set('x-store-slug', storeSlug);
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

async function baseQueryWithRefresh(args, api, extraOptions) {
  startMobileLoader();
  try {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401 && !isCredentialAuthRequest(args)) {
      const refreshToken = api.getState().auth.refreshToken || localStorage.getItem('samira_refresh_token');
      if (refreshToken) {
        const refreshResult = await rawBaseQuery({
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        }, api, extraOptions);

        if (refreshResult.data?.token && refreshResult.data?.user) {
          api.dispatch(setCredentials(refreshResult.data));
          window.dispatchEvent(new CustomEvent('samira:session-refreshed', { detail: refreshResult.data.user }));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
          window.dispatchEvent(new Event('samira:session-expired'));
        }
      } else {
        api.dispatch(logout());
        window.dispatchEvent(new Event('samira:session-expired'));
      }
    }

    return result;
  } finally {
    stopMobileLoader();
  }
}

function params(query) {
  return query && Object.keys(query).length ? { params: query } : undefined;
}

export const samiraApi = createApi({
  reducerPath: 'samiraApi',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Auth', 'Products', 'Categories', 'Banners', 'Settings', 'Cart', 'Wishlist', 'Addresses', 'Coupons', 'Orders', 'Payments', 'Reviews', 'Returns', 'AdminDashboard', 'AdminProducts', 'AdminCategories', 'AdminOrders', 'AdminCustomers', 'AdminSettings', 'ProductDrafts', 'VariantGroups', 'Inventory', 'Contact', 'Newsletter', 'Notifications', 'WebsiteCustomization'],
  keepUnusedDataFor: 120,
  endpoints: (builder) => ({
    request: builder.query({
      query: ({ path, query }) => ({ url: path, ...params(query) }),
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
    getProduct: builder.query({ query: (id) => `/products/${id}`, providesTags: ['Products'] }),
    getCategories: builder.query({ query: () => '/categories', providesTags: ['Categories'] }),
    getBanners: builder.query({ query: () => '/banners', providesTags: ['Banners'] }),
    getSettings: builder.query({ query: () => '/settings', providesTags: ['Settings'] }),
    getCart: builder.query({ query: () => '/cart', providesTags: ['Cart'] }),
    getWishlist: builder.query({ query: () => '/wishlist', providesTags: ['Wishlist'] }),
    getAddresses: builder.query({ query: () => '/user/addresses', providesTags: ['Addresses'] }),
    getCoupons: builder.query({ query: () => '/coupons', providesTags: ['Coupons'] }),
    getOrders: builder.query({ query: () => '/orders/my-orders', providesTags: ['Orders'] }),
    getReviews: builder.query({ query: (productId) => `/reviews/${productId}`, providesTags: ['Reviews'] }),
    getFeaturedReviews: builder.query({ query: () => '/reviews/featured', providesTags: ['Reviews'] }),
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
  if (path.includes('/returns')) return ['Returns'];
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
