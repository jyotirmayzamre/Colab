import { type JSX } from "react";
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
                <p className="text-2xl font-medium">Colab</p>
            </div>
            <div className="rounded-4xl px-4 py-3 bg-[rgb(240,244,249)] w-xl flex justify-start items-center gap-2 focus-within:bg-white focus-within:shadow-sm transition-colors duration-200">
                <img src='/images/search.png' className="h-5 w-5" />
                <input className="border-none outline-none w-full hover:border-none hover:outline-none" type="text" placeholder="Search" />
            </div>
            <div>
                <p className="hover:underline hover:cursor-pointer hover:text-blue-500" onClick={logout}>Logout</p>
            </div>
        </nav>
    )
}

export default HomeNavbar;