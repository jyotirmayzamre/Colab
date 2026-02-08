import { useEditorMeta, useEditorData } from "../Provider/hooks";
import CodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import { useCallback, useMemo, useRef, useState } from "react";
import { ViewUpdate, EditorView } from '@uiw/react-codemirror';
import { getCursorPos, getChangeObj } from "../Utils/EditorUtils";
import { remoteCursorPlugin } from "./Cursors/CursorViewPlugin";
import { useAuth } from "@/Auth/useAuth";
import { CursorPosition, EditorChange } from "../types";
import CRDT from "@/CRDT/crdt";
import { Char } from "@/CRDT/utils";

const editorPadding = EditorView.theme({
    ".cm-content": {
        paddingTop: "24px" 
    }
});



function EditorComponent(){
    const { user } = useAuth();
    const [cursorPos, setCursorPos] = useState<CursorPosition>({'col': 0, 'row': 0});
    const { value, remoteCursors, setValue } = useEditorData();
    const { isEditable, editorRef, setEditorRef, wsRef, crdtRef } = useEditorMeta(); 

    const lastCursorRef = useRef<number>(0);
    const pendingCursorRef = useRef<CursorPosition | null>(null);
    const cursorTimerRef = useRef<NodeJS.Timeout | null>(null); 


    const sendCursorUpdate = useCallback((col: number, row: number) => {
        wsRef.current.send(JSON.stringify({
            type: 'cursor_update', 
            username: user.username, 
            col: col, 
            row: row 
        }))
    }, [wsRef, user.username]);



    const throttledSendCursor = useCallback((cursor: CursorPosition) => {
        const now = Date.now();
        const elapsed = now - lastCursorRef.current;
        pendingCursorRef.current = cursor;

        if(elapsed >= 50){
            lastCursorRef.current = now;
            sendCursorUpdate(cursor.col, cursor.row);
            pendingCursorRef.current = null;
        } else if (!cursorTimerRef.current){
            cursorTimerRef.current = setTimeout(() => {
                const latest = pendingCursorRef.current;
                if(latest){
                    lastCursorRef.current = Date.now();
                    sendCursorUpdate(latest.col, latest.row);
                    pendingCursorRef.current = null;
                }
                cursorTimerRef.current = null;
            }, 50-elapsed)
        }
    }, [sendCursorUpdate])



    

    
    //only for handling mouse-keyboard related cursors changes
    const onUpdate = useCallback((viewUpdate: ViewUpdate): void => {
        if (viewUpdate.selectionSet && !viewUpdate.docChanged) {
            const isRemote = viewUpdate.transactions.some(tr => tr.isUserEvent('remote'));
            if(isRemote) return;

            const pos = getCursorPos(viewUpdate);
            setCursorPos(pos);
            throttledSendCursor(pos);

        }
    }, [setCursorPos, throttledSendCursor]);


    const processOperation = (change: EditorChange, crdtRef: React.MutableRefObject<CRDT>) => {

        const char: Char = change.oper === 'Insert'
            ? crdtRef.current.localInsert(change.text, change.row, change.col)
            : crdtRef.current.localDelete(change.row, change.col);
       
        return {
            'oper': change.oper,
            'char': char,
            'row': change.row,
            'col': change.col
        }
    }



    const onChange = useCallback((val: string, viewUpdate: ViewUpdate): void => {
        setValue(val);
        const newCursorPos = getCursorPos(viewUpdate);
        setCursorPos(newCursorPos);

        const changes: EditorChange[] = getChangeObj(viewUpdate);
        
        if(changes.length == 0) return;

        const isRemote = viewUpdate.transactions[0].isUserEvent('remote');
       
        if (!isRemote) {
            const operArray = [];
            for(const change of changes){
                const data = processOperation(change, crdtRef);
                operArray.push(data);
            }
            wsRef.current.send(JSON.stringify({ type: 'char', data: operArray }));
        }
        throttledSendCursor(newCursorPos);
        
    }, [crdtRef, setCursorPos, wsRef, setValue, throttledSendCursor]);


    const remoteCursorList = useMemo(() => {
        if (!editorRef.current) return []

        const doc = editorRef.current.state.doc

        return Object.entries(remoteCursors)
            .filter(([username]) => username !== user.username)
            .map(([username, cur]) => {
                const line = doc.line(cur.row + 1);
                const pos = line.from + cur.col;
                return {
                    pos: pos,
                    colour: cur.colour,
                    username: username
                }
            })
        }, [remoteCursors, editorRef, user.username])

    return (
         <div className="flex-1 bg-muted/20">
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="bg-background rounded-lg shadow-lg border border-border min-h-[calc(100vh-12rem)] text-left">
                    <CodeMirror value={value} height="550px"  
                        onChange={onChange} 
                        onUpdate={onUpdate}
                        theme={basicLight}
                        basicSetup={ {lineNumbers: true} }
                        selection={EditorSelection.cursor(0)}
                        extensions={[
                            remoteCursorPlugin(() => remoteCursorList),
                            editorPadding
                        ]}
                        autoFocus={true}
                        onCreateEditor={(view) => {
                            setEditorRef(view);
                        }}
                        editable={isEditable}
                    />
                </div>
                <p>{cursorPos.row}:{cursorPos.col}</p>
            </div>
        </div>
    )
}

export default EditorComponent;