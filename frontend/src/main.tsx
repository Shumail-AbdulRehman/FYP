import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App, { GuestRoute, ProtectedRoute } from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store.ts';

import DashboardLayout from './components/layout/DashboardLayout.tsx';
import SignUp from './pages/Signup/SignUpPage.tsx';
import Login from './pages/Login/LoginPage.tsx';
import LocationsPage from './pages/Location/LocationsPage.tsx';
import LocationDetailPage from './pages/Location/LocationDetailPage.tsx';
import DashboardPage from './pages/Dashboard/DashboardPage.tsx';
import StaffPage from './pages/Staff/StaffPage.tsx';
import AttendancePage from './pages/Attendance/AttendancePage.tsx';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'signup',
        element: (
          <GuestRoute>
            <SignUp />
          </GuestRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'locations', element: <LocationsPage /> },
          { path: 'locations/:id', element: <LocationDetailPage /> },
          { path: 'staff', element: <StaffPage /> },
          { path: 'attendance', element: <AttendancePage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
