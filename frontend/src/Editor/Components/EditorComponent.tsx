import { useEditorMeta, useEditorData } from "../Provider/hooks";
import CodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import { useCallback, useMemo, useRef, useState } from "react";
import { ViewUpdate, EditorView } from '@uiw/react-codemirror';
import { getCursorPos, getChangeObj } from "../Utils/EditorUtils";
import { remoteCursorPlugin } from "./Cursors/CursorViewPlugin";
import { useAuth } from "@/Auth/useAuth";
import { CursorPosition, EditorChange } from "../types";

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


    const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout>();

    const sendCursorUpdate = useCallback((col: number, row: number) => {
        wsRef.current.send(JSON.stringify({
            type: 'cursor_update', 
            username: user.username, 
            col: col, 
            row: row 
        }))

    }, [wsRef, user.username]);

    //only for handling mouse-keyboard related cursors changes
    const onUpdate = useCallback((viewUpdate: ViewUpdate): void => {
        if (viewUpdate.selectionSet && !viewUpdate.docChanged) {
            const newCursorPos = getCursorPos(viewUpdate);
            setCursorPos(newCursorPos);
            
            const isRemote = viewUpdate.transactions.some(tr => tr.isUserEvent('remote'));
            if (!isRemote) {
                if (cursorUpdateTimeoutRef.current) {
                    clearTimeout(cursorUpdateTimeoutRef.current);
                }
                
                cursorUpdateTimeoutRef.current = setTimeout(() => {
                    sendCursorUpdate(newCursorPos.col, newCursorPos.row);
                }, 150);
            }
        }
    }, [setCursorPos, sendCursorUpdate]);



    const onChange = useCallback((val: string, viewUpdate: ViewUpdate): void => {
        setValue(val);
        const newCursorPos = getCursorPos(viewUpdate);
        setCursorPos(newCursorPos);

        const changes: EditorChange[] = getChangeObj(viewUpdate);
        
        if(changes.length == 0) return;

        const isRemote = viewUpdate.transactions[0].isUserEvent('remote');
        const operArray = [];

        if (!isRemote) {
            for(const change of changes){
                if (change.oper === 'Insert') {
                    const char = crdtRef.current.localInsert(change.text, change.row, change.col);
                    const data = {
                        'oper': 'Insert',
                        'char': char,
                        'row': change.row,
                        'col': change.col
                    }
                    operArray.push(data);

                } else {
                    const char = crdtRef.current.localDelete(change.row, change.col);
                    const data = {
                        'oper': 'Delete',
                        'char': char,
                        'row': change.row,
                        'col': change.col
                    }
                    operArray.push(data);

                }   
            }
            wsRef.current.send(JSON.stringify({ type: 'char', data: operArray }));
            sendCursorUpdate(newCursorPos.col, newCursorPos.row);
            
        } else{
            //used for when another user's operations shift the cursor
            sendCursorUpdate(newCursorPos.col, newCursorPos.row);
        }
        
    }, [crdtRef, setCursorPos, wsRef, setValue, sendCursorUpdate]);


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