import { useForm } from "react-hook-form";
import type{ SubmitHandler } from "react-hook-form";
import { useCreateLocation, useGetLocations } from "./queries";
import LocationCard from "./components/LocationCard";
import type { LocationWithCounts } from "./types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import FormDialog from "@/components/common/FormDialog";
import TextInput from "@/components/common/TextInput";
import FormButton from "@/components/common/FormButton";
import type{LocationFormValues} from "./types"

export default function LocationsPage() {
  const createLocation = useCreateLocation();
  const getLocations = useGetLocations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>();

  const onSubmit: SubmitHandler<LocationFormValues> = async (data) => {

    console.log(data);
    await createLocation.mutateAsync({
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    {   
      onSuccess:(data)=>{

        console.log(data.data);
        
      },
      onError: (error: any) => {
        console.log(error.response?.data?.message || "Something went wrong");
      }
    });


    
    reset(); 

    
  };

  if (createLocation.isPending || getLocations.isPending) {
    return <LoadingSpinner overlay />;
  }

  return (
    <div className="space-y-6">
     
      <FormDialog
        title="Create New Location"
        triggerText="Add Location"
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextInput
          label="Location Name"
          register={register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />
        <TextInput
          label="Address"
          register={register("address", { required: "Address is required" })}
          error={errors.address?.message}
        />
        <TextInput
          label="Latitude"
          type="number"
          register={register("latitude", { required: "Latitude is required" })}
          error={errors.latitude?.message}
        />
        <TextInput
          label="Longitude"
          type="number"
          register={register("longitude", { required: "Longitude is required" })}
          error={errors.longitude?.message}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <FormButton text="Cancel" type="button" onClick={() => reset()} />
          <FormButton text="Create" type="submit" loading={isSubmitting} />
        </div>
      </FormDialog>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getLocations.data.data && getLocations.data.data.length > 0 ? (
          getLocations.data.data.map((loc: LocationWithCounts) => (
            <LocationCard
              key={loc.id}
              name={loc.name}
              address={loc.address}
              staff={loc._count.staff}
              taskTemplate={loc._count.taskTemplates}
              lat={loc.latitude.toString()}
              lng={loc.longitude.toString()}
            />
          ))
        ) : (
          <p>No Location Found</p>
        )}
      </div>
    </div>
  );
}