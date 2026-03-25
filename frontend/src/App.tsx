import './App.css';
import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { useGetCurrentUser } from './queries/auth.js';
import { useDispatch } from 'react-redux';
import { setUser } from './store/slices/authSlice.js';
import type { AppDispatch } from '@/store/store';
import { useEffect } from 'react';
import LoadingSpinner from './components/common/LoadingSpinner.js';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const getCurrentUserQuery = useGetCurrentUser();

  useEffect(() => {
    if (getCurrentUserQuery.isSuccess && getCurrentUserQuery.data) {
      dispatch(setUser(getCurrentUserQuery.data.data.data));
    }
  }, [getCurrentUserQuery.isSuccess]);

  if (getCurrentUserQuery.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return <Outlet />;
}

export default App;