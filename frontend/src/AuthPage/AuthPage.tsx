import { Outlet, useLocation } from "react-router-dom";
import { type JSX } from "react";
import authImage from "@/assets/auth-workspace.jpg";

function AuthPage(): JSX.Element {
    const location = useLocation();
    return(
        <div className="h-screen grid lg:grid-cols-2">
        <div className="hidden lg:block relative overflow-hidden">
            <img
            src={authImage}
            alt="Workspace"
            className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={ 
                "absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60"
            } />
            <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white space-y-6 max-w-lg">
                <h2 className="text-4xl font-bold leading-tight">
                {location.pathname == '/auth/login' ? 'Welcome back to seamless collaboration' : 'Start collaborating with your team today'}
                </h2>
                <p className="text-lg text-white/90">
                {location.pathname == '/auth/login' ? 'Continue working on your documents and collaborate with your team in real-time.'
                : 'Join Colab for seamless real-time document collaboration.'}
                
                </p>
            </div>
            </div>
        </div>
        <Outlet />
      </div>
    )
}

export default AuthPage;