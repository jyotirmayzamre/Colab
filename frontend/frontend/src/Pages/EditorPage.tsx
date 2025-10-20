import { useCallback, useState, type JSX } from "react";
import CodeMirror, { EditorSelection, ViewUpdate } from '@uiw/react-codemirror';
import { basicLight } from "@uiw/codemirror-theme-basic";

type Change = {
    oper: 'Insert' | 'Delete';
    text: string;
    row: number;
    col: number;
}


function EditorPage(): JSX.Element {
    const [value, setValue] = useState<string>('');
    const [pos, setPos] = useState({'col': 0, 'row': 0});


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
                    obj = {oper: 'Delete', text: deletedChar, row: row, col: col}
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
        const change: Change | null = parseChange(viewUpdate);
        console.log(change ? change : 'null');
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