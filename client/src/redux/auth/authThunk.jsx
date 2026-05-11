import { createAsyncThunk } from "@reduxjs/toolkit";
import { login, signup } from "../../services/authService";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await signup(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await login(loginData);
      
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch user");
    }
  },
);

export const logOutUser = createAsyncThunk(
  "auth/logOutUser",
  async (_, { rejectWithValue }) => {
    try {
      await logOut();
      return true;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "Failed to logout",
      );
    }
  },
);