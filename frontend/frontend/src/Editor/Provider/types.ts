import CRDT from "@/CRDT/crdt";
import type { EditorView } from "@uiw/react-codemirror";

export interface EditorContextType {
    value: string,
    title: string,
    docId: string,
    cursorPos: {row: number, col: number}
    userCount: number
    isEditable: boolean
    crdt: CRDT
    editor: EditorView
    ws: WebSocket
    setCursorPos: React.Dispatch<React.SetStateAction<{col: number; row: number;}>>
    setValue: React.Dispatch<React.SetStateAction<string>>
    setEditorRef: (view: EditorView) => void
}