import type { JSX } from "react";
import { useAuth } from "../../Auth/useAuth";
import { useNavigate } from "react-router-dom";
import ShareDoc from "./ShareDoc";
import { useState, useEffect, useCallback } from "react";
import api from "../../Auth/api";
import { Button } from "@/Components/button";
import { ArrowLeft, FileText, Clock, Users, Download, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger,  DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem} from "@/Components/dropdown";
import { Input } from "@/Components/input";
import Swal from "sweetalert2";
import VersionHistory from "./VersionHistory";
import handleDownload from "../Utils/downloadUtil";
import { useEditor } from "../Provider/useEditor";
import { Titles } from "../types";

function EditorNavbar(): JSX.Element {
  const { userCount, value, docId, isEditable, docTitle, ws } = useEditor();
  const { user } = useAuth();
  const [titles, setTitles] = useState<Titles>({
    curr: docTitle,
    prev: docTitle
  });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  
  const renameDocument = useCallback(async (newTitle: string) => {
      try {
          await api.patch(`/api/documents/${docId}/`, { title: newTitle});

          Swal.fire({
            title: 'Success!',
            text: `Renamed document to "${newTitle}" :)`,
            icon: 'success',
            showConfirmButton: false,
            toast: true,
            timer: 3000,
            position: 'top',
          })

          ws.send(JSON.stringify({ type: 'document_rename', newTitle: newTitle }));
          
      } catch{
          Swal.fire({
            title: 'Error!',
            text: 'Could not rename document :(',
            icon: 'error',
            showConfirmButton: false,
            toast: true,
            timer: 3000,
            position: 'top',
          })
      }
  }, [docId, ws]);

  useEffect(() => {
    setTitles({ curr: docTitle, prev: docTitle });
  }, [docTitle]);


  useEffect(() => {
      const handler = setTimeout(() => {
        if(titles.curr != titles.prev){
          renameDocument(titles.curr);
          setTitles({
            curr: titles.curr,
            prev: titles.curr
          })
        }
        
      }, 2000);

      return () => {
          clearTimeout(handler);
      }
  }, [renameDocument, titles]);



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
                value={titles.curr}
                onChange={(e) => setTitles({
                  curr: e.target.value,
                  prev: titles.prev
                })}
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
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Document Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setOpen(false);
                  handleDownload(value)}}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild onSelect={(e) => {
                    e.preventDefault(); 
                    setOpen(false);
                  }}>
                    <VersionHistory />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default EditorNavbar;