import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import CodeMirror, { EditorSelection, ViewUpdate } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import CRDT from "../CRDT/crdt";
import { useAuth } from "../Auth/useAuth";
import { useParams } from "react-router-dom";
import type { Char } from "../CRDT/utils";
import { type Change, getCursorPos, getChangeObj } from "./EditorUtils";




function EditorPage(): JSX.Element {
    const params = useParams();
    const [value, setValue] = useState<string>('');
    const [pos, setPos] = useState({'col': 0, 'row': 0});
    const { user } = useAuth();
    const crdt = useRef<CRDT | null>(null);
    const ws = useRef<WebSocket | null>(null);

    if(!crdt.current && user) crdt.current = new CRDT(user.site_id);


    const onChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        setValue(val);
        setPos(getCursorPos(viewUpdate));
        const crdtRef = crdt.current;
        if(!crdtRef) return;
        const change: Change | null = getChangeObj(viewUpdate);
        if(!change) return;


        if(change?.oper == 'Insert'){
            const char: Char = crdtRef.localInsert(change.text, change.row, change.col);
            sendMessage({oper: 'Insert', char: char, row: change.row, col: change.col});
        } else{
            const char: Char = crdtRef.localDelete(change!.row, change!.col);
            sendMessage({oper: 'Delete', char: char, row: change.row, col: change.col});
        }
    }, []);

    

    useEffect(() => {
        const wsURL = `ws://localhost:8000/ws/documents/${params.docId}/`;
        ws.current = new WebSocket(wsURL);
        const crdtRef = crdt.current;

        ws.current.onopen = () => {
            console.log("Websocket connected");
        }

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.oper == 'Insert'){
                crdtRef?.remoteInsert(data.row, data.char);

            } else{
                crdtRef?.remoteDelete(data.row, data.char);
            }
        }

        ws.current.onclose = () => {
            console.log("WebSocket disconnected")
        };

        return () => {
            ws.current!.close()
        }
    }, [params.docId])

    const sendMessage = (msg: {oper: string, char: Char, row: number, col: number}) => {
        ws.current!.send(JSON.stringify(msg));
    }


    return (
        <div className="flex flex-col justify-center items-center">
            <CodeMirror value={value} height="500px" width="500px" onChange={onChange} theme={basicLight}
            basicSetup={ {lineNumbers: true} }
            selection={EditorSelection.cursor(0)}
            autoFocus={true}
        />
            <p>{pos.row}:{pos.col}</p>
        </div>
        
    )
}

export default EditorPage;