import {client} from './client.js';
import type { SignUpForm } from '@/types/forms.js';




// Post Routes

export const signUp= async(data: SignUpForm)=>
{
    const res= await client.post('/manager/manager-signup',data,{withCredentials:true});
    return res.data;
}






// Get Routes

