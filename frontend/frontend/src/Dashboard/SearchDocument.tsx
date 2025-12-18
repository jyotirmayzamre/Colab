import { Search } from "lucide-react";
import { Input } from "@/Components/input";
import { useEffect, useState } from "react";
import { Document } from "./Dashboard";
import api from "@/Auth/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";



function SearchDocument(){
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<Document[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getData = async () => {
            try {
                const response = await api.get(`/api/documents/?search=${query}`);
                const data = response.data;
                setResults(data.results);
            } catch {
                Swal.fire({
                    title: 'Error!',
                    text: 'Could not search for documents :(',
                    icon: 'error',
                    showConfirmButton: false,
                    toast: true,
                    timer: 3000,
                    position: 'top',
                  })
            }
        }
        if(!query){
            setResults([]);
        } else{
            getData();
        }
    }, [query])


    return (
        <div className="mb-6 flex flex-col justify-center items-center">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search documents..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                    }}
                    className="pl-10 h-12 w-full"
                />

                {results && results.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-2 bg-[rgb(233,238,246)] shadow-lg rounded-md w-full z-10">
                        {results.map((doc) => (
                        <li
                            key={doc.id}
                            className="flex flex-col justify-center items-start p-2 text-sm hover:cursor-pointer hover:bg-gray-300 rounded-md"
                            onClick={() => {
                            setQuery('');
                            navigate(`/document/${doc.id}`);
                            }}
                        >
                            <span>{doc.title}</span>
                            <span className="text-gray-700">Access Level: {doc.access}</span>
                        </li>
                        ))}
                    </ul>
                    )}
            </div>
            
                
                    
        </div>
    )
}

export default SearchDocument;