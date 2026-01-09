import type { JSX } from "react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/Auth/api";
import Swal from "sweetalert2";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogTitle, DialogContent, DialogDescription } from "@/Components/dialog";
import { Card, CardContent } from "@/Components/card";
import { User2 } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { Button } from "@/Components/button";


interface Access {
    user: string,
    username: string,
    document: string,
    level: string,
    id: number
}

function SharedUsers(): JSX.Element {
    const [results, setResults] = useState<Access[]>([]);
    const [open, setOpen] = useState<boolean>(false);
    const { docId } = useParams();

    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const response = await api.get(`/api/permissions/share?docId=${docId}`);
                const data = response.data;
                setResults(data.results);
            } catch(e){
                console.error(e);
                Swal.fire({
                    title: 'Error!',
                    text: 'Could not fetch document authors :(',
                    icon: 'error',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top'
                })
            }
        }
        fetchAuthors();
    }, [docId]);

    const revokeAccess = async (accessId: number) => {
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
                        setResults((prev) => prev.filter((acc) => acc.id !== accessId));
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
    }

    const updateAccess = async (accessId: number, newLevel: string) => {
        setResults(prev =>
            prev.map(acc =>
                acc.id === accessId ? { ...acc, level: newLevel } : acc
            )
        );
        console.log(newLevel);
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
    }


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
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div tabIndex={0}
                    className="
                        relative flex cursor-default select-none items-center rounded-sm
                        px-2 py-1.5 text-sm outline-none transition-colors
                        hover:bg-accent hover:text-accent-foreground
                        focus:bg-accent focus:text-accent-foreground m-0
                    ">
                    <User2 className='mr-2 h-4 w-4' />
                    Document Permissions
                </div>
            </DialogTrigger>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className='max-w-lg'>
                    <DialogTitle>Document Permissions</DialogTitle>
                    <DialogDescription></DialogDescription>
                    {results.length > 0 ? (
                        <Card className="rounded-lg w-full border border-border bg-card overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                            <CardContent className='p-0 h-[150px]'>
                                    {results && 
                                        <Virtuoso className='divide-y divide-border' data={results} 
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

export default SharedUsers;