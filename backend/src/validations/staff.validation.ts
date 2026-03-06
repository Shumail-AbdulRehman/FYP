import {z} from "zod"

export const staffLoginSchema=z.object({
    email:z
        .email({message:"email is required"}),
    password:z
        .string({message:"password is required"})
});

export type staffLoginInput=z.infer< typeof staffLoginSchema>;