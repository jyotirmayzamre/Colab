import type { ChangeEvent, JSX } from "react";
import { useAuth } from "../Auth/useAuth";
import { useNavigate} from "react-router-dom";
import ShareDoc from "./ShareDoc";
import { useState, useEffect, useCallback } from "react";
import api from "../Auth/api";

type props = {
    docTitle: string;
    docId: string;
}

function EditorNavbar({ docTitle, docId }: props): JSX.Element {
    const { user } = useAuth();
    const [value, setValue] = useState<string>(docTitle);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/home/${user?.user_id}`);
    }

    const onChangeHandler = async (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    }

    useEffect(() => {
        setValue(docTitle);
    }, [docTitle]);



    const renameDocument = useCallback(async (newTitle: string) => {
        try {
            await api.patch(`/api/documents/${docId}/`, { title: newTitle});
            console.log('Document renamed to', newTitle);
        } catch(e){
            console.error(e);
        }
    }, [docId]);



    useEffect(() => {
        const handler = setTimeout(() => {
            if(value !== docTitle){
                renameDocument(value);
            }
        }, 800);

        return () => {
            clearTimeout(handler);
        }
    }, [value, renameDocument, docTitle]);



    return (
            <nav className="p-4 flex justify-around items-center w-full">
                <div className="flex justify-center items-center gap-3">
                    <img src="/images/docs.png" className="h-12 w-12 hover:cursor-pointer" onClick={handleClick}/>
                    <div className="flex flex-col justify-center items-start gap-2">
                        <input className="text-xl text-gray-600 p-0.5" value={value} onChange={onChangeHandler} type="text"/>
                        <div className="flex justify-center items-start gap-4 text-sm">
                            <span>File</span>
                            <span>Edit</span>
                            <span>View</span>
                            <span>Insert</span>
                            <span>Format</span>
                            <span>Tools</span>
                            <span>Help</span>
                        </div>
                    </div>
                </div>
                <div>
                    <ShareDoc />
                </div>
                
                
            </nav>
    )
}

export default EditorNavbar;