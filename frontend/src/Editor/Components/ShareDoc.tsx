import { ChangeEvent, useEffect, useState, useCallback, type JSX } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Input } from "@/Components/input";
import api from "../../Auth/api";
import { Button } from "@/Components/button";
import { Share2, User, Copy, Check } from "lucide-react";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from "@/Components/dialog";
import { cn, sendNotif } from "@/lib/utils";
import { useEditorMeta } from "../Provider/hooks";
import { Virtuoso } from "react-virtuoso";
import { Card, CardContent } from "@/Components/card";
import useProfiler from "../profiler";
import useInfiniteApi from "../../lib/reactQueryHook";

interface FormFields {
    username: string,
    access: string,
    user_id: string
}

interface User {
    username: string,
    id: string,
    first_name: string,
    last_name: string,
    site_id: number,
    email: string
}



const wait = () => new Promise((resolve) => setTimeout(resolve, 1000));

function ShareDoc(): JSX.Element {
    const [query, setQuery] = useState<string>('');
    const [shareLink, setShareLink] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const { docId } = useEditorMeta();

    const {
            fetchNextPage,
            hasNextPage,
            results
        } = useInfiniteApi<User>({
            param: `/api/accounts/searchUsers/?q=${query}`,
            initialPageParam: `/api/accounts/searchUsers/?q=${query}`,
            queryKey: ["users", query]
        }
        )


    const { register,
            handleSubmit,
            setValue,
            watch,
            formState: { isSubmitting },
    } = useForm<FormFields>();

    useProfiler('Editor Navbar');


    //Submit handler for share document form
    const onSubmit: SubmitHandler<FormFields> = useCallback(async (data) => {
        const userId = data.user_id;
        const access = data.access;
        const payload = { docId: docId, userId: userId, level: access}

        try{
            await api.post('/api/permissions/share/', payload);
            sendNotif('success', 'Document shared');
        } catch(e){
            console.error(e);
            sendNotif('error', 'Could not share document :(');
        }
    }, [docId]);

    const access = watch('access', 'editor');

    const fetchShare = useCallback(async () => {
        const data = { docId: docId, role: access }
        try {
            const response = await api.post('/api/permissions/create-share-link/', data);
            setShareLink(response.data.link);
        } catch(e){
            console.error(e);
            sendNotif('error', 'Could not create share link :(')
        }
    }, [access, docId]);

    

    useEffect(() => {
        fetchShare();
    }, [fetchShare])

    

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if(e.target.value == ''){
            setSelectedUser('');
        }
    };

    const userCard = (user: User) => {
        return (
            <li key={user.id} className={cn("flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-200", 
                selectedUser === user.id && "bg-blue-100")}
                onClick={() => {
                    setValue('username', user.username);
                    setValue('user_id', user.id);
                    setSelectedUser(user.id);
                }}>
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.username}</p>
                </div>
            </li>
        )
    };


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Share2 className="h-4 w-4  hover:cursor-pointer" />
            </DialogTrigger>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle>Share document</DialogTitle>
                    <DialogDescription>
                        Search for a user or share an invite link.
                    </DialogDescription>
                    <form method="post" onSubmit={handleSubmit(onSubmit)} className="mt-6">
                        <input type='hidden' {...register('user_id')} />
                        <div className="flex justify-center items-center gap-2 m-4">
                            <Input 
                                id="name"
                                className="pl-10 h-11 bg-gray-100 border-transparent focus:border-primary/30 focus:bg-card transition-colors"
                                {...register('username')}
                                placeholder="Search by name..."
                                onChange={onChange}
                            />
                            <select className='rounded-sm h-11 border border-black p-2 bg-white' {...register('access', { required: true })}>
                                <option value="editor" defaultChecked>Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>

                        </div>
                        {
                            query && results.length > 0 && (
                                    <Card className="my-3 rounded-lg border border-border bg-card overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                                        <CardContent className="p-0 h-[150px]">
                                            <Virtuoso className="divide-y divide-border" data={results} endReached={() => {
                                                if(hasNextPage) fetchNextPage()
                                            }}
                                                itemContent={(_, user) => userCard(user)}
                                            />
                                        </CardContent>
                                    </Card>
                                )
                        }
                            
                        <div className="flex justify-center items-center">
                            <button className='rounded-lg py-3 px-5 bg-blue-500 text-white w-full hover:cursor-pointer hover:brightness-125' type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Loading...' : 'Share'}
                            </button>
                        </div>
                        <div className="flex items-center my-4">
                            <hr className="flex-grow border-t border-gray-300" />
                            <span className="mx-2 text-gray-500 text-sm">OR</span>
                            <hr className="flex-grow border-t border-gray-300" />
                        </div>

                        <div className="px-6 pb-6">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 border border-border/50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">Share invite link</p>
                                    <p className="text-sm font-mono truncate">{shareLink}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    type="button"
                                    size="icon"
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareLink);
                                        setCopied(true);
                                        wait().then(() => setCopied(false));
                                    }}
                                    className={cn(
                                        "h-9 w-9 shrink-0 transition-colors",
                                        copied && "text-green-600 bg-green-50 hover:bg-green-50 hover:text-green-600"
                                    )}
                                    >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}

export default ShareDoc;