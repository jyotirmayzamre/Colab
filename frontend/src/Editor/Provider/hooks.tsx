import { useContext, createContext } from 'react';
import { type EditorDataType, EditorMetaType } from '../types';


export const EditorDataContext = createContext<EditorDataType | null>(null)
export const EditorMetaContext = createContext<EditorMetaType | null>(null)



export const useEditorData = (): EditorDataType => {
    const context =  useContext(EditorDataContext);
    if(!context){
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context;
}

export const useEditorMeta = (): EditorMetaType => {
    const context =  useContext(EditorMetaContext);
    if(!context){
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context;
}



