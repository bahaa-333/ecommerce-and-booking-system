import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
  withXSRFToken: true,
});

export async function ensureCsrfCookie() {
  await api.get("/sanctum/csrf-cookie");
}

export async function apiPost(path, data) {
  await ensureCsrfCookie();
  const response = await api.post(`/api/${path}`, data);
  return response.data;
}

export async function apiGet(path, { signal } = {}) {
  const response = await api.get(`/api/${path}`, { signal });
  return response.data;
}

export function extractFieldErrors(error) {
  return error?.response?.data?.errors ?? {};
}

export function extractErrorMessage(error) {
  return error?.response?.data?.message ?? "Something went wrong. Please try again.";
}

export default api;