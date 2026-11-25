import { API } from "./API";

export const signup = async (userData) => {
  const response = await API.post("/api/auth/signup", userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await API.post("/api/auth/login", credentials);
  return response.data;
};

export const googleLogin = async (credential) => {
  const response = await API.post("/api/auth/google", { credential });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get("/api/auth/me");
  return response.data;
};

export const logOut = async () => {
  const response = await API.post("/api/auth/logout");
  return response.data;
};

export const acceptTerms = async () => {
  const response = await API.post("/api/auth/accept-terms");
  return response.data;
};
