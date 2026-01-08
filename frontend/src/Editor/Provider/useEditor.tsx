import { useContext, createContext } from 'react';
import { type EditorContextType } from '../types';


export const EditorContext = createContext<EditorContextType | null>(null)


export const useEditor = (): EditorContextType => {
    const context =  useContext(EditorContext);
    if(!context){
        throw new Error('useEditor must be used within an EditorProvider')
    }
    return context;
}

