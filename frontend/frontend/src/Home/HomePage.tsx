import { useState, type JSX } from "react";
import CreateDocument from "./CreateDocument";
import DocumentList from "./DocumentList";
import HomeNavbar from "./HomeNavbar";

export type Document = {
    access: string;
    authors: string[];
    id: string;
    title: string;
    updated_at: string
}

function HomePage(): JSX.Element {
    const [documents, setDocuments] = useState<Document[] | null>(null);

    return (
        <>
            <header>
                <HomeNavbar />
            </header>
            <main className="bg-[rgb(241,243,244)] w-full h-full min-h-screen flex flex-col gap-2">
                <CreateDocument setDocuments={ setDocuments }/>
                <DocumentList documents={ documents } setDocuments={setDocuments}/>
            </main>
        </>
    )
}

export default HomePage;