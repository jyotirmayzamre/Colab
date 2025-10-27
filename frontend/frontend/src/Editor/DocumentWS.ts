import { useEffect, useRef, type RefObject } from "react";
import CRDT from "../CRDT/crdt";
import type { EditorView } from "@uiw/react-codemirror";


export const useDocumentWebSocket = (docId: string | undefined, crdtRef: RefObject<CRDT | null>, editorRef: RefObject<EditorView | null>, 
    setUserCount: React.Dispatch<React.SetStateAction<number>>, setValue: React.Dispatch<React.SetStateAction<string>>
) => {

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if(!docId) return;

        const wsURL = `ws://127.0.0.1:8000/ws/documents/${docId}/`;
        ws.current = new WebSocket(wsURL);

        ws.current.onopen = () => console.log("Websocket connected");

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            //load CRDT
            if(data.event === 'Load'){
                crdtRef.current!.state = data.crdt
                setValue(data.text);
            }

            //User count
            if(data.event === 'userCount_updated'){
                setUserCount(data.count);
            }

            console.log(data.event)
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

        ws.current.onclose = () => console.log("WebSocket disconnected")

        return () => {
            ws.current?.close();
        };
    }, [docId, crdtRef, editorRef, setUserCount, setValue]);

    return ws;
}