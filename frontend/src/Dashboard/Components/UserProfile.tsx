import { useAuth } from "@/Auth/useAuth";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogPortal, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Separator } from "@/ui/separator"
import { Mail, Pencil, Check, X, Users, FileText, LogOut, Lock } from "lucide-react";
import { Label } from "@/ui/label";
import { useEffect, useState } from "react";
import api from "@/Auth/api";
import { sendNotification } from "@/lib/utils";


interface UserProfileProps {
    open: boolean;
    onClose: () => void;
}

function UserProfile({ open, onClose }: UserProfileProps){
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [documentsOwned, setDocumentsOwned] = useState<number>(3);
    const [documentsShared, setDocumentsShared] = useState<number>(23);
    const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const { logout } = useAuth();

    const getUserInfo = async (): Promise<void> => {
        try {
            const response = await api.get('/api/accounts/profile/');
            const data = response.data;
            setUsername(data.username);
            setEmail(data.email);
            setName(data.name);
            setDocumentsOwned(data.documents_owned);
            setDocumentsShared(data.documents_shared);
        } catch(e){
            console.error(e);
            sendNotification('error', 'Could not fetch user details');
        }
    } 

    
    const updateUsername = async (): Promise<void> => {
        try {
            await api.patch('/api/accounts/update-username/', {
                username: username
            });
            setIsEditingUsername(false);
            sendNotification('success', 'Updated username :)');
        } catch(e){
            console.error(e);
            sendNotification('error', 'Could not update username')
        }
    }

    const updatePassword = async (): Promise<void> => {
        try {
            await api.patch('/api/accounts/update-password/', {
                new_password: newPassword,
                confirm_password: confirmPassword
            })
            setIsChangingPassword(false);
            sendNotification('success', 'Updated password :)')
        } catch(e){
            console.error(e);
            sendNotification('error', 'Could not update password')
        }
    }


    useEffect(() => {
        getUserInfo();
    }, [])

    return(
        <Dialog open={open} onOpenChange={onClose}>
            <DialogPortal>
                <DialogContent className="w-md">
                    <DialogTitle>Profile</DialogTitle>
                    <DialogDescription></DialogDescription>
                    <div className="flex flex-col gap-2 justify-start items-center">
                        <div className="flex justify-start items-center my-3 gap-2">
                            <div className="bg-red-500 text-center rounded-full w-auto h-auto  text-white text-3xl p-4">
                                {name ? name.split(' ').map((word) => word[0]).join("") : ""}
                            </div>
                            <div className="flex flex-col justify-center items-start gap-1">
                                <div className="flex items-center">
                                    {isEditingUsername ? (
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="h-8 text-sm"
                                                autoFocus
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                onClick={updateUsername}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setIsEditingUsername(false)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold truncate">{username}</h3>
                                            <Button size="icon" variant="ghost" 
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                onClick={() => setIsEditingUsername(true)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="truncate">{email}</span>
                                </div>
                                

                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 my-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{documentsOwned}</p>
                                    <p className="text-xs text-muted-foreground">Documents Owned</p>
                                </div>
                                </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary/80">
                                        <Users className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{documentsShared}</p>
                                    <p className="text-xs text-muted-foreground">Shared With You</p>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="my-3">
                            {isChangingPassword ? (
                            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-sm font-medium">
                                        New Password
                                    </Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    </div>
                                <div className="flex gap-2 pt-2">
                                <Button
                                    disabled={newPassword !== confirmPassword}
                                    className="flex-1"
                                    onClick={updatePassword}
                                >
                                    Update Password
                                </Button>
                                <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                                    Cancel
                                </Button>
                                </div>
                            </div>
                            ) : (
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                <Lock className="h-4 w-4" />
                                Change Password
                            </Button>
                            )}
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full gap-2"
                            onClick={logout}
                        >
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </Button>
                    </div>
                </DialogContent>
            </DialogPortal>

        </Dialog>
    )
}

export default UserProfile