import {client} from "../../api/client.js"
import type{ CreateLocationInput} from "./types.js";

export const getLocations=async()=>
{
    const res=await client.get("/location/");
    return res.data;
}

export const createLocation= async (data:CreateLocationInput)=>
{
    const res=await client.post("/location/",{data},{withCredentials:true});
    return res.data;
}