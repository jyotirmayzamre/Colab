import { Search } from "lucide-react";
import { Input } from "@/Components/input";
import { useRef } from "react";


interface Props {
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
}



function SearchDocument({ query, setQuery }: Props){

    const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateQuery = (newQuery: string) => {
        if(queryTimer.current){
            clearTimeout(queryTimer.current)
        }

        queryTimer.current = setTimeout(() => {
            setQuery(newQuery);
        }, 250);
    }

    return (
        <div className="mb-6 flex flex-col justify-center items-center">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search documents..."
                    value={query}
                    onChange={(e) => {
                        updateQuery(e.target.value)
                    }}
                    className="pl-10 h-12 w-full"
                />
            </div>  
        </div>
    )
}

export default SearchDocument;