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

    //Refs
    const crdtRef = useRef<CRDT | null>(null);
    if(!crdtRef.current && user){
        crdtRef.current = new CRDT(user.site_id);
    }

    const editorRef = useRef<EditorView | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if(!docId) return;

        const wsURL = `ws://localhost:8000/ws/documents/${docId}/`;
        wsRef.current = new WebSocket(wsURL);

        wsRef.current.onopen = () => console.log("Websocket connected");
        
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            //load CRDT
            if(data.event === 'load.crdt'){
                crdtRef.current.state = data.state
                setValue(crdtToString(data.state));
            }

            //restore version
            if(data.event == 'version.restore'){
                crdtRef.current.state = data.state;
                setValue(crdtToString(data.state));
            }

            //User count
            if(data.event === 'userCount.updated'){
                setUserCount(data.count);
            }

            //CRDT operation
            if(data.event === 'crdt.oper'){
                
                
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
            }

            
        }

        wsRef.current.onclose = () => console.log("WebSocket disconnected")

        return () => {
            wsRef.current.close();
        };
    }, [docId, crdtRef, editorRef, setUserCount, setValue]);

    //methods

   

    const setEditorRef = useCallback((view: EditorView) => {
        editorRef.current = view;
    }, []);

    const contextValue = useMemo(
        () => ({
            value,
            cursorPos,
            title,
            userCount,
            isEditable,
            docId,
            crdt: crdtRef.current,
            editor: editorRef.current,
            ws: wsRef.current,
            setCursorPos,
            setValue,
            setEditorRef,
        }),
        [value,title,  docId, cursorPos, userCount, isEditable, setEditorRef]
    );

    return (
        <EditorContext.Provider value={contextValue}>
            {children}
        </EditorContext.Provider>
    );

    
}