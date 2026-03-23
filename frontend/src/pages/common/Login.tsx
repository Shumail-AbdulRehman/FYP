import { useForm } from 'react-hook-form';
import type { LoginForm } from '@/types/forms';
import { useState } from 'react';

import FormButton from '@/components/common/FormButton';
import FormError from '@/components/common/FormError';
import TextInput from '@/components/common/TextInput';
import { useLogin } from '@/queries/common/auth';

const Login = () => {

    const { register, handleSubmit, reset,formState: { errors } } = useForm<LoginForm>();
    const[err,setErr]=useState(null);
    const login=useLogin();

    const onSubmit = (data: LoginForm) => {

    login.mutate(data,
        {
            onSuccess:()=>
            {
                console.log("logged in successfully");
                reset();
            },
            onError: (error: any) => {
                setErr(error.response?.data?.message || "Something went wrong");
            }
        }     
    );
    };

   return(

    <div className="flex items-center justify-center min-h-screen bg-gray-100">

     <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >

        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <TextInput
          label='Email'
          register={register('email',{required: "Email is required"})}
          error={errors.email?.message}
        />

        <TextInput 
          label="Password" 
          type="password" 
          register={register('password', { required: "Password is required" })} 
          error={errors.password?.message} 
        />
    
      <select {...register('role', { required: "Please select a role" })}>
        <option value="">Select role</option> 
        <option value="Manager">Manager</option>
        <option value="Staff">Staff</option>
      </select>
      {errors.role && <p className="text-red-500">{errors.role.message}</p>}

      <FormError message={err} />

      <FormButton type="submit" text="Login" loading={login.isPending} />

      </form>
    </div>
  )
};


export default Login;