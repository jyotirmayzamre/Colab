import type { JSX } from "react";
import type { Document } from "../Home//HomePage";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../Auth/api";
import { useQuery } from "@tanstack/react-query";


type props = {
    documents: Document[] | null;
    setDocuments: React.Dispatch<React.SetStateAction<Document[] | null>>
}

interface DocumentPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Document[];
}



function DocumentList({ documents, setDocuments }: props): JSX.Element {
    const navigate = useNavigate();
    const [currentUrl, setCurrentUrl] = useState<string>('/api/documents/')
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    

    const { data, isLoading } = useQuery<DocumentPage>({
        queryKey: ["documents", currentUrl],
        queryFn: async () => {
            const res = await api.get(currentUrl);
            return res.data;
        },
    });

    const loadMore = () => {
        if(nextUrl){
            setCurrentUrl(nextUrl);
        }
    }


    useEffect(() => {
        if(!data) return;
        setDocuments(prev => [...(prev ?? []), ...data.results]);
        setNextUrl(data.next);
    }, [data, setDocuments])

    const handleClick = (docId: string) => {
        navigate(`/document/${docId}`);
    }

    // useEffect(() => {
    //     const fetchData = async() => {
    //         try{
    //             const response = await api.get('/api/documents/');
    //             setDocuments(response.data.results);
    //             setNextUrl(response.data.next);
    //         } catch(error){
    //             console.error(error);
    //         }
            
    //     }
    //     fetchData();
    // }, [setDocuments]);


    // const loadMore = async () => {
    //     if (!nextUrl) return;
    //     setLoading(true);

    //     try {
    //         const response = await api.get(nextUrl);
    //         setDocuments(prev => [...(prev ?? []), ...response.data.results]);
    //         setNextUrl(response.data.next);
    //     } catch(error){
    //         console.error(error);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    return (
        <div className="flex flex-col bg-white rounded-md shadow-sm p-5 w-full min-h-[calc(100vh-320px)]">
            <div className="flex justify-between items-center w-[90%] px-8 mx-auto">
                <div className="flex justify-center items-center gap-10">
                    <div className="w-7" /> 
                        <h2 className="font-lightbold">Recent Documents</h2>
                    </div>
                    <div className="flex font-lightbold justify-center items-center gap-14">
                        <h2>Access</h2>
                        <h2>Last Updated</h2>
                        <h2>More</h2>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center gap-0.5 w-full p-5">
                    {documents && documents.map((item: Document) => (
                    <div 
                        key={item.id} 
                        onClick={() => handleClick(item.id)}
                        className="flex justify-between items-center rounded-md w-[90%] p-5 hover:cursor-pointer hover:bg-blue-100">
                        <div className="flex justify-center items-center gap-10">
                            <img src="/images/docs.png" className="h-7 w-7" />
                            <p>{item.title}</p>
                        </div>
                        <div className="flex justify-center items-center gap-14 text-gray-600">
                            <p>{item.access[0].toUpperCase().concat(item.access.slice(1))}</p>
                            <p>{item.updated_at}</p>
                            <img 
                                src="/images/more.png" 
                                className="h-8 w-8 hover:cursor-pointer rounded-full hover:border hover:border-gray-300 p-1.5"
                            />
                        </div>
                    </div>
                ))}
                </div>

                {nextUrl && !isLoading && (
                    <div className="w-full flex justify-center items-center">
                        <img onClick={loadMore}
                        src='/images/down-arrow.png'
                        className="w-5 h-5 hover:cursor-pointer"
                    />
                    </div>
                    
                )}
                {isLoading && <p className="mt-2 text-gray-500">Loading...</p>}
        </div>
    )
}

export default DocumentList;