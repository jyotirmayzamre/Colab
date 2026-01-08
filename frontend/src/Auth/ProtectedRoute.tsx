import { useAuth } from "./useAuth";
import { Navigate} from "react-router-dom";
import { type JSX } from "react";

interface Props {
    children: JSX.Element;
}


const ProtectedRoute = ({ children }: Props) => {
    const { authenticated, authChecked } = useAuth();

    if(!authChecked) return <div></div>;

    return authenticated ? children : <Navigate to='/auth/login' />;
}

export default ProtectedRoute;