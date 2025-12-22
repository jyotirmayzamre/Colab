import { useEditor } from "../Provider/useEditor";
import CodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import { useCallback } from "react";
import { ViewUpdate } from '@uiw/react-codemirror';
import { type Change, getCursorPos, getChangeObj } from "../Utils/EditorUtils";
import type { Char } from "../../CRDT/utils";

function EditorComponent(){
    const { cursorPos, value, setCursorPos, setValue, setEditorRef, isEditable, ws, crdt } = useEditor(); 


    const onChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        setValue(val);
        setCursorPos(getCursorPos(viewUpdate));

        const change: Change | null = getChangeObj(viewUpdate);
        if (!change) return;

        const isRemote = viewUpdate.transactions[0].isUserEvent('remote');

        if (!isRemote) {
            if (change.oper === 'Insert') {
                const char: Char = crdt.localInsert(change.text, change.row, change.col);
                const data = JSON.stringify({
                    type: 'char',
                    oper: 'Insert',
                    char: char,
                    row: change.row,
                    col: change.col
                });
                ws.send(data);
            } else {
                const char: Char = crdt.localDelete(change.row, change.col);
                const data = JSON.stringify({
                    type: 'char',
                    oper: 'Delete',
                    char: char,
                    row: change.row,
                    col: change.col
                });
                ws.send(data);
            }
        }
    }, [crdt, setCursorPos, ws, setValue]);

    return (
         <div className="flex-1 bg-muted/20">
            <div className="container max-w-5xl mx-auto py-8 px-4">
                <div className="bg-background rounded-lg shadow-lg border border-border min-h-[calc(100vh-12rem)] text-left">
                    <CodeMirror value={value} height="550px"  onChange={onChange} theme={basicLight}
                        basicSetup={ {lineNumbers: true} }
                        selection={EditorSelection.cursor(0)}
                        autoFocus={true}
                        onCreateEditor={(view) => {
                            setEditorRef(view);
                        }}
                        placeholder={'Start typing here!'}
                        editable={isEditable}
                    />
                </div>
                <p>{cursorPos.row}:{cursorPos.col}</p>
            </div>
        </div>
    )
}

export default EditorComponent;