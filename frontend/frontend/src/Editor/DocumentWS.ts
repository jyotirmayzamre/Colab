import { useEffect, useRef, type RefObject } from "react";
import CRDT from "../CRDT/crdt";
import type { EditorView } from "@uiw/react-codemirror";

export const useDocumentWebSocket = (docId: string | undefined, crdtRef: RefObject<CRDT | null>, editorRef: RefObject<EditorView | null>) => {

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if(!docId) return;

        const wsURL = `ws://localhost:8000/ws/documents/${docId}/`;
        ws.current = new WebSocket(wsURL);

        ws.current.onopen = () => console.log("Websocket connected");

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if(!crdtRef.current) return;

            const line = editorRef.current!.state.doc.line(data.row + 1); 
            const pos = line.from + data.col;

            if(data.oper == 'Insert'){
                crdtRef.current.remoteInsert(data.row, data.char);
                editorRef.current?.dispatch({
                    changes: {from: pos, insert: data.char.value},
                    userEvent: 'remote'
                })

            } else{
                crdtRef.current.remoteDelete(data.row, data.char);
                editorRef.current?.dispatch({
                    changes: {from: pos, to: pos+1},
                    userEvent: 'remote'
                })
            }
        }

        ws.current.onclose = () => console.log("WebSocket disconnected")

        return () => {
            ws.current?.close();
        };
    }, [docId, crdtRef, editorRef]);

    return ws;
}