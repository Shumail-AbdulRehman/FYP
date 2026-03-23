import './App.css';
import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { useGetCurrentUser, useRefreshToken } from './queries/common/auth.js';
import { useDispatch } from 'react-redux';
import { setUser } from './store/slices/authSlice.js';
import type { AppDispatch } from '@/store/store';
import { useEffect, useRef } from 'react';
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
  const refreshTokenMutation = useRefreshToken();

  
  const refreshAttempted = useRef(false);

  useEffect(() => {
    
    if (getCurrentUserQuery.isSuccess && getCurrentUserQuery.data) {
      dispatch(setUser(getCurrentUserQuery.data.data.data));
      return;
    }

    
    if (
      getCurrentUserQuery.isError &&
      (getCurrentUserQuery.error as any)?.response?.status === 401 &&
      !refreshAttempted.current
    ) {
      refreshAttempted.current = true;
      refreshTokenMutation.mutate();
      return;
    }
  }, [getCurrentUserQuery.isSuccess, getCurrentUserQuery.isError]);
  

  useEffect(() => {
    
    if (refreshTokenMutation.isSuccess && refreshTokenMutation.data) {
      dispatch(setUser(refreshTokenMutation.data.data.data));
    }
  }, [refreshTokenMutation.isSuccess]);

  if (getCurrentUserQuery.isLoading || refreshTokenMutation.isPending) {
    return <LoadingSpinner fullScreen />;
  }

  return <Outlet />;
}

export default App;