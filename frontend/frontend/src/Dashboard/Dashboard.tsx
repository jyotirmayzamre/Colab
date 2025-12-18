import { useState, type JSX } from "react";
import CreateDocument from "./CreateDocument";
import DocumentList from "./DocumentList";
import HomeNavbar from "./DashboardNavbar";
import SearchDocument from "./SearchDocument";

export type Document = {
    access: string;
    authors: string[];
    id: string;
    title: string;
    updated_at: string;
    num_users: number;
}

function Dashboard(): JSX.Element {
    const [documents, setDocuments] = useState<Document[] | null>(null);

   

    return (
        <div className="min-h-screen bg-gradient-subtle">
            <HomeNavbar />
            <div className="container mx-auto px-4 py-8 text-left">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Your Documents</h1>
                    <p className="text-muted-foreground text-lg">Welcome back! Continue working on your projects.</p>
                </div>
                <CreateDocument setDocuments={setDocuments} />
                <SearchDocument  />
                <DocumentList documents={ documents } setDocuments={setDocuments} />
                
            </div>
        </div>
    )
}

export default Dashboard;