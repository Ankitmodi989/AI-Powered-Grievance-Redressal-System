import axios from "axios";

const api = axios.create({
  // Ensure this matches your FastAPI backend URL (check port 8000 vs 8080)
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") { // Ensure we are on client-side
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;