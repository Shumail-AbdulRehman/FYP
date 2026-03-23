import { client } from '../client';
import type { SignUpForm, LoginForm } from '@/types/forms';
import type { AuthUser, UserRole } from '@/types/auth';



export const signUp = async (data: SignUpForm): Promise<AuthUser> => {
  const res = await client.post('/manager/manager-signup', data, { withCredentials: true });
  return res.data.data;
};

export const login = async (data: LoginForm): Promise<AuthUser> => {
  const { role, ...payload } = data;
  const url = role === 'Manager' ? '/manager/manager-login' : '/staff/staff-login';
  const res = await client.post(url, payload, { withCredentials: true });
  return res.data.data;
};


export const refreshToken = async () => {
  
  const res= await client.post("/common/refresh-token");
  return res.data;

};



export const logoutApi = async () => {
  
  const res=await client.post("/common/logout", {}, { withCredentials: true });
  return res.data;
};


export const getCurrentUser=async ()=>
{
  const res=await client.get("/common/get-current-user");
  return res;
}