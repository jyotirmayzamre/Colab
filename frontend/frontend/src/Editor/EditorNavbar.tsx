import type { JSX } from "react";
import { useAuth } from "../Auth/useAuth";
import { useNavigate} from "react-router-dom";
import ShareDoc from "./ShareDoc";
import { useState, useEffect, useCallback } from "react";
import api from "../Auth/api";
import { Button } from "@/Components/button";
import { ArrowLeft, FileText, Clock, Users, Download, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger,  DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem} from "@radix-ui/react-dropdown-menu";
import { Input } from "@/Components/input";

type props = {
    docTitle: string;
    docId: string;
    editable: boolean;
    userCount: number;
}

function EditorNavbar({ docTitle, docId, editable, userCount }: props): JSX.Element {
    const { user } = useAuth();
    const [documentTitle, setDocumentTitle] = useState<string>(docTitle);
    const navigate = useNavigate();

    useEffect(() => {
        setDocumentTitle(docTitle);
    }, [docTitle]);



    const renameDocument = useCallback(async (newTitle: string) => {
        try {
            await api.patch(`/api/documents/${docId}/`, { title: newTitle});
            console.log('Document renamed to', newTitle);
        } catch(e){
            console.error(e);
        }
    }, [docId]);



    useEffect(() => {
        const handler = setTimeout(() => {
            if(documentTitle !== docTitle){
                renameDocument(documentTitle);
            }
        }, 800);

        return () => {
            clearTimeout(handler);
        }
    }, [documentTitle, renameDocument, docTitle]);



    return (
        <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left section */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/home/${user.user_id}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <Input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 font-semibold text-base px-2 py-1 h-auto max-w-xs"
                  readOnly={!editable}
                />
              </div>
            </div>

            {/* Center section - Status */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last saved: Just now</span>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Active: {userCount}</span>
              </div>
              <ShareDoc />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Document Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    Make a copy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Version history</DropdownMenuItem>
                  <DropdownMenuItem>Document settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    )
}

export default EditorNavbar;