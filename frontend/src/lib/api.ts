import axios from "axios";
import { removeToken } from "./auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const refreshClient = axios.create({
  baseURL,
});

export const api = axios.create({
  baseURL,
});

// Handles Auth Tokens
api.interceptors.request.use((config) => {
  // Inject Authorization Token
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handles Automated Token Refresh Validation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    if (requestUrl.includes("/login") || requestUrl.includes("/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("Missing refresh token");
        }

        const res = await refreshClient.post("/refresh", {
          refresh_token: refreshToken,
        });

        const newAccessToken = res.data.access_token;
        const newRefreshToken = res.data.refresh_token;

        localStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (err) {
        // logout if refresh fails
        removeToken();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);