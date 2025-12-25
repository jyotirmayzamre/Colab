import { ViewUpdate } from "@uiw/react-codemirror";

export const getCursorPos = (viewUpdate: ViewUpdate): {col: number, row: number} => {
    const selection = viewUpdate.state.selection.main;
    const line = viewUpdate.state.doc.lineAt(selection.head);
    
    return {
        col: selection.head - line.from,
        row: line.number - 1
    };
}

export type Change = {
    oper: 'Insert' | 'Delete';
    text: string;
    row: number;
    col: number;
}

export const getChangeObj = (viewUpdate: ViewUpdate): Change | null => {
    const oldDoc = viewUpdate.startState.doc;
    const newDoc = viewUpdate.state.doc;
    let obj: Change | null = null;
    viewUpdate.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            if(inserted.length === 0){
                const deletedChar = oldDoc.sliceString(fromA, toA);
                const oldLine = oldDoc.lineAt(fromA);
                const row = oldLine.number - 1;
                const col = fromA - oldLine.from;
                obj = {oper: 'Delete', text: deletedChar, row: row, col: col};
            } else {
                const newLine = newDoc.lineAt(fromB);
                const row = newLine.number - 1;
                const col = fromB - newLine.from;
                obj = {oper: 'Insert', text: inserted.text.length !== 2 ? inserted.text[0] : '\n', row: row, col: col};
            }
        
    }, true);
    return obj;
}