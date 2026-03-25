
import { Button } from "@/components/ui/button"
import { useLogout } from "@/queries/auth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";



export default function Temp()
{

    const logOut=useLogout();
    const navigate=useNavigate();

    const handleClick=async()=>
    {
        logOut.mutate();


    }

    if(logOut.isPending)
    {
        return <LoadingSpinner fullScreen />
    }

    return(
        <>
        Hello there

        <Button onClick={handleClick}>LogOut</Button>
        <Button onClick={() => navigate("/locations")}>locations</Button>
        </>
    )
}