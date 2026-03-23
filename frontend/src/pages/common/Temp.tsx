
import { Button } from "@/components/ui/button"
import { useLogout } from "@/queries/common/auth"
import LoadingSpinner from "@/components/common/LoadingSpinner";



export default function Temp()
{

    const logOut=useLogout();


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
        </>
    )
}