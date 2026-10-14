import axios from "axios";

export const TOKEN_KEY = "stylehub_access_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (error.response?.status === 401 && token) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("stylehub:session-expired"));
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(". ");
  }

  if (!error.response) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}

export default api;