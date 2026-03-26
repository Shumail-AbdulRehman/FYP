import { client } from "@/api/client";

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  locationId?: number;
  shiftStart?: string;
  shiftEnd?: string;
}

export interface AssignShiftInput {
  shiftStart: string;
  shiftEnd: string;
}

export interface EditStaffInput {
  name?: string;
  email?: string;
  shiftStart?: string;
  shiftEnd?: string;
}

export const getStaff = async () => {
  const res = await client.get("/staff/");
  return res.data;
};

export const getStaffById = async (id: number) => {
  const res = await client.get(`/staff/${id}`);
  return res.data;
};

export const getStaffDetails = async (id: number) => {
  const res = await client.get(`/staff/details/${id}`);
  return res.data;
};

export const getStaffByLocation = async (locationId: number) => {
  const res = await client.get(`/staff/location/${locationId}`);
  return res.data;
};

export const createStaff = async (data: CreateStaffInput) => {
  const res = await client.post("/staff/create-staff", data);
  return res.data;
};

export const deactivateStaff = async (id: number) => {
  const res = await client.patch(`/staff/${id}/deactivate`);
  return res.data;
};

export const assignShift = async (id: number, data: AssignShiftInput) => {
  const res = await client.patch(`/attendance/staff/${id}/shift`, data);
  return res.data;
};

export const assignStaffToLocation = async (
  staffId: number,
  locationId: number
) => {
  const res = await client.patch(
    `/assignment/staff/${staffId}/location/${locationId}`
  );
  return res.data;
};

export const editStaff = async (id: number, data: EditStaffInput) => {
  const res = await client.patch(`/staff/${id}`, data);
  return res.data;
};
