import { z } from "zod";

export const managerSignupSchema = z.object({
    companyName: z
        .string({ message: "company name is required" })
    ,
    name: z
        .string({ message: "Name is required" })
        .min(2, "Name must be at least 2 characters"),


    email: z
        .string({ message: "Email is required" })
        .email("Invalid email format"),


    password: z
        .string({ message: "Password is required" })
        .min(6, "Password must be at least 6 characters"),



});

export type ManagerSignupInput = z.infer<typeof managerSignupSchema>;

export const managerLoginSchema = z.object({
    email: z
        .string({ message: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ message: "Password is required" })
        .min(1, "Password is required"),
});

export type ManagerLoginInput = z.infer<typeof managerLoginSchema>;

export const createStaffSchema = z.object({
    name: z
        .string({ message: "Name is required" })
        .min(2, "Name must be at least 2 characters"),
    email: z
        .string({ message: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ message: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
    locationId: z
        .number({ message: "Location ID must be a number" })
        .int("Location ID must be an integer")
        .positive("Location ID must be positive")
        .optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;


export const createLocationSchema = z.object({
    name: z
        .string({ message: "location name is required" }),
    address: z
        .string({ message: "location address is required" }),

})

export type createLocationInput = z.infer<typeof createLocationSchema>;

export const createTaskSchema = z.object({
    title: z.string({ message: "Title is required" }),
    description: z.string().optional(),
    locationId: z.number().int(),
    shiftStart: z.coerce.date(),
    shiftEnd: z.coerce.date(),
    recurringType: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  })
  .refine((data) => data.shiftEnd > data.shiftStart, {
    message: "Shift end must be after shift start",
    path: ["shiftEnd"],
  });

export type createTaskInput =z.infer<typeof createTaskSchema>;
