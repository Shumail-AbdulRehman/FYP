import axios from 'axios';

export const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
  error.response?.status !== 401 || 
  error.response?.data?.message !== "Access Token Expired" || 
  originalRequest._retry 
) {
  return Promise.reject(error);
}

    originalRequest._retry = true;

    try {
      
      if (!isRefreshing) {
        isRefreshing = true;

        refreshPromise = (async () => {
          await client.post("/common/refresh-token");
        })();

        await refreshPromise;

        isRefreshing = false;
        refreshPromise = null;
      } else {
        
        await refreshPromise;
      }

      console.log("refresh token working i guess");
      return client(originalRequest);

    } catch (err) {
      window.location.href = "/login";
      return Promise.reject(err);
    }
  }
);

