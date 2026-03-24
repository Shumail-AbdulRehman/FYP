export type CreateLocationInput = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};



export type AssignShiftInput = {
  shiftStart: Date;
  shiftEnd: Date;
};



export type LocationWithCounts = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  status: string; 
  _count: {
    staff: number;
    taskTemplates: number;
  };
};