import type { JSX, RefObject } from 'react';
import { History, Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from "@/Components/dialog";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/Components/card';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '@/Auth/api';
import Swal from 'sweetalert2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/dropdown";
import { Trash2, MoreVertical, ArrowUpRight, ArrowDownIcon, X } from "lucide-react";
import { Button } from "@/Components/button";
import { Input } from '@/Components/input';
import CRDT from '@/CRDT/crdt';

type Version = {
    id: number;
    title: string;
    created_at: string;
    creator_username: string;
}

interface VersionPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Version[]
}

type Props = {
    crdtRef: RefObject<CRDT | null>
}



function VersionHistory({ crdtRef }: Props): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);
    const { docId } = useParams();
    const [versions, setVersions] = useState<Version[]>([]);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [versionTitle, setVersionTitle] = useState<string>('');
    const queryClient = useQueryClient();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery<VersionPage>({
        queryKey: ["versions", docId],
        queryFn: async({ pageParam = `/api/versions?docId=${docId}`}) => {
            const res = await api.get(pageParam as string);
            return res.data
        },
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        initialPageParam: `/api/versions?docId=${docId}`
    });

    const createVersion = async () => {
            try {
                const crdt = crdtRef.current;
                if(!crdt){
                    throw new Error('Document state is not available')
                }
                const response = await api.post('/api/versions/', 
                    { title: versionTitle,
                      docId: docId,
                      state: crdt.state
                     });
                const newVer = response.data;
                queryClient.invalidateQueries({ queryKey: ["documents"] });
                setVersions(prev => [...(prev ?? []), newVer]);
                setIsCreating(false);

                Swal.fire({
                    title: 'Success!',
                    text: 'Successfully created version :)',
                    icon: 'success',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top',
                })
            } catch(e){
                console.error(e);

                Swal.fire({
                    title: 'Error!',
                    text: 'Could not create version :(',
                    icon: 'error',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top',
                })
            }
        }


    const deleteVersion = async (versionId: number) => {
        try {
            await api.delete(`/api/versions/${versionId}/`);
            setVersions(prev => prev.filter(version => version.id !== versionId));
        } catch {
            Swal.fire({
                title: 'Error!',
                text: 'Could not delete version :(',
                icon: 'error',
                showConfirmButton: false,
                toast: true,
                timer: 3000,
                position: 'top',
            })
        }
    }

    useEffect(() => {
            if (!data) return;
            const allVersions = data.pages.flatMap(page => page.results);
            setVersions(allVersions);
        }, [data, setVersions]);

    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div tabIndex={0}
                    className="
                        relative flex cursor-default select-none items-center rounded-sm
                        px-2 py-1.5 text-sm outline-none transition-colors
                        hover:bg-accent hover:text-accent-foreground
                        focus:bg-accent focus:text-accent-foreground m-0
                    ">
                    <History className='mr-2 h-4 w-4' /> 
                    Version History
                </div>
            </DialogTrigger>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className='max-w-lg'>
                    <DialogTitle>Version History</DialogTitle>
                    <DialogDescription></DialogDescription>
                    <Card className="my-8 h-16 border-2 border-dashed hover:border-primary transition-smooth cursor-pointer group">
                        <CardContent className="flex flex-col items-center justify-center py-3">
                            {isCreating ? (
                                <div className='flex gap-2 animate-fade-in'>
                                    <Input 
                                        placeholder='Enter version name...'
                                        value={versionTitle}
                                        onChange={(e) => setVersionTitle(e.target.value)}
                                        autoFocus
                                        className="flex-1"
                                    />
                                    <Button size="sm" onClick={createVersion} disabled={!versionTitle.trim()}>
                                        Save
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => { setIsCreating(false); setVersionTitle(""); }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-primary/10 hover:bg-primary/20 transition-colors" 
                                    onClick={() => setIsCreating(true)}
                                >
                                    <Plus className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-semibold text-primary">Create New Version</h3>
                                </div>
                            )}
                                
                        </CardContent>
                    </Card>
                    {versions.length > 0 && (
                        <Card className="rounded-lg w-full border border-border bg-card overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                            <CardContent className='p-0'>
                                <ul className='divide-y divide-border'>
                                    {versions && versions.map((ver) => {
                                        return (
                                            <li key={ver.id} className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-gray-200">
                                                <div className='flex items-center justify-center gap-5'>
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                                                        <History className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-md truncate">{ver.title}</p>
                                                        <p className="text-sm text-muted-foreground truncate">{ver.created_at} • {ver.creator_username}</p>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">

                                                        <DropdownMenuItem>
                                                                
                                                            <ArrowUpRight className="mr-2 h-4 w-4" />
                                                            Restore
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => deleteVersion(ver.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </li>
                                        )

                                    })
                                }
                                </ul>
                                {hasNextPage && (
                                    <button 
                                        onClick={() => fetchNextPage()} 
                                        disabled={isFetchingNextPage}
                                        className="w-full flex justify-center items-center"
                                    >
                                        {isFetchingNextPage ? 'Loading...' : <ArrowDownIcon className="w-5 h-5 hover:cursor-pointer" />}
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}

export default VersionHistory;