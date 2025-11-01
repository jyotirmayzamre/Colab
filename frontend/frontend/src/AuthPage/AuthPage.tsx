import { Outlet } from "react-router-dom";
import { type JSX } from "react";
import { FileText } from "lucide-react";
import authImage from "@/assets/auth-workspace.jpg";

function AuthPage(): JSX.Element {
    return(
        <div className="h-screen grid lg:grid-cols-2">
        <div className="hidden lg:block relative overflow-hidden">
            <img
            src={authImage}
            alt="Workspace"
            className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/60"></div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white space-y-6 max-w-lg">
                <div className="flex items-center gap-3">
                <FileText className="h-10 w-10" />
                <span className="text-3xl font-bold">Colab</span>
                </div>
                <h2 className="text-4xl font-bold leading-tight">
                Welcome back to seamless collaboration
                </h2>
                <p className="text-lg text-white/90">
                Continue working on your documents and collaborate with your team in real-time.
                </p>
            </div>
            </div>
        </div>
        <Outlet />
      </div>
    )
}

export default AuthPage;