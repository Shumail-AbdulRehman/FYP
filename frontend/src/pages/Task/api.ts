import { client } from "@/api/client";

export interface EditTaskTemplateInput {
  title?: string;
  description?: string;
  shiftStart?: string;
  shiftEnd?: string;
  recurringType?: "DAILY" | "ONCE";
  effectiveDate?: string;
  locationId?: number;
}

export const editTaskTemplate = async (
  id: number,
  data: EditTaskTemplateInput
) => {
  const res = await client.patch(`/task-template/${id}`, data);
  return res.data;
};

export const deleteTaskTemplate = async (id: number) => {
  const res = await client.delete(`/task-template/${id}`);
  return res.data;
};
