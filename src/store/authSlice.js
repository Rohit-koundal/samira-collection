import { createSlice } from '@reduxjs/toolkit';

function readUser() {
  try {
    const stored = localStorage.getItem('samira_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('samira_user');
    return null;
  }
}

const initialState = {
  user: readUser(),
  token: localStorage.getItem('samira_token') || null,
  refreshToken: localStorage.getItem('samira_refresh_token') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token, refreshToken } = action.payload || {};
      if (user) {
        state.user = user;
        localStorage.setItem('samira_user', JSON.stringify(user));
      }
      if (token) {
        state.token = token;
        localStorage.setItem('samira_token', token);
      }
      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('samira_refresh_token', refreshToken);
      }
    },
    setUser(state, action) {
      state.user = action.payload;
      if (action.payload) localStorage.setItem('samira_user', JSON.stringify(action.payload));
      else localStorage.removeItem('samira_user');
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      localStorage.removeItem('samira_user');
      localStorage.removeItem('samira_token');
      localStorage.removeItem('samira_refresh_token');
    },
  },
});

export const { logout, setCredentials, setUser } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export default authSlice.reducer;
