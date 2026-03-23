

import { useForm } from 'react-hook-form';
import type {SignUpForm} from '../../types/forms'
import {useCreateManager} from '../../queries/manager.js'
import { useState } from 'react';

const SignUp= () => {
  const { register, handleSubmit, formState: { errors },reset } = useForm<SignUpForm>();


  const[err,setErr]=useState(null);

  const createManager=useCreateManager();

  const onSubmit= (data: SignUpForm) => {
    console.log(data); 
    createManager.mutate(data);

    if(!createManager.isError)  reset();

    if(createManager.isError) setErr(createManager.error.response?.data?.message);

   
   

  };


  // if(createManager.isPending)
  // {
  //   return <>Loading...</>
  // }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Name</label>
          <input 
            type="text" 
            {...register("name", { required: "Name is required" })}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Email</label>
          <input 
            type="email" 
            {...register("email", { 
              required: "Email is required", 
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } 
            })}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Password</label>
          <input 
            type="password" 
            {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Company Name</label>
          <input 
            type="text" 
            {...register("companyName", { required: "Company Name is required" })}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>}
        </div >
            {err &&(
              <div className="text-red-600 w-full h-auto">
                {err}
              </div>
            )}
        

        <button 
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;