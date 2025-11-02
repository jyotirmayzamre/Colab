import type { JSX } from "react";
import type { Document } from "./Dashboard";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/Auth/api";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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
 
      const { 
        data, 
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery<DocumentPage>({
        queryKey: ["documents"],
        queryFn: async ({ pageParam = '/api/documents/' }) => {
            const res = await api.get(pageParam);
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        initialPageParam: '/api/documents/'
    });

    const deleteDoc = async (docId: string) => {
        try {
            await api.delete(`/api/documents/${docId}/`);
            setDocuments(prev => prev.filter(doc => doc.id !== docId));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!data) return;
        const allDocs = data.pages.flatMap(page => page.results);
        setDocuments(allDocs);
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
        {hasNextPage && (
                <button 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="w-full flex justify-center items-center"
                >
                    {isFetchingNextPage ? 'Loading...' : <ArrowDownIcon className="w-5 h-5 hover:cursor-pointer" />}
                </button>
            )}
        </div>
    )
}

export default DocumentList;