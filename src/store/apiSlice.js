import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiBaseUrl } from './apiBaseUrl';
import { logout, setCredentials } from './authSlice';
import { startMobileLoader, stopMobileLoader } from '../utils/mobileLoader';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('samira_token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

async function baseQueryWithRefresh(args, api, extraOptions) {
  startMobileLoader();
  try {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
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
  tagTypes: ['Auth', 'Products', 'Categories', 'Banners', 'Settings', 'Cart', 'Wishlist', 'Addresses', 'Coupons', 'Orders', 'Payments', 'Reviews', 'Returns', 'AdminDashboard', 'AdminProducts', 'AdminCategories', 'AdminOrders', 'AdminCustomers', 'AdminSettings'],
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
      query: ({ path, files }) => {
        const formData = new FormData();
        Array.from(files || []).forEach((file) => formData.append('images', file));
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
    getAdminStats: builder.query({ query: () => '/admin/dashboard/stats', providesTags: ['AdminDashboard'] }),
    getAdminProducts: builder.query({ query: () => '/admin/products', providesTags: ['AdminProducts'] }),
    getAdminCategories: builder.query({ query: () => '/admin/categories', providesTags: ['AdminCategories'] }),
    getAdminOrders: builder.query({ query: () => '/admin/orders', providesTags: ['AdminOrders'] }),
    getAdminCustomers: builder.query({ query: () => '/admin/customers', providesTags: ['AdminCustomers'] }),
    getAdminSettings: builder.query({ query: () => '/admin/settings', providesTags: ['AdminSettings'] }),
  }),
});

function tagsForPath(path = '', mutation = false) {
  if (path.includes('/auth/')) return ['Auth'];
  if (path.includes('/admin/dashboard')) return ['AdminDashboard'];
  if (path.includes('/admin/products')) return mutation ? ['AdminProducts', 'Products', 'AdminDashboard'] : ['AdminProducts'];
  if (path.includes('/admin/categories')) return mutation ? ['AdminCategories', 'Categories'] : ['AdminCategories'];
  if (path.includes('/admin/orders')) return mutation ? ['AdminOrders', 'Orders', 'AdminDashboard'] : ['AdminOrders'];
  if (path.includes('/admin/customers') || path.includes('/admin/users')) return ['AdminCustomers'];
  if (path.includes('/admin/settings')) return mutation ? ['AdminSettings', 'Settings'] : ['AdminSettings'];
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
  return [];
}

export const {
  useGetAdminCategoriesQuery,
  useGetAdminCustomersQuery,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetAdminSettingsQuery,
  useGetAdminStatsQuery,
  useGetBannersQuery,
  useGetCartQuery,
  useGetCategoriesQuery,
  useGetCouponsQuery,
  useGetCurrentUserQuery,
  useGetOrdersQuery,
  useGetProductQuery,
  useGetProductsQuery,
  useGetReviewsQuery,
  useGetSettingsQuery,
  useGetWishlistQuery,
  useResendOtpMutation,
  useSendOtpMutation,
  useSwitchModeMutation,
  useVerifyOtpMutation,
} = samiraApi;
