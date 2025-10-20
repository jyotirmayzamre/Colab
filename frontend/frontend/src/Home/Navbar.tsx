import type { JSX } from "react";
import { useAuth } from "../Auth/useAuth";

function Navbar(): JSX.Element {
    const { logout } = useAuth();
    return (
        <nav className="flex justify-around items-center shadow-md p-4">
            <div className="flex gap-5 justify-center items-center">
                <img src="/images/docs.png" className="h-15 w-15" />
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

export default Navbar;