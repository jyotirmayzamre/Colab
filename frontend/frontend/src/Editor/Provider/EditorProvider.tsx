import { useAuth } from "@/Auth/useAuth";
import CRDT from "@/CRDT/crdt";
import { type ReactNode, useEffect, useRef, useState, useCallback, useMemo } from "react"
import type { EditorView } from "@uiw/react-codemirror";
import { crdtToString } from "@/CRDT/utils";
import { EditorContext } from "./useEditor";

interface Props {
    children: ReactNode,
    docId: string,
    isEditable: boolean,
    title: string
}

export const EditorProvider = ({ children, docId, isEditable, title }: Props) => {
    const { user } = useAuth();

    //State
    const [value, setValue] = useState<string>('');
    const [cursorPos, setCursorPos] = useState({'col': 0, 'row': 0});
    const [userCount, setUserCount] = useState<number>(0);
    const [docTitle, setDocTitle] = useState<string>(title);
    const [remoteCursors, setRemoteCursors] = useState<Record<string, { col: number, row: number, colour: string }>>({});
    const [colour, setColour] = useState<string>('');

    //Refs
    const crdtRef = useRef<CRDT | null>(null);
    if(!crdtRef.current && user){
        crdtRef.current = new CRDT(user.site_id);
    }

    const editorRef = useRef<EditorView | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if(!docId) return;

        const wsURL = `ws://localhost:8000/ws/documents/${docId}?username=${user.username}`;
        wsRef.current = new WebSocket(wsURL);

        wsRef.current.onopen = () => console.log("Websocket connected");
        
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch(data.event){
                case 'load.crdt':
                    crdtRef.current.state = data.state;
                    setValue(crdtToString(data.state));
                    setColour(data.colour);
                    break;

                case 'cursor.update':
                    setTimeout(() => {
                        setRemoteCursors(prev => ({
                            ...prev,
                            [data.username]: {colour: data.colour, col: data.col, row: data.row}
                        }))
                    }, 0);
                    break;

                case 'version.restore':
                    crdtRef.current.state = data.state;
                    setValue(crdtToString(data.state));
                    break;

                case 'document.rename': 
                    setDocTitle(data.newTitle);
                    break;

                case 'userCount.updated':
                    setUserCount(data.count);
                    break;
                
                case 'crdt.oper': {
                    const content = data.content;
                    const doc = editorRef.current!.state.doc;
                    const line = doc.line(content.row + 1); 
                    const pos = line.from + content.col;

                    if(content.oper == 'Insert'){
                        crdtRef.current.remoteInsert(content.row, content.char);
                        editorRef.current.dispatch({
                            changes: {from: pos, insert: content.char.value},
                            userEvent: 'remote'
                        })

                    } else{
                        crdtRef.current.remoteDelete(content.row, content.char);
                        editorRef.current.dispatch({
                            changes: {from: pos, to: pos+1},
                            userEvent: 'remote'
                        })
                    }
                    break;
                }

                default:
                    console.log('Unexpected message') 
            }
        }
        wsRef.current.onclose = () => console.log("WebSocket disconnected")

        return () => {
            wsRef.current.close();
        };
    }, [docId, crdtRef, editorRef, setUserCount, setValue, user.username]);

    //methods
    
    const setEditorRef = useCallback((view: EditorView) => {
        editorRef.current = view;
    }, []);

    const contextValue = useMemo(
        () => ({
            value,
            cursorPos,
            docTitle,
            colour,
            userCount,
            isEditable,
            docId,
            remoteCursors,
            crdt: crdtRef.current,
            editor: editorRef.current,
            ws: wsRef.current,
            setRemoteCursors,
            setCursorPos,
            setValue,
            setEditorRef,
            setDocTitle
        }),
        [value, colour, remoteCursors, docTitle, docId, cursorPos, userCount, isEditable, setEditorRef]
    );

    return (
        <EditorContext.Provider value={contextValue}>
            {children}
        </EditorContext.Provider>
    );

    
}