import type { JSX } from "react";
import api from "../../Auth/api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../../ui/card";
import { Plus} from "lucide-react";
import { sendNotification } from "@/lib/utils";


function CreateDocument(): JSX.Element {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createDoc = async () => {
        try {
            const response = await api.post('/api/documents/', {title: 'Untitled Document'});
            const newDoc = response.data;
            queryClient.invalidateQueries({ queryKey: ["documents"] });

            const params = new URLSearchParams({
              title: "Untitled Document",
              isEditable: "true",
            });
            navigate(`/documents/${newDoc.id}?${params.toString()}`)

        } catch(e){
          console.error(e);
          sendNotification('error', 'Could not create document :(');
        }
    };

    return (
        <Card className="mb-12 border-2 border-dashed hover:border-primary transition-smooth cursor-pointer group" onClick={createDoc}>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                <Plus className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Create New Document</h3>
                <p className="text-muted-foreground">Start a new collaborative document</p>
              </div>
            </div>
          </CardContent>
        </Card>
    )
}

export default CreateDocument;