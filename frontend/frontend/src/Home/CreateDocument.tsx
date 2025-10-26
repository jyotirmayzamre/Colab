import type { JSX } from "react";
import api from "../Auth/api";
import type { Document } from "../Home/HomePage";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

type props = {
    setDocuments: React.Dispatch<React.SetStateAction<Document[] | null>>;
}

function CreateDocument({ setDocuments }: props): JSX.Element {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createDoc = async () => {
        try {
            const response = await api.post('/api/documents/', {title: 'Untitled Document'});
            const newDoc = response.data;
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            setDocuments(prev => [...(prev ?? []), newDoc]);
            navigate(`/document/${newDoc.id}`)

        } catch(err){
            console.error(err)
        }
    }

    return (
        <div className="p-10 flex flex-col justify-center items-center gap-5">
            <h2 className="text-2xl font-light">Start a new document</h2>
            <div onClick={createDoc} className="flex flex-col gap-2 justify-center items-center hover:cursor-pointer hover:border-1 hover:border-blue-400 w-35 h-45 bg-white rounded-sm shadow-sm">
                <img className='h-9 w-9' src="/images/plus.png" />
                <p className="text-xs">Blank document</p>
            </div>
        </div>
    )
}

export default CreateDocument;