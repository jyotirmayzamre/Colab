import { useEffect, useRef, type RefObject } from "react";
import CRDT from "../CRDT/crdt";
import type { EditorView } from "@uiw/react-codemirror";


export const useDocumentWebSocket = (docId: string | undefined, crdtRef: RefObject<CRDT | null>, editorRef: RefObject<EditorView | null>, 
    setUserCount: React.Dispatch<React.SetStateAction<number>>, setValue: React.Dispatch<React.SetStateAction<string>>
) => {

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if(!docId) return;

        const wsURL = `ws://127.0.0.1:8000/ws/documents/${docId}/`;
        wsRef.current = new WebSocket(wsURL);

        wsRef.current.onopen = () => console.log("Websocket connected");

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            //load CRDT
            if(data.event === 'load.crdt'){
                crdtRef.current!.state = data.crdt
                setValue(data.text);
            }

            //User count
            if(data.event === 'userCount.updated'){
                setUserCount(data.count);
            }

            //CRDT operation
            if(data.event === 'crdt.oper'){
                if(!crdtRef.current) return;
                
                const content = data.content;
            
                const doc = editorRef.current!.state.doc;
                const line = doc.line(content.row + 1); 
                const pos = line.from + content.col;

                if(content.oper == 'Insert'){
                    crdtRef.current.remoteInsert(content.row, content.char);
                    editorRef.current?.dispatch({
                        changes: {from: pos, insert: content.char.value},
                        userEvent: 'remote'
                    })

                } else{
                    crdtRef.current.remoteDelete(content.row, content.char);
                    editorRef.current?.dispatch({
                        changes: {from: pos, to: pos+1},
                        userEvent: 'remote'
                    })
                }
            }

            
        }

        wsRef.current.onclose = () => console.log("WebSocket disconnected")

        return () => {
            wsRef.current?.close();
        };
    }, [docId, crdtRef, editorRef, setUserCount, setValue]);

    return wsRef;
}