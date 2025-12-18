import { useAuth } from "./useAuth";
import { Navigate} from "react-router-dom";
import { type JSX } from "react";

interface ProtectedProps {
    children: JSX.Element;
}


const ProtectedRoute = ({ children }: ProtectedProps) => {
    const { authenticated } = useAuth();
    
    if(!authenticated){
        return <Navigate to='/auth/login' />
    }

    return children;
}

export default ProtectedRoute;