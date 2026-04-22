import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env["VITE_API_URL"] ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — only redirect if user had a token (session expired)
// During login attempts there is no token, so let error propagate to the component
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const hasToken = !!localStorage.getItem("token");
      if (hasToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err as Error);
  }
);

export default api;
