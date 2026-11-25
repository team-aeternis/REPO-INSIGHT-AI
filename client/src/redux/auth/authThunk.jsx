import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCurrentUser,
  googleLogin,
  login,
  logOut,
  signup,
} from "../../services/authService";

const getMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      return await signup(userData);
    } catch (error) {
      return rejectWithValue(getMessage(error, "Account creation failed."));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      return await login(credentials);
    } catch (error) {
      return rejectWithValue(getMessage(error, "Sign in failed."));
    }
  },
);

export const googleLoginUser = createAsyncThunk(
  "auth/googleLoginUser",
  async (credential, { rejectWithValue }) => {
    try {
      return await googleLogin(credential);
    } catch (error) {
      return rejectWithValue(getMessage(error, "Google sign in failed."));
    }
  },
);

export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentUser();
    } catch (error) {
      return rejectWithValue(getMessage(error, "No active session."));
    }
  },
);

export const logOutUser = createAsyncThunk(
  "auth/logOutUser",
  async (_, { rejectWithValue }) => {
    try {
      return await logOut();
    } catch (error) {
      return rejectWithValue(getMessage(error, "Sign out failed."));
    }
  },
);
