export interface CursorPosition {
    col: number;
    row: number;
}


export interface RemoteCursor {
    col: number;
    row: number;
    colour: string;
}

export type EditorChange = {
    oper: 'Insert' | 'Delete';
    text: string;
    row: number;
    col: number;
}

import CRDT from "@/CRDT/crdt";
import type { EditorView } from "@uiw/react-codemirror";

export interface EditorContextType {
    value: string
    docTitle: string
    docId: string
    userCount: number
    isEditable: boolean
    crdt: CRDT
    editor: EditorView
    ws: WebSocket
    remoteCursors: Record<string, RemoteCursor>
    setValue: React.Dispatch<React.SetStateAction<string>>
    setEditorRef: (view: EditorView) => void,
}

export interface Version {
    id: number;
    title: string;
    created_at: string;
    creator_username: string;
}

export interface VersionPage {
    count: number;
    next: string | null;
    previous: string | null;
    results: Version[]
}

export interface Titles {
    curr: string;
    prev: string
}