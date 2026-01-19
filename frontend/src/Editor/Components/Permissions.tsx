import type { JSX } from "react";
import { useParams } from "react-router-dom";
import { memo } from "react";
import api from "@/Auth/api";
import Swal from "sweetalert2";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogContent, DialogDescription } from "@/Components/dialog";
import { Card, CardContent } from "@/Components/card";
import { User2 } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { Button } from "@/Components/button";
import useProfiler from "../profiler";
import type { Access } from "../types";
import useInfiniteApi from "../../lib/reactQueryHook";
import { sendNotif } from "@/lib/utils";



interface PermissionsProps {
  open: boolean;
  onClose: () => void;
}

function Permissions({ open, onClose }: PermissionsProps): JSX.Element {
    const { docId } = useParams();

    useProfiler('Permissions');

    
    const {
            fetchNextPage,
            hasNextPage,
            results,
            invalidateCache
        } = useInfiniteApi<Access>({
            param: `/api/versions?docId=${docId}`,
            initialPageParam: `/api/versions?docId=${docId}`,
            queryKey: ["versions", docId]
        }
        )


    const revokeAccess = async (accessId: number) => {
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
                    invalidateCache(['permissions', docId]);
                    sendNotif('success', 'Access revoked!');
                } catch(e){
                    console.error(e);
                    sendNotif('error', 'Could not revoke access :(');
                }
                
            }
        }) 
    };

    const updateAccess = (async (accessId: number, newLevel: string) => {
        invalidateCache(['permissions', docId]);
        setTimeout(async () => {
            try {
                await api.patch(`/api/permissions/share/${accessId}/?docId=${docId}`, {
                    'level': newLevel
                });
                sendNotif('success', 'Updated access!');
            } catch(e){
                console.error(e);
                sendNotif('error', 'Could not update access :(');
            }
        }, 1000);
    });


    const accessCard = (access: Access) => (
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
    );

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