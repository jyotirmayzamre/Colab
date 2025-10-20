import { useCallback, useRef, useState, type JSX } from "react";
import CodeMirror, { EditorSelection, ViewUpdate } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";
import CRDT from "../CRDT/crdt";
import { useAuth } from "../Auth/useAuth";

type Change = {
    oper: 'Insert' | 'Delete';
    text: string;
    row: number;
    col: number;
}


function EditorPage(): JSX.Element {
    const [value, setValue] = useState<string>('');
    const [pos, setPos] = useState({'col': 0, 'row': 0});
    const { user } = useAuth();
    const crdt = useRef<CRDT | null>(null);

    if(!crdt.current && user) crdt.current = new CRDT(user.site_id);


    const setCursorPos = (viewUpdate: ViewUpdate) => {
        viewUpdate.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            const line = viewUpdate.state.doc.lineAt(toB);
            setPos({'col': line.to - line.from, 'row': line.number - 1});
        }, true);
    }

    const parseChange = (viewUpdate: ViewUpdate): Change | null => {
        const oldDoc = viewUpdate.startState.doc;
        const newDoc = viewUpdate.state.doc;
        let obj: Change | null = null;
        viewUpdate.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            if(inserted.text.length !== 2){
                if(inserted.length === 0){
                    const deletedChar = oldDoc.sliceString(fromA, toA);
                    const oldLine = oldDoc.lineAt(fromA);
                    const row = oldLine.number - 1;
                    const col = fromA - oldLine.from;
                    obj = deletedChar !== '\n' ? {oper: 'Delete', text: deletedChar, row: row, col: col} : null;
                } else {
                    const newLine = newDoc.lineAt(fromB);
                    const row = newLine.number - 1;
                    const col = fromB - newLine.from;
                    obj = {oper: 'Insert', text: inserted.text[0], row: row, col: col};
                }
            }
            
        }, true);
        return obj;
    }


    const onChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        setValue(val);
        setCursorPos(viewUpdate);
        const crdtRef = crdt.current;
        if(!crdtRef) return;
        const change: Change | null = parseChange(viewUpdate);
        if(!change) return;

        if(change?.oper == 'Insert'){
            crdtRef.localInsert(change.text, change.row, change.col);
        } else{
            crdtRef.localDelete(change!.row, change!.col);
        }
        console.log(crdtRef.store);
    }, []);



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