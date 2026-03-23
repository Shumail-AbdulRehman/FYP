import {client} from "../client.js";
import type { SignUpForm,LoginForm } from "@/types/forms.js";




export const signUp= async(data: SignUpForm)=>
{
    const res= await client.post('/manager/manager-signup',data,{withCredentials:true});
    return res.data;
}


export const login = async (data: LoginForm) => {
  
  const { role, ...payload } = data; 

  if (role === "Manager") {
    const res = await client.post("/manager/manager-login", payload, { withCredentials: true });
    return res.data;
  } else {
    const res = await client.post("/staff/staff-login", payload, { withCredentials: true });
    return res.data;
  }
};