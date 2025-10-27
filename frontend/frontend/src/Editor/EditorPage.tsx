import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import CodeMirror, { EditorSelection, EditorView, ViewUpdate } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import CRDT from "../CRDT/crdt";
import { useAuth } from "../Auth/useAuth";
import { useParams } from "react-router-dom";
import type { Char } from "../CRDT/utils";
import { type Change, getCursorPos, getChangeObj } from "./EditorUtils";
import { useDocumentWebSocket } from "./DocumentWS";
import EditorNavbar from "./EditorNavbar";
import api from "../Auth/api";



function EditorPage(): JSX.Element {
    const params = useParams();
    const { user } = useAuth();

    const [value, setValue] = useState<string>('');
    const [pos, setPos] = useState({'col': 0, 'row': 0});
    const [docTitle, setDocTitle] = useState<string>('');
    const [editable, setEditable] = useState<boolean>(true);
    const [userCount, setUserCount] = useState<number>(0);
    
    const crdt = useRef<CRDT | null>(null);
    if(!crdt.current && user) crdt.current = new CRDT(user.site_id);
    const editorViewRef = useRef<EditorView | null>(null);
    const ws = useDocumentWebSocket(params.docId, crdt, editorViewRef, setUserCount, setValue);


    useEffect(() => {
        const fetchDoc = async () => {
            try{
                const response = await api.get(`/api/documents/${params.docId}/`);
                setDocTitle(response.data.title);
                setEditable(response.data.access !== 'viewer')
            } catch(err){
                console.error(err);
            }
        }

        fetchDoc();


    }, [params])    
    


    const onChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        setValue(val);
        setPos(getCursorPos(viewUpdate));
        const crdtRef = crdt.current;
        if(!crdtRef) return;
        const change: Change | null = getChangeObj(viewUpdate);
        if(!change) return;

        const isRemote = viewUpdate.transactions[0].isUserEvent('remote');
        if(!isRemote){
            if(change?.oper == 'Insert'){
                const char: Char = crdtRef.localInsert(change.text, change.row, change.col);
                const data = JSON.stringify({oper: 'Insert', char: char, row: change.row, col: change.col})
                ws.current?.send(data);
            } else{
                const char: Char = crdtRef.localDelete(change!.row, change!.col);
                const data = JSON.stringify({oper: 'Delete', char: char, row: change.row, col: change.col})
                ws.current?.send(data);
            }
        }
        
    }, [ws]);

    return (
        <div className="flex flex-col justify-baseline h-screen items-center gap-2 bg-[rgb(249,251,253)]">
            <EditorNavbar docTitle={ docTitle } docId={ params.docId! } editable={ editable }/>
            <CodeMirror value={value} height="550px" width="900px" onChange={onChange} theme={basicLight}
                basicSetup={ {lineNumbers: true} }
                selection={EditorSelection.cursor(0)}
                autoFocus={true}
                onCreateEditor={(view) => {
                    editorViewRef.current = view;
                }}
                placeholder={'Start typing here!'}
                editable={editable}
            />
            <p>{pos.row}:{pos.col}</p>
            <p>Active users: {userCount}</p>
        </div>
        
    )
}

export default EditorPage;