import axios from 'axios';
// import { store } from '@/store/store';
// import { clearUser } from '@/store/slices/authSlice';
// import { refreshToken } from '@/api/common/auth';
// import type { UserRole } from '@/types/auth';

export const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// client.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // ── Not a 401 → pass through immediately ─────────────────────────────
//     if (error.response?.status !== 401) {
//       return Promise.reject(error);
//     } 

//     // ── Skip auth endpoints (login, signup, refresh) ──────────────────────
//     // These should never trigger a refresh attempt.
//     const authPaths = ['/login', '/signup', '/refresh-token', '/staff-login', '/manager-signup'];
//     if (authPaths.some((p) => originalRequest.url?.includes(p))) {
//       return Promise.reject(error);
//     }

//     const message: string = error.response?.data?.message ?? '';

//     // ── Case 1: No token present at all ──────────────────────────────────
//     // Backend message: "Unauthorized access"
//     // Cause: cookie was never set (user was never logged in this session).
//     // Action: do NOT refresh — just reject. ProtectedRoute will redirect.
//     if (message === 'Unauthorized access') {
//       store.dispatch(clearUser());
//       return Promise.reject(error);
//     }

//     // ── Case 2: User no longer exists in DB ──────────────────────────────
//     // Backend message: "Invalid access token"
//     // Cause: token decoded fine but the manager/staff row was deleted.
//     // Action: refreshing would also fail — log out immediately.
//     if (message === 'Invalid access token') {
//       store.dispatch(clearUser());
//       window.location.href = '/login';
//       return Promise.reject(error);
//     }

//     // ── Case 3: Token is expired (or tampered) ───────────────────────────
//     // Backend message: "Invalid or expired access token"
//     // This is the only case where a refresh attempt makes sense.
//     if (message !== 'Invalid or expired access token') {
//       // Unknown 401 — don't attempt refresh, just reject.
//       return Promise.reject(error);
//     }

//     const role = store.getState().auth.user?.role as UserRole | undefined;

//     if (!role) {
//       store.dispatch(clearUser());
//       return Promise.reject(error);
//     }

//     try {
//       const refreshed = await refreshToken(role);
//       if (refreshed) {
//         // New cookie is set — retry the original request once
//         return client(originalRequest);
//       } else {
//         // Refresh token also expired — full logout
//         store.dispatch(clearUser());
//         window.location.href = '/login';
//         return Promise.reject(error);
//       }
//     } catch {
//       store.dispatch(clearUser());
//       window.location.href = '/login';
//       return Promise.reject(error);
//     }
//   }
// );