import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signUp } from '@/api/common/auth';




export const useCreateManager = () => {
  
return useMutation({
    mutationFn: signUp,
    onSuccess:()=>
    {
        console.log("manager account created");
    },
    onError:(err:any)=>
    {
        
        const errorMessage = err.response?.data?.message || "Unknown error";
        console.log("Error while signUp for manager is::", errorMessage);
        
    }
})
  
};