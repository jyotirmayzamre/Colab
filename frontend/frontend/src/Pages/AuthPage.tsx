import { Outlet } from "react-router-dom";
import { type JSX } from "react";

function AuthPage(): JSX.Element {
    return(
        <>
            <div></div>
            <Outlet />
        </>
    )
}

export default AuthPage;