import { useMutation, useQueryClient,useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { signUp, login, logoutApi,getCurrentUser, refreshToken } from '@/api/common/auth';
import { setUser, clearUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';



export const useCreateManager = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: signUp,
    onSuccess: (user) => {
      dispatch(setUser(user));
    },
  });
};

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      dispatch(setUser(user));
    },
  });
};

export const useLogout = () => {
  
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      dispatch(clearUser());
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
};

export const useGetCurrentUser = () => {

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useRefreshToken= ()=> {

  return useMutation({
    mutationFn: refreshToken,
    retry: false,
  });
}
