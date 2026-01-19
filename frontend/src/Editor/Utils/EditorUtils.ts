import { ViewUpdate } from "@uiw/react-codemirror";
import { EditorChange, CursorPosition } from "../types";

export const getCursorPos = (viewUpdate: ViewUpdate): CursorPosition => {
    const selection = viewUpdate.state.selection.main;
    const line = viewUpdate.state.doc.lineAt(selection.head);
    
    return {
        col: selection.head - line.from,
        row: line.number - 1
    };
}



export const getChangeObj = (viewUpdate: ViewUpdate): EditorChange[] | null => {
    const oldDoc = viewUpdate.startState.doc;
    const newDoc = viewUpdate.state.doc;
    const objects: EditorChange[] = [];
    viewUpdate.changes.iterChanges((fromA, toA, fromB, toB) => {

        //delete
        if(fromB == toB){
            const deletedText = oldDoc.sliceString(fromA, toA);
            for(let i = deletedText.length-1; i >= 0; i--){
                const deletedChar = deletedText[i];
                const pos = fromA + i;
                const oldLine = oldDoc.lineAt(pos);
                const row = oldLine.number - 1;
                const col = pos - oldLine.from;
                objects.push({
                    oper: 'Delete', 
                    text: deletedChar, 
                    row: row, 
                    col: col
                })
            }

        //insert
        } else if (fromA == toA){
            const insertedText = newDoc.sliceString(fromB, toB);
            for(let i = 0; i < insertedText.length; i++){
                const insertedChar = insertedText[i];
                const pos = fromB + i;
                const newLine = newDoc.lineAt(pos);
                const row = newLine.number - 1;
                const col = pos - newLine.from;
                objects.push({
                    oper: 'Insert',
                    text: insertedChar,
                    row: row,
                    col: col
                })
            }
        } 
    }, true);
    return objects;
}