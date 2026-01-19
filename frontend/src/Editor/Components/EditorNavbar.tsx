import type { JSX } from "react";
import { useAuth } from "../../Auth/useAuth";
import { useNavigate } from "react-router-dom";
import ShareDoc from "./ShareDoc";
import { useState, useEffect, useCallback } from "react";
import api from "../../Auth/api";
import { Button } from "@/Components/button";
import { ArrowLeft, FileText, Clock, Users, Download, MoreVertical, History, User2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger,  DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem} from "@/Components/dropdown";
import { Input } from "@/Components/input";
import VersionHistory from "./VersionHistory";
import handleDownload from "../Utils/downloadUtil";
import { useEditorMeta } from "../Provider/hooks";
import Permissions from "./Permissions";
import useProfiler from "../profiler";
import { sendNotif } from "@/lib/utils";

const dropdownClass = `relative flex cursor-default select-none items-center rounded-sm
                        px-2 py-1.5 text-sm outline-none transition-colors
                        hover:bg-accent hover:text-accent-foreground
                        focus:bg-accent focus:text-accent-foreground m-0`

function EditorNavbar(): JSX.Element {
    const { userCount, docId, isEditable, docTitle, editorRef, wsRef } = useEditorMeta();
    const { user } = useAuth();
    const [localTitle, setLocalTitle] = useState<string>(docTitle);
    const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
    const [showPermissions, setShowPermissions] = useState<boolean>(false);
    const navigate = useNavigate();

    //useProfiler('Editor Navbar');

    
    const renameDocument = useCallback(async (newTitle: string) => {
        try {
            await api.patch(`/api/documents/${docId}/`, { title: newTitle});
            sendNotif('success', `Renamed document to "${newTitle}"`)
            wsRef.current.send(JSON.stringify({ type: 'document_rename', newTitle: newTitle }));
            
        } catch(e){
            console.error(e);
            sendNotif('error', 'Could not rename document :(');
        }
    }, [docId, wsRef]);

    useEffect(() => {
      if(localTitle != docTitle){
        setLocalTitle(docTitle);
      }
      
    }, [docTitle, localTitle]);


    useEffect(() => {
        const handler = setTimeout(() => {
          if(localTitle != docTitle){
            renameDocument(localTitle);
          }
          
        }, 2000);

        return () => {
            clearTimeout(handler);
        }
    }, [renameDocument, docTitle, localTitle]);

    const handleCloseVersionHistory = useCallback(() => {
        setShowVersionHistory(false);
    }, []);

    const handleClosePermissions = useCallback(() => {
        setShowPermissions(false);
    }, []);



    return (
        <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
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
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 font-semibold text-base px-2 py-1 h-auto max-w-xs"
                  readOnly={!isEditable}
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Autosave is on</span>
            </div>

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
                  <DropdownMenuItem onClick={() => {
                    handleDownload(editorRef.current.state.doc.toString())}}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setShowVersionHistory(true)} className={dropdownClass}> 
                    <History className='mr-2 h-4 w-4' /> 
                    Version History      
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isEditable && (
                    <DropdownMenuItem onSelect={() => setShowPermissions(true)} className={dropdownClass}>
                      <User2 className='mr-2 h-4 w-4' />
                      Document Permissions
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <VersionHistory
          open={showVersionHistory}
          onClose={handleCloseVersionHistory}
        />
        <Permissions
          open={showPermissions}
          onClose={handleClosePermissions}
        />
      </nav>

    )
}

export default EditorNavbar;

