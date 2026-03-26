import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStaff,
  createStaff,
  deactivateStaff,
  assignShift,
  type CreateStaffInput,
  type AssignShiftInput,
} from "./api";

export const useGetStaff = () => {
  return useQuery({
    queryKey: ["staff"],
    queryFn: getStaff,
  });
};

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) => createStaff(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};

export const useDeactivateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};

export const useAssignShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignShiftInput }) =>
      assignShift(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};
