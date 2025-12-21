import { useCallback, useRef, useState, type JSX } from "react";
import CodeMirror, { EditorSelection, EditorView, ViewUpdate } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import CRDT from "../CRDT/crdt";
import { useAuth } from "../Auth/useAuth";
import { useParams } from "react-router-dom";
import type { Char } from "../CRDT/utils";
import { type Change, getCursorPos, getChangeObj } from "./EditorUtils";
import { useDocumentWebSocket } from "./DocumentWS";
import EditorNavbar from "./EditorNavbar";
import { useSearchParams } from "react-router-dom";


function EditorPage(): JSX.Element {
    const params = useParams();
    const { user } = useAuth();
    const [docAttribs] = useSearchParams();
    const title = docAttribs.get('title');
    const isEditable: boolean = JSON.parse(docAttribs.get('isEditable').toLowerCase());
    

    const [value, setValue] = useState<string>('');
    const [pos, setPos] = useState({'col': 0, 'row': 0});
    const [userCount, setUserCount] = useState<number>(0);
    
    const crdtRef = useRef<CRDT | null>(null);
    if(!crdtRef.current && user) crdtRef.current = new CRDT(user.site_id);

    const editorRef = useRef<EditorView | null>(null);
    const wsRef = useDocumentWebSocket(params.docId, crdtRef, editorRef, setUserCount, setValue);

 
    
    const onChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        setValue(val);
        setPos(getCursorPos(viewUpdate));

        const ws: WebSocket = wsRef.current;
        
        const crdt = crdtRef.current;
        if(!crdt) return;

        const change: Change | null = getChangeObj(viewUpdate);
        if(!change) return;

        const isRemote = viewUpdate.transactions[0].isUserEvent('remote');

        //send local operations to rest of the group (not remote operations)
        if(!isRemote){
            if(change.oper == 'Insert'){
                const char: Char = crdt.localInsert(change.text, change.row, change.col);
                const data = JSON.stringify({type: 'char', oper: 'Insert', char: char, row: change.row, col: change.col})
                ws.send(data);
            } else{
                const char: Char = crdt.localDelete(change!.row, change!.col);
                const data = JSON.stringify({type: 'char', oper: 'Delete', char: char, row: change.row, col: change.col})
                ws.send(data);
            }
        }
        
    }, [wsRef]);



    return (
        <div className="min-h-screen flex flex-col">
            <EditorNavbar docTitle={title} docId={params.docId!} editable={isEditable} userCount={userCount} value={value} crdtRef={crdtRef}/>
            <div className="flex-1 bg-muted/20">
                <div className="container max-w-5xl mx-auto py-8 px-4">
                    <div className="bg-background rounded-lg shadow-lg border border-border min-h-[calc(100vh-12rem)] text-left">
                        <CodeMirror value={value} height="550px"  onChange={onChange} theme={basicLight}
                            basicSetup={ {lineNumbers: true} }
                            selection={EditorSelection.cursor(0)}
                            autoFocus={true}
                            onCreateEditor={(view) => {
                                editorRef.current = view;
                            }}
                            placeholder={'Start typing here!'}
                            editable={isEditable}
                        />
                    </div>
                    <p>{pos.row}:{pos.col}</p>
                </div>
            </div>
        </div>
        
    )
}

export default EditorPage;