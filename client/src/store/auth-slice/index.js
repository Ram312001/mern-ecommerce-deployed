import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


const token = JSON.parse(sessionStorage.getItem("token"));

const initialState = {
  isAuthenticated: !!token,
  isLoading: false,
  user: null,
  token: token || null,
  error: null,
};

export const registerUser = createAsyncThunk("auth/registerUser", async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      formData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Registration failed.");
  }
});

export const loginUser = createAsyncThunk("auth/loginUser", async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/login`,
      formData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Login failed.");
  }
});

export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Logout failed.");
  }
});

export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, { rejectWithValue }) => {
  const token = JSON.parse(sessionStorage.getItem("token"));
  if (!token) {
    return rejectWithValue("No token found.");
  }
  try {
    const decodedToken = jwt_decode(token);
    if (decodedToken.exp * 1000 < Date.now()) {
      throw new Error("Token expired");
    }
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/check-auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Authentication failed.");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetTokenAndCredentials: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      sessionStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Registration failed.";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || null;
        state.isAuthenticated = action.payload.success;
        state.token = action.payload.token;
        state.error = null;
        sessionStorage.setItem("token", JSON.stringify(action.payload.token));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        state.error = action.payload || "Login failed.";
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || null;
        state.isAuthenticated = action.payload.success;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload || "Authentication failed.";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        sessionStorage.removeItem("token");
      });
  },
});

export const { resetTokenAndCredentials } = authSlice.actions;
export default authSlice.reducer;
