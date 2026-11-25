import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUser,
  googleLoginUser,
  loginUser,
  logOutUser,
  registerUser,
} from "./authThunk";

const initialState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
};

const userFromPayload = (payload) => payload?.data?.user || payload?.user || null;

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    const addSignInCases = (thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.initialized = true;
          state.user = userFromPayload(action.payload);
          state.isAuthenticated = Boolean(state.user);
          state.error = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        });
    };

    addSignInCases(registerUser);
    addSignInCases(loginUser);
    addSignInCases(googleLoginUser);

    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = userFromPayload(action.payload);
        state.isAuthenticated = Boolean(state.user);
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logOutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logOutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logOutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
