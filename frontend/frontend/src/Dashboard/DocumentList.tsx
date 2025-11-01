import type { JSX } from "react";
import type { Document } from "./Dashboard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/Auth/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/card";
import { FileText, Users, Trash2, MoreVertical, ArrowUpRight, ArrowDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/dropdown";
import { Button } from "@/Components/button";


type props = {
    documents: Document[] | null;
    setDocuments: React.Dispatch<React.SetStateAction<Document[] | null>>,
}

interface DocumentPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Document[];
}



function DocumentList({ documents, setDocuments}: props): JSX.Element {
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

    const deleteDoc = async (docId: string) => {
        try{
            await api.delete(`/api/documents/${docId}/`);
            setDocuments(prev => prev.filter(doc => doc.id !== docId))
        } catch(e){
            console.error(e)
        }
    }


    useEffect(() => {
        if(!data) return;
        setDocuments(prev => [...(prev ?? []), ...data.results]);
        setNextUrl(data.next);
    }, [data, setDocuments]);


    return (
        <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents && documents.map((doc: Document) => (
                <Card key={doc.id} className="hover:shadow-lg transition-smooth cursor-pointer group">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg mb-1 truncate">{doc.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-4 text-sm">
                                        <span>{doc.updated_at}</span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {doc.num_users}
                                        </span>
                                    </CardDescription> 
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/document/${doc.id}`)}>
                                        <ArrowUpRight className="mr-2 h-4 w-4" />
                                        Open
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => deleteDoc(doc.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent onClick={() => navigate(`/document/${doc.id}`)}>
                        <div className="text-sm text-muted-foreground">
                            Click to open and continue editing
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        {nextUrl && !isLoading && (
                <ArrowDownIcon onClick={loadMore} className="w-5 h-5 hover:cursor-pointer" />
            )}
        {isLoading && <p className="mt-2 text-gray-500">Loading...</p>}
        </div>
    )
}

export default DocumentList;