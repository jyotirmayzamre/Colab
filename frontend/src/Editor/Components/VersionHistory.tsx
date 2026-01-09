import type { JSX } from 'react';
import { Download, History, Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from "@/Components/dialog";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/Components/card';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/Auth/api';
import Swal from 'sweetalert2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/dropdown";
import { Trash2, MoreVertical, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/Components/button";
import { Input } from '@/Components/input';
import { crdtToString } from "@/CRDT/utils";
import handleDownload from '../Utils/downloadUtil';
import { useEditor } from '../Provider/useEditor';
import { Virtuoso } from 'react-virtuoso';
import { Version, VersionPage } from '../types';




function VersionHistory(): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);
    const [versions, setVersions] = useState<Version[]>([]);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [versionTitle, setVersionTitle] = useState<string>('');
    const { docId, isEditable, ws, crdt } = useEditor();
    const queryClient = useQueryClient();

    const {
        data,
        fetchNextPage,
        hasNextPage,
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
                if(!crdt){
                    throw new Error('Document state is not available')
                }
                const response = await api.post('/api/versions/', 
                    { title: versionTitle,
                      docId: docId,
                      state: crdt.state
                     });
                const newVer = response.data;
                queryClient.invalidateQueries({ queryKey: ["versions", docId] });
                setVersions(prev => [newVer, ...(prev ?? [])]);
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
        Swal.fire({
            title: `Are you sure?`,
            text: 'Click confirm to delete this version',
            icon: 'warning',
            showConfirmButton: true,
            toast: true,
            position: 'top',
        }).then(async (result) => {
            if(result.isConfirmed){
                try {
                    await api.delete(`/api/versions/${versionId}/`);
                    setVersions(prev => prev.filter(version => version.id !== versionId));
                    Swal.fire({
                        title: 'Success!',
                        text: 'Deleted version',
                        icon: 'success',
                        showConfirmButton: false,
                        toast: true,
                        timer: 3000,
                        position: 'top',
                    })
                } catch(e) {
                    console.error(e);
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
        })
    }

    const downloadVersion = async (versionId: number) => {
        try {
            const response  = await api.get(`/api/versions/${versionId}/state`);
            const state = response.data.state;
            const value = crdtToString(state);
            handleDownload(value);
        } catch {
            Swal.fire({
                title: 'Error!',
                text: 'Could not download version :(',
                icon: 'error',
                showConfirmButton: false,
                toast: true,
                timer: 3000,
                position: 'top',
            })
        }  
    }


    const restoreVersion = async (versionId: number, versionTitle: string) => {
        Swal.fire({
            title: `Restore '${versionTitle}'?`,
            text: 'Click confirm to restore this version',
            icon: 'warning',
            showConfirmButton: true,
            toast: true,
            position: 'top',
        }).then((result) => {
            if(result.isConfirmed){
                if(!ws){
                    Swal.fire({
                        title: 'Error!',
                        text: 'Could not restore version :(',
                        icon: 'error',
                        showConfirmButton: false,
                        toast: true,
                        timer: 3000,
                        position: 'top',
                    })
                } else {
                    ws.send(JSON.stringify({type: 'version_restore', versionId: versionId}));
                    Swal.fire({
                        title: 'Success!',
                        text: `Restored version '${versionTitle}'`,
                        icon: 'success',
                        showConfirmButton: false,
                        toast: true,
                        timer: 3000,
                        position: 'top',
                    })
                }
            }
        })
    }

    const versionCard = (ver: Version) => {
        return(
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
                        {isEditable && (
                            <DropdownMenuItem onClick={() => restoreVersion(ver.id, ver.title)}>   
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                Restore
                            </DropdownMenuItem>
                        )}
                        {isEditable && (
                            <DropdownMenuSeparator />
                        )}
                        {isEditable && (
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteVersion(ver.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        )}
                        {isEditable && (
                            <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem onClick={() => downloadVersion(ver.id)}>
                            <Download className='mr-2 h-4 w-4' />
                            Download
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </li>
        )
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
                    {isEditable && (
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
                    )}
                    {versions.length > 0 && (
                        <Card className="rounded-lg w-full border border-border bg-card overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                            <CardContent className='p-0 h-[200px]'>
                                    {versions && 
                                        <Virtuoso className='divide-y divide-border' data={versions} endReached={() => {
                                            if(hasNextPage) fetchNextPage()
                                        }} itemContent={(_, ver) => versionCard(ver)} />
                                    }
                            </CardContent>
                        </Card>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}

export default VersionHistory;