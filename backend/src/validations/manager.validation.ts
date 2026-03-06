import { z } from "zod";

// This is the Zod schema — it defines WHAT data is valid
// Think of it like Mongoose's schema validation, but for input data

export const managerSignupSchema = z.object({
    // name must be a string, at least 2 characters
    name: z
        .string({ message: "Name is required" })
        .min(2, "Name must be at least 2 characters"),

    // email must be a valid email format
    email: z
        .string({ message: "Email is required" })
        .email("Invalid email format"),

    // password must be at least 6 characters
    password: z
        .string({ message: "Password is required" })
        .min(6, "Password must be at least 6 characters"),

    // companyId must be a positive number
    companyId: z
        .number({ message: "Company ID is required" })
        .int("Company ID must be an integer")
        .positive("Company ID must be positive"),
});

// This extracts the TypeScript type FROM the Zod schema
// So you get both validation AND types from one definition
export type ManagerSignupInput = z.infer<typeof managerSignupSchema>;

// Usage example:
// const result = managerSignupSchema.safeParse(req.body);
// if (!result.success) → validation failed, result.error has details
// if (result.success) → result.data is typed as ManagerSignupInput
