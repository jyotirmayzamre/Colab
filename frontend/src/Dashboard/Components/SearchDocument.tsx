import { Search } from "lucide-react";
import { Input } from "@/ui/input";
import { useEffect, useRef, useState } from "react";


interface Props {
    query: string
    setQuery: React.Dispatch<React.SetStateAction<string>>
}



function SearchDocument({ query, setQuery }: Props){
    const [localQuery, setLocalQuery] = useState<string>(query);

    const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateQuery = (newQuery: string) => {
        setLocalQuery(newQuery);
        if(queryTimer.current){
            clearTimeout(queryTimer.current)
        }

        queryTimer.current = setTimeout(() => {
            setQuery(newQuery);
        }, 150);
    }

    useEffect(() => {
        setLocalQuery(query)
    }, [query]);

    return (
        <div className="mb-8 flex flex-col justify-center items-center">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search documents..."
                    value={localQuery}
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