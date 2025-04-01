import axios from "axios";

const server = process.env.REACT_APP_API_URL || "http://localhost:3004";

const api = axios.create({
  baseURL: server,
});

// Добавляем interceptor для автоматического подставления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
