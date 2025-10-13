import { useAuth } from "./useAuth";
import { Navigate} from "react-router-dom";
import { type JSX } from "react";

interface ProtectedProps {
    children: JSX.Element;
}


const ProtectedRoute = ({ children }: ProtectedProps) => {
    const { user } = useAuth();
    return !user ? <Navigate to='/auth/login' /> : children;
}

export default ProtectedRoute;