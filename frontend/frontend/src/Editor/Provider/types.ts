import CRDT from "@/CRDT/crdt";
import type { EditorView } from "@uiw/react-codemirror";

export interface EditorContextType {
    value: string
    docTitle: string
    docId: string
    cursorPos: {row: number, col: number}
    colour: string
    userCount: number
    isEditable: boolean
    crdt: CRDT
    editor: EditorView
    ws: WebSocket
    remoteCursors: Record<string, {col: number, row: number, colour: string}>
    setRemoteCursors: React.Dispatch<React.SetStateAction<Record<string, {col: number; row: number; colour: string}>>>
    setCursorPos: React.Dispatch<React.SetStateAction<{col: number; row: number;}>>
    setValue: React.Dispatch<React.SetStateAction<string>>
    setEditorRef: (view: EditorView) => void,
    setDocTitle: React.Dispatch<React.SetStateAction<string>>
}