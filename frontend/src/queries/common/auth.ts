
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { signUp,login } from '@/api/common/auth';




export const useCreateManager = () => {
  
return useMutation({
    mutationFn: signUp
})
};

export const useLogin =()=> {

    return useMutation({
        mutationFn:login
    })
}