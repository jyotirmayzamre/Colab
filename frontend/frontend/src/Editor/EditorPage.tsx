import { useParams } from "react-router-dom";
import EditorNavbar from "./Components/EditorNavbar";
import EditorComponent from "./Components/EditorComponent";
import { useSearchParams } from "react-router-dom";
import { EditorProvider } from "./Provider/EditorProvider";


function EditorPage(): JSX.Element {
    const params = useParams();
    const [docAttribs] = useSearchParams();
    const isEditable: boolean = JSON.parse(docAttribs.get('isEditable').toLowerCase());
    const title = docAttribs.get('title');


    return (
        <EditorProvider docId={params.docId} isEditable={isEditable} title={title}>
            <div className="min-h-screen flex flex-col">
                <EditorNavbar />
                <EditorComponent />
            </div>
        </EditorProvider>
        
    )
}

export default EditorPage;