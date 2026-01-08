import { useState, type JSX } from "react";
import CreateDocument from "./Components/CreateDocument";
import DocumentList from "./Components/DocumentList";
import HomeNavbar from "./Components/DashboardNavbar";
import { useAuth } from "@/Auth/useAuth";
import { Document } from "./types";


function Dashboard(): JSX.Element {
    const [documents, setDocuments] = useState<Document[] | null>(null);
    const { user } = useAuth();

   

    return (
        <div className="min-h-screen bg-gradient-subtle">
            <HomeNavbar />
            <div className="container mx-auto px-4 py-8 text-left">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Your Documents</h1>
                    <p className="text-muted-foreground text-lg">Welcome back, {user.username}! Continue working on your projects.</p>
                </div>
                <CreateDocument setDocuments={setDocuments} />
                <DocumentList documents={ documents } setDocuments={setDocuments} />
                
            </div>
        </div>
    )
}

export default Dashboard;