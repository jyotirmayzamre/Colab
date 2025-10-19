import { useState,useEffect, type JSX } from "react";
import CreateDocument from "../Components/Home/CreateDocument";
import DocumentList from "../Components/Home/DocumentList";
import api from "../Auth/api";
import Navbar from "../Components/Home/Navbar";

export type Document = {
    access: string;
    authors: string[];
    id: string;
    title: string;
    updated_at: string
}

function HomePage(): JSX.Element {
    const [documents, setDocuments] = useState<Document[] | null>(null);

    const newDocument = (newDoc: Document) => {
        if(documents){
            const newState = [...documents, newDoc];
            setDocuments(newState);
        } else{
            setDocuments([newDoc]);
        }
    }

    useEffect(() => {
        const fetchData = async() => {
            const response = await api.get('/api/documents/');
            setDocuments(response.data.results);
            console.log(response.data.results);
        }
        fetchData();
    }, []);

    return (
        <>
            <header>
                <Navbar />
            </header>
            <main className="bg-[rgb(241,243,244)] w-full h-full min-h-screen flex flex-col gap-2">
                <CreateDocument onCreated={ newDocument }/>
                <DocumentList documents={ documents }/>
            </main>
        </>
    )
}

export default HomePage;