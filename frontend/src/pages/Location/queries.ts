import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { getLocations, createLocation } from './api';

export const useGetLocations=()=>
{
    return useQuery({
        queryKey:["getLocations"],
        queryFn:getLocations
    })
}

export const useCreateLocation=()=>
{
    const queryClient=useQueryClient();
    return useMutation({
        mutationFn:createLocation,
        onSuccess:()=>
        {
            queryClient.invalidateQueries({ queryKey: ["getLocations"] });
        }
    })
}