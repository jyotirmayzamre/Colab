import type { JSX } from "react";
import { useAuth } from "../Auth/useAuth";
import { useNavigate } from "react-router-dom";

function HomeNavbar(): JSX.Element {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/home/${user?.user_id}`);
    }

    return (
        <nav className="flex justify-around items-center shadow-md p-4">
            <div className="flex gap-5 justify-center items-center">
                <img src="/images/docs.png" className="h-12 w-12 hover:cursor-pointer" onClick={handleClick}/>
                <p className="text-2xl font-semibold">Colab</p>
            </div>
            <div>
                <input className='border-1 rounded-sm p-2 bg-gray-50 w-lg' type="text" placeholder="Search documents" />
            </div>
            <div>
                <p className="hover:underline hover:cursor-pointer" onClick={logout}>Logout</p>
            </div>
        </nav>
    )
}

export default HomeNavbar;