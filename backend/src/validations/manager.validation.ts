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

export const createStaffSchema = z
  .object({
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
   
    shiftStart: z.coerce.date({ message: "Shift start must be a valid date" }).optional(),
    shiftEnd: z.coerce.date({ message: "Shift end must be a valid date" }).optional(),
  })
  .superRefine((data, ctx) => {
    const hasStart = data.shiftStart !== undefined;
    const hasEnd = data.shiftEnd !== undefined;

    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both shiftStart and shiftEnd must be provided together",
        path: hasStart ? ["shiftEnd"] : ["shiftStart"],
      });
      return;
    }

    if (hasStart && hasEnd) {
      const startMin = data.shiftStart!.getHours() * 60 + data.shiftStart!.getMinutes();
      const endMin = data.shiftEnd!.getHours() * 60 + data.shiftEnd!.getMinutes();
      if (startMin === endMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift start and end cannot be the same time",
          path: ["shiftEnd"],
        });
      }
    }
  });

export type CreateStaffInput = z.infer<typeof createStaffSchema>;


export const createLocationSchema = z.object({
  name: z
    .string({ message: "location name is required" }),
  address: z
    .string({ message: "location address is required" }),
  latitude: z.number({ message: "latitude is required" }),
  longitude: z.number({ message: "longitude is required" })

})

export type createLocationInput = z.infer<typeof createLocationSchema>;


const taskBaseSchema = z.object({
  title: z.string({ message: "Title is required" }),
  description: z.string().optional(),
  locationId: z.number({ message: "Location is required" }).int(),
  shiftStart: z.coerce.date({ message: "Shift start is required" }),
  shiftEnd: z.coerce.date({ message: "Shift end is required" }),
  recurringType: z.enum(["DAILY", "ONCE"]).optional(),
  effectiveDate: z.coerce.date({ message: "Effective date is required" }),
  recurringEndDate: z.coerce.date().optional(),
});

export const createTaskSchema = taskBaseSchema.superRefine((data, ctx) => {
  const now = new Date();
  const threeMinutesLater = new Date(now.getTime() + 3 * 60 * 1000);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (data.shiftEnd <= data.shiftStart) {
    ctx.addIssue({
      code: "custom",
      message: "Shift end must be after shift start",
      path: ["shiftEnd"],
    });
  }

  if (data.effectiveDate < todayStart) {
    ctx.addIssue({
      code: "custom",
      message: "Effective date cannot be in the past",
      path: ["effectiveDate"],
    });
  }

  if (data.shiftStart < threeMinutesLater) {
    ctx.addIssue({
      code: "custom",
      message: "Shift start must be at least 3 minutes from now",
      path: ["shiftStart"],
    });
  }
});



export const editTaskSchema = taskBaseSchema.partial().superRefine((data, ctx) => {

  if (data.shiftStart && data.shiftEnd) {
    if (data.shiftEnd <= data.shiftStart) {
      ctx.addIssue({
        code: "custom",
        message: "Shift end must be after shift start",
        path: ["shiftEnd"],
      });
    }
  }

});

// export const createTaskSchema = z
//   .object({
//     title: z.string({ message: "Title is required" }),
//     description: z.string().optional(),
//     locationId: z.number({ message: "Location is required" }).int(),
//     shiftStart: z.coerce.date({ message: "Shift start is required" }),
//     shiftEnd: z.coerce.date({ message: "Shift end is required" }),
//     recurringType: z.enum(["DAILY", "ONCE"]).optional(),
//     effectiveDate: z.coerce.date({ message: "Effective date is required" }),
//     recurringEndDate: z.coerce.date().optional(),
//   })
//   .superRefine((data, ctx) => {
//     const now = new Date();
//     const threeMinutesLater = new Date(now.getTime() + 3 * 60 * 1000);

//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     if (data.shiftStart && data.shiftEnd) {
//       if (data.shiftEnd <= data.shiftStart) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Shift end must be after shift start",
//           path: ["shiftEnd"],
//         });
//       }
//     }

//     if (data.effectiveDate) {
//       if (data.effectiveDate < todayStart) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Effective date cannot be in the past",
//           path: ["effectiveDate"],
//         });
//       }
//     }

//     if (data.shiftStart) {
//       if (data.shiftStart < threeMinutesLater) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Shift start must be at least 3 minutes from now",
//           path: ["shiftStart"],
//         });
//       }
//     }
//   });

// export type createTaskInput = z.infer<typeof createTaskSchema>;


// export const editTaskSchema = createTaskSchema.partial().superRefine((data, ctx) => {

//   if (data.shiftStart && data.shiftEnd) {
//     if (data.shiftEnd <= data.shiftStart) {
//       ctx.addIssue({
//         code: "custom",
//         message: "Shift end must be after shift start",
//         path: ["shiftEnd"],
//       });
//     }
//   } else if (data.shiftStart && !data.shiftEnd) {
//     ctx.addIssue({
//       code: "custom",
//       message: "shiftEnd is required if shiftStart is provided",
//       path: ["shiftEnd"],
//     });
//   } else if (!data.shiftStart && data.shiftEnd) {
//     ctx.addIssue({
//       code: "custom",
//       message: "shiftStart is required if shiftEnd is provided",
//       path: ["shiftStart"],
//     });
//   }

//   if (data.shiftStart) {
//     const now = new Date();
//     const threeMinutesLater = new Date(now.getTime() + 3 * 60 * 1000);
//     if (data.shiftStart < threeMinutesLater) {
//       ctx.addIssue({
//         code: "custom",
//         message: "Shift start must be at least 3 minutes from now",
//         path: ["shiftStart"],
//       });
//     }
//   }

//   if (data.effectiveDate) {
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);
//     if (data.effectiveDate < todayStart) {
//       ctx.addIssue({
//         code: "custom",
//         message: "Effective date cannot be in the past",
//         path: ["effectiveDate"],
//       });
//     }
//   }
// });