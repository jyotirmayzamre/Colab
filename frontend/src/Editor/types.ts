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

export interface EditorDataType {
    value: string,
    remoteCursors: Record<string, RemoteCursor>
    setValue: React.Dispatch<React.SetStateAction<string>>
}

export interface EditorMetaType {
    docTitle: string
    docId: string
    userCount: number
    isEditable: boolean
    crdtRef: React.MutableRefObject<CRDT>
    editorRef: React.MutableRefObject<EditorView>
    wsRef: React.MutableRefObject<WebSocket>
    setEditorRef: (view: EditorView) => void,
    setDocTitle: React.Dispatch<React.SetStateAction<string>>
}


export interface Version {
    id: number;
    title: string;
    created_at: string;
    creator_username: string;
}

export interface Permission {
    user: string,
    username: string,
    document: string,
    level: string,
    id: number
}
