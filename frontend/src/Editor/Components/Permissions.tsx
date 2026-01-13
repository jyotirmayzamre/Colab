import type { JSX } from "react";
import { useParams } from "react-router-dom";
import { useCallback, useMemo, memo } from "react";
import api from "@/Auth/api";
import Swal from "sweetalert2";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogContent, DialogDescription } from "@/Components/dialog";
import { Card, CardContent } from "@/Components/card";
import { User2 } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { Button } from "@/Components/button";
import useProfiler from "../profiler";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";


interface Access {
    user: string,
    username: string,
    document: string,
    level: string,
    id: number
}

interface AccessPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Access[]
}

interface PermissionsProps {
  open: boolean;
  onClose: () => void;
}

function Permissions({ open, onClose }: PermissionsProps): JSX.Element {
    const { docId } = useParams();
    const queryClient = useQueryClient();

    useProfiler('Permissions');

    const {
        data,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery<AccessPage>({
        queryKey: ["permissions", docId],
        queryFn: async({ pageParam = `/api/permissions/share?docId=${docId}`}) => {
            try{
                const res = await api.get(pageParam as string);
                return res.data
            } catch(e){
                console.error(e);
            }     
        },
        getNextPageParam: (lastPage) => lastPage.next ?? undefined,
        initialPageParam: `/api/permissions/share?docId=${docId}`
    });

     const results = useMemo(() => {
            if (!data) return [];
            return data.pages.flatMap(page => page.results);
        }, [data]);


    const revokeAccess = useCallback(async (accessId: number) => {
        try {
            Swal.fire({
                title: `Are you sure?`,
                text: 'Click confirm to revoke access',
                icon: 'warning',
                showConfirmButton: true,
                toast: true,
                position: 'top',
            }).then(async (result) => {
                if(result.isConfirmed){
                    try {
                        await api.delete(`/api/permissions/share/${accessId}/?docId=${docId}`);
                        queryClient.invalidateQueries({ queryKey: ['permissions', docId]});
                        Swal.fire({
                            title: 'Success!',
                            text: 'Access revoked',
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
        catch(e){
            console.error(e);
            Swal.fire({
                title: 'Error!',
                text: 'Could not revoke access :(',
                icon: 'error',
                showConfirmButton: false,
                toast: true,
                timer: 3000,
                position: 'top'
            })
        }
    }, [docId, queryClient]);

    const updateAccess = useCallback(async (accessId: number, newLevel: string) => {
        queryClient.invalidateQueries({ queryKey: ['permissions', docId]});
        setTimeout(async () => {
            try {
                await api.patch(`/api/permissions/share/${accessId}/?docId=${docId}`, {
                    'level': newLevel
                });
                Swal.fire({
                    title: 'Success!',
                    text: 'Updated access :)',
                    icon: 'success',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top'
                })
            } catch(e){
                console.error(e);
                Swal.fire({
                    title: 'Error!',
                    text: 'Could not update access :(',
                    icon: 'error',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top'
                })
            }
        }, 1000);
    }, [docId, queryClient]);


    const accessCard = useCallback((access: Access) => (
         <li key={access.user} className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors">
            <div className='flex items-center justify-center gap-5'>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                    <User2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-md truncate">{access.username}</p>
                </div>
            </div>
            <select className='rounded-sm h-11 border border-black p-2 bg-white' value={access.level} 
                onChange={(e) => updateAccess(access.id, e.target.value)}
            >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
            </select>
            <Button size="default" className="bg-red-500 hover:bg-red-500" onClick={() => revokeAccess(access.id)}>Revoke</Button>
        </li>
    ), [revokeAccess, updateAccess]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className='max-w-lg'>
                    <DialogTitle>Document Permissions</DialogTitle>
                    <DialogDescription></DialogDescription>
                    {results.length > 0 ? (
                        <Card className="rounded-lg w-full border border-border bg-card overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                            <CardContent className='p-0 h-[150px]'>
                                    {results && 
                                        <Virtuoso className='divide-y divide-border' data={results} endReached={() => {
                                            if(hasNextPage) fetchNextPage()}}
                                        itemContent={(_, acc) => accessCard(acc)} />
                                    }
                            </CardContent>
                        </Card>
                    ) : (
                        <p>Share this document with other users!</p>
                    )}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
    
}

export default memo(Permissions);