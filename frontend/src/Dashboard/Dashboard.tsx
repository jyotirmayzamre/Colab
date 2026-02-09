import { type JSX } from "react";
import CreateDocument from "./Components/CreateDocument";
import DocumentList from "./Components/DocumentList";
import HomeNavbar from "./Components/DashboardNavbar";
import { useAuth } from "@/Auth/useAuth";


function Dashboard(): JSX.Element {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-subtle">
            <HomeNavbar />
            <div className="container mx-auto px-4 py-8 text-left">
                <div className="mb-10">
                    <h1 className="text-5xl font-bold mb-2">Welcome back, {user.username}</h1>
                    <p className="text-muted-foreground text-xl">Continue working on your documents.</p>
                </div>
                <CreateDocument />
                <DocumentList />
                
            </div>
        </div>
    )
}

export default Dashboard;