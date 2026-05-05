import type { JSX } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";
import { forwardRef, useState } from "react";
import api from "@/Auth/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { FileText, Users, Trash2, MoreVertical, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown";
import { Button } from "@/ui/button";
import { VirtuosoGrid } from "react-virtuoso";
import Swal from "sweetalert2";
import SearchDocument from "./SearchDocument";
import { Document } from "../types";
import useInfiniteApi from "@/lib/reactQueryHook";
import { sendNotification } from "@/lib/utils";


function DocumentList(): JSX.Element {
    const navigate = useNavigate();
    const [query, setQuery] = useState<string>('');
    const [viewOwned, setViewOwned] = useState<boolean>(true);
 
    const {
            fetchNextPage,
            hasNextPage,
            results,
            invalidateCache
        } = useInfiniteApi<Document>({
            param: `/api/documents/`,
            initialPageParam: '/api/documents/',
            queryKey: ["documents"]
        }
        )

    const deleteDoc = async (docId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Click confirm to delete this document',
            icon: 'warning',
            showConfirmButton: true,
            toast: true,
            position: 'top',
        }).then(async (result) => {
            if(result.isConfirmed){
                try {
                    await api.delete(`/api/documents/${docId}/`);
                    invalidateCache(['documents']);
                    sendNotification('success', 'Document deleted!');
                } catch(e) {
                    console.error(e);
                    sendNotification('error', 'Could not delete document :(');
                }
                    }
                })
        
    };



    const documentCard = (doc: Document) => {
        return (<Card key={doc.id} className="hover:shadow-lg transition-smooth cursor-pointer group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1 truncate">{doc.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                                <span>{doc.last_updated}</span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {doc.num_users}
                                </span>
                                <span>{doc.permission.charAt(0).toUpperCase() + doc.permission.slice(1)}</span>
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

                            <DropdownMenuItem onClick={() => navigate({
                                pathname: `/documents/${doc.id}`,
                                search: createSearchParams({
                                    isEditable: (doc.permission !== 'viewer').toString()
                                }).toString()
                                })}>
                                    
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
            <CardContent onClick={() => navigate({
                        pathname: `/documents/${doc.id}`,
                        search: createSearchParams({
                            isEditable: (doc.permission !== 'viewer').toString()
                        }).toString()
                    })}>
                <div className="text-sm text-muted-foreground">
                    <span className="underline">Click</span> to open and continue editing
                </div>
            </CardContent>
        </Card>)
    };


    const filterDocuments = () => {
        return results.filter((doc) => (doc.title.includes(query) && (
                viewOwned ? doc.permission === 'owner' : doc.permission !== 'owner'
            ))
        )
    };


    return (
        <div>
            <SearchDocument query={query} setQuery={setQuery} />
            <div className="mb-6 flex justify-center items-center gap-2">
                <Button
                    variant={viewOwned ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewOwned(true)}
                    className="gap-2 h-10"
                >
                    <FileText className="h-6 w-6" />
                    Owned
                </Button>
                <Button
                    variant={!viewOwned ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewOwned(false)}
                    className="gap-2 h-10"
                >
                    <Users className="h-6 w-6" />
                    Shared
                </Button>
            </div>
            {results && <VirtuosoGrid
                data={filterDocuments()}
                endReached={() => {
                    if(hasNextPage) fetchNextPage()
                }}
                itemContent={(_, doc) => documentCard(doc)}
                components={{
                    List: forwardRef(({ style, children }, ref) => (
                    <div
                        ref={ref}
                        style={style}
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {children}
                    </div>
                    )),
                }}
                style={{ height: 320}}
                />}
        </div>
    )
}

export default DocumentList;
