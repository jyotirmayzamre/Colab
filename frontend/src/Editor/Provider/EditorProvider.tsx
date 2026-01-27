import { useAuth } from "@/Auth/useAuth";
import CRDT from "@/CRDT/crdt";
import { type ReactNode, useEffect, useRef, useState, useMemo } from "react"
import type { EditorView } from "@uiw/react-codemirror";
import { crdtToString } from "@/CRDT/utils";
import { EditorDataContext, EditorMetaContext } from "./hooks";
import { RemoteCursor } from "../types";

interface Props {
    children: ReactNode,
    docId: string,
    isEditable: boolean,
}


export const EditorProvider = ({ children, docId, isEditable }: Props) => {
    const { user } = useAuth();

    //State
    const [value, setValue] = useState<string>('');
    const [userCount, setUserCount] = useState<number>(0);
    const [docTitle, setDocTitle] = useState<string>('');
    const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});

    //Refs
    const crdtRef = useRef<CRDT>(new CRDT(user.site_id));
    const editorRef = useRef<EditorView | undefined>(undefined);
    const wsRef = useRef<WebSocket | undefined>(undefined);

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
                    setUserCount(data.user_count);
                    setDocTitle(data.title);
                    break;

                case 'cursor.update':
                    setTimeout(() => {
                        setRemoteCursors(prev => ({
                            ...prev,
                            [data.username]: {colour: data.colour, col: data.col, row: data.row}
                        }))
                    }, 0);
                    break;

                case 'cursor.remove':
                    setTimeout(() => {
                        setRemoteCursors(prev => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { [data.username]: _, ...rest} = prev;
                            return rest
                        })
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
                    setUserCount(data.user_count);
                    break;
                
                case 'crdt.oper': {
                    const content = data.content;
                    const doc = editorRef.current.state.doc;
                    const changes = [];
                    for(const change of content.data){
                        const line = doc.line(change.row + 1); 
                        const pos = line.from + change.col;

                        //handle remote changes
                        if(change.oper === 'Insert'){
                            crdtRef.current.remoteInsert(change.row, change.char);
                            changes.push({from: pos, insert: change.char.value});
                        } else{
                            crdtRef.current.remoteDelete(change.row, change.char);
                            changes.push({from: pos, to: pos+1});
                        }
                    }
                    
                    if(changes.length > 0){
                        editorRef.current.dispatch({
                            changes: changes,
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
    }, [docId, user.username]);

    //methods
    
    const setEditorRef = (view: EditorView) => {
        editorRef.current = view;
    };

    const dataValue = useMemo(
        () => ({
            value,
            remoteCursors,
            setValue
        }),
        [remoteCursors, value]
    );

    const metaValue = useMemo(
        () => ({
            docTitle,
            userCount,
            isEditable,
            docId,
            crdtRef,
            editorRef,
            wsRef,
            setEditorRef,
            setDocTitle
        }),
        [docId, docTitle, isEditable, userCount]
    )



    return (
        <EditorMetaContext.Provider value={metaValue}>
            <EditorDataContext.Provider value={dataValue}>
                {children} 
            </EditorDataContext.Provider>
        </EditorMetaContext.Provider>
    );

    
}