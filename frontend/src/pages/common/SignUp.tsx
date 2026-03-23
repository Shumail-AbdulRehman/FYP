import { useForm } from 'react-hook-form';
import type {SignUpForm} from '../../types/forms.js'
import {useCreateManager} from '../../queries/manager.js'
import { useState } from 'react';

import TextInput from '@/components/common/TextInput.js';
import FormButton from '@/components/common/FormButton.js';
import FormError from '@/components/common/FormError.js';



const SignUp= () => {

  const { register, handleSubmit, formState: { errors },reset } = useForm<SignUpForm>();
  const[err,setErr]=useState(null);
  const createManager=useCreateManager();


  const onSubmit = (data: SignUpForm) => {
  setErr(null); 

  createManager.mutate(data, {
    onSuccess: () => {
      reset(); 
    },
    onError: (error: any) => {
      setErr(error.response?.data?.message || "Something went wrong");
    }
  });
};

  return(

    <div className="flex items-center justify-center min-h-screen bg-gray-100">

     <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >

        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        <TextInput 
          label="Name" 
          register={register('name', { required: "Name is required" })} 
          error={errors.name?.message} 
        />

        <TextInput
          label='Email'
          register={register('email',{required: "Email is required"})}
          error={errors.name?.message}
        />

        <TextInput 
          label="Password" 
          type="password" 
          register={register('password', { required: "Password is required" })} 
          error={errors.password?.message} 
        />
    
      <TextInput 
        label="Company Name" 
        register={register('companyName', { required: "Company Name is required" })} 
        error={errors.companyName?.message} 
      />

      <FormError message={err} />

      <FormButton type="submit" text="Sign Up" loading={createManager.isPending} />

      </form>
    </div>
  )

};

export default SignUp;