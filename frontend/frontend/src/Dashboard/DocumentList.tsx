import type { JSX } from "react";
import type { Document } from "./Dashboard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/Auth/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/card";
import { FileText, Users, Trash2, MoreVertical } from "lucide-react";
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
    searchQuery: string;
}

interface DocumentPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Document[];
}



function DocumentList({ documents, setDocuments, searchQuery }: props): JSX.Element {
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
    }, [data, setDocuments]);

    const filteredDocuments = documents ? documents.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc: Document) => (
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
                                            {doc.authors}
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
                                        Open
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Share</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
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
            {nextUrl && !isLoading && (
                <div className="w-full flex justify-center items-center">
                    <img onClick={loadMore}
                    src='/images/down-arrow.png'
                    className="w-5 h-5 hover:cursor-pointer"
                />
                </div>
                
            )}
            {isLoading && <p className="mt-2 text-gray-500">Loading...</p>}
            {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No documents found</h3>
                    <p className="text-muted-foreground">
                    {searchQuery ? "Try a different search term" : "Create your first document to get started"}
                    </p>
                </div>
            )}
            
        </div>
    )
}

export default DocumentList;