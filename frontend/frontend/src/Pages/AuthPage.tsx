import { Outlet } from "react-router-dom";
import { type JSX } from "react";

function AuthPage(): JSX.Element {
    return(
        <div className="flex h-screen w-screen overflow-hidden">
            <div className="hidden md:flex w-1/3 h-full bg-[#d4f3f0] items-center justify-center">
                <img
                src="/images/form.jpg"
                alt="Login illustration"
                className="max-w-[75%] h-auto object-contain"
                />
            </div>

            <div className="flex w-full md:w-2/3 h-full bg-white items-center justify-center">
                <div className="w-full max-w-lg p-8">
                    <Outlet />
                </div>
            </div>
    </div>
    )
}

export default AuthPage;