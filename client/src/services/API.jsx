import axios from "axios";

const configuredServerUrl = import.meta.env.VITE_SERVER_URL;
const serverBaseUrl = (
  configuredServerUrl || (import.meta.env.DEV ? "http://localhost:8080" : "")
).replace(/\/+$/, "");

export const API = axios.create({
  baseURL: serverBaseUrl,
  withCredentials: true,
});

export default API;
