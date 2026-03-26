import { client } from "@/api/client";

/** Assign a staff member to a location */
export const assignStaffToLocation = async (staffId: number, locationId: number) => {
  const res = await client.patch(`/assignment/staff/${staffId}/location/${locationId}`);
  return res.data;
};

/** Assign a staff member to a task template */
export const assignStaffToTaskTemplate = async (templateId: number, staffId: number) => {
  const res = await client.patch(`/assignment/task-template/${templateId}/staff/${staffId}`);
  return res.data;
};
